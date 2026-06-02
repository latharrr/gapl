import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase-admin";
import { extractText, validateResumeContent } from "@/lib/resume-parser";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

function extension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    const userOrError = await requireUser(req);
    if (userOrError instanceof NextResponse) return userOrError;

    const formData = await req.formData();
    const resumeFile = formData.get("resume");
    const resumeText = String(formData.get("resumeText") || "").trim();

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

    const validation = validateResumeContent(content);
    if (!validation.isResume) {
      return NextResponse.json({ error: validation.reason, code: "NOT_A_RESUME" }, { status: 422 });
    }

    return NextResponse.json({ success: true, textLength: content.length });
  } catch (err: any) {
    console.error("Resume validation error:", err);
    return NextResponse.json({ error: err.message || "Failed to validate resume." }, { status: 500 });
  }
}
