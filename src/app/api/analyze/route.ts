import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { validateAnalysisPayload } from "@/lib/analysis-validation";
import { releaseAnalysis, reserveAnalysis, UsageLimitError } from "@/lib/analysis-usage";
import { generateAICall } from "@/lib/ai-gateway";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { buildAnalysisPrompt } from "@/lib/prompt";
import { takeRateLimit } from "@/lib/rate-limit";
import { type AnalysisResult } from "@/types/analysis";
import { extractText, validateResumeContent } from "@/lib/resume-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RESUME_TEXT_LENGTH = 50_000;
const MAX_JD_LENGTH = 10_000;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);
const ALLOWED_TIERS = new Set(["Mass Recruiter", "Product Startup", "Top Product"]);

function extension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  if (!takeRateLimit(`analyze:${user.uid}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many analysis requests. Please wait a few minutes.", code: "RATE_LIMITED" }, { status: 429 });
  }

  let reserved = false;
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume");
    const resumeText = String(formData.get("resumeText") || "").trim();
    const role = String(formData.get("role") || "").trim().slice(0, 80);
    const tier = String(formData.get("tier") || "").trim();
    const jdText = String(formData.get("jdText") || "").trim();

    if (!role || !ALLOWED_TIERS.has(tier)) {
      return NextResponse.json({ error: "Choose a valid role and company tier." }, { status: 400 });
    }
    if (jdText.length > MAX_JD_LENGTH || resumeText.length > MAX_RESUME_TEXT_LENGTH) {
      return NextResponse.json({ error: "The pasted content is too long. Shorten it and try again." }, { status: 400 });
    }

    let content = resumeText;
    if (resumeFile instanceof File && resumeFile.size > 0) {
      if (resumeFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File is too large. Upload a resume under 5 MB." }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.has(resumeFile.type) && !ALLOWED_EXTENSIONS.has(extension(resumeFile.name))) {
        return NextResponse.json({ error: "Upload a PDF or TXT resume. For DOCX files, paste the resume text." }, { status: 400 });
      }
      try {
        content = await extractText(resumeFile);
      } catch {
        return NextResponse.json({ error: "Could not read the file. If it is scanned, paste your resume text instead." }, { status: 400 });
      }
    }

    if (content.length > MAX_RESUME_TEXT_LENGTH) {
      return NextResponse.json({ error: "Resume content is too long. Shorten it and try again." }, { status: 400 });
    }
    const validation = validateResumeContent(content);
    if (!validation.isResume) return NextResponse.json({ error: validation.reason, code: "NOT_A_RESUME" }, { status: 422 });

    await reserveAnalysis(user.uid, user.plan);
    reserved = true;

    const { parsed, traceId } = await generateAICall("ats-evaluation", buildAnalysisPrompt(content, role, tier, jdText || undefined), {
      userId: user.uid,
      temperature: 0.4,
    });
    const safePayload = validateAnalysisPayload(parsed);
    const createdAt = new Date().toISOString();
    const reportRef = getAdminDb().collection("reports").doc();
    const result: AnalysisResult = { id: reportRef.id, createdAt, role, companyTier: tier, ...safePayload };

    await reportRef.set({
      ...result,
      userId: user.uid,
      status: "success",
      traceId,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: createdAt,
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (reserved) await releaseAnalysis(user.uid).catch(console.error);
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message, code: "LIMIT_REACHED" }, { status: 403 });
    }
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again.", code: "ANALYSIS_FAILED" }, { status: 500 });
  }
}
