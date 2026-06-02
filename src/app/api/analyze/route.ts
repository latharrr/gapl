import { NextRequest, NextResponse } from "next/server";
import { buildAnalysisPrompt } from "@/lib/prompt";
import { type AnalysisResult } from "@/types/analysis";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { generateAICall } from "@/lib/ai-gateway";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".txt"]);

// ─── Resume content detector ──────────────────────────────────────────────────
// Returns { isResume: boolean, reason: string }
function validateResumeContent(text: string): { isResume: boolean; reason: string } {
  const lower = text.toLowerCase();

  // Must have minimum meaningful length
  if (text.trim().length < 100) {
    return { isResume: false, reason: "Content is too short to be a resume." };
  }

  // Strong positive resume signals
  const STRONG_SIGNALS = [
    "experience", "education", "skills", "projects", "work experience",
    "internship", "objective", "summary", "achievements", "certifications",
    "curriculum vitae", "resume", "cgpa", "gpa", "b.tech", "b.e.", "b.sc",
    "m.tech", "bachelor", "master", "degree", "university", "college",
    "linkedin", "github", "references",
  ];

  // Negative signals — clearly not a resume
  const NEGATIVE_SIGNALS = [
    "chapter ", "table of contents", "abstract:", "keywords:", "doi:",
    "restaurant", "menu item", "price:", "calories:", "invoice", "receipt",
    "total amount due", "quantity", "unit price", "purchase order",
    "dear sir/madam", "to whom it may concern", "sincerely yours",
    "bibliography", "references cited",
  ];

  const positiveMatches = STRONG_SIGNALS.filter((s) => lower.includes(s));
  const negativeMatches = NEGATIVE_SIGNALS.filter((s) => lower.includes(s));

  // If we find clear negative signals, reject
  if (negativeMatches.length >= 2) {
    return {
      isResume: false,
      reason: `This doesn't look like a resume. We detected content typical of a ${
        negativeMatches.includes("menu item") || negativeMatches.includes("restaurant")
          ? "menu"
          : negativeMatches.includes("invoice") || negativeMatches.includes("receipt")
          ? "financial document"
          : negativeMatches.includes("chapter ")
          ? "book or article"
          : negativeMatches.includes("dear sir/madam")
          ? "cover letter or formal letter"
          : "non-resume document"
      }.`,
    };
  }

  // Must match at least 3 positive resume signals
  if (positiveMatches.length < 3) {
    return {
      isResume: false,
      reason:
        "This doesn't look like a resume. Please upload your CV or resume (PDF, DOC, or DOCX) containing your education, skills, and experience.",
    };
  }

  return { isResume: true, reason: "" };
}

// ─── File text extraction ─────────────────────────────────────────────────────
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const { extractText } = await import("unpdf");
    const { text } = await extractText(buffer, { mergePages: true });
    return text;
  }
  return await file.text();
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const resumeFile = formData.get("resume") as File | null;
    const resumeText = formData.get("resumeText") as string | null;
    const role = formData.get("role") as string;
    const tier = formData.get("tier") as string;
    const jdText = formData.get("jdText") as string | null;
    const userId = formData.get("userId") as string | null;

    if (!role || !tier) {
      return NextResponse.json({ error: "Role and tier are required." }, { status: 400 });
    }

    // ── Server-side quota validation ──
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.plan !== "pro") {
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            const reportsRef = collection(db, "reports");
            const q = query(reportsRef, where("userId", "==", userId));
            const snap = await getDocs(q);
            const currentMonthReports = snap.docs.filter((d) => {
              const data = d.data();
              if (!data.createdAt) return false;
              const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
              const mStr = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
              return mStr === currentMonthStr;
            });

            if (currentMonthReports.length >= 3) {
              return NextResponse.json(
                { error: "Monthly free analysis limit reached. Upgrade to Pro for unlimited reports.", code: "LIMIT_REACHED" },
                { status: 403 }
              );
            }
          }
        }
      } catch (err) {
        console.error("Quota validation failed:", err);
      }
    }

    // ── 1. File type validation ──────────────────────────────────────────────
    if (resumeFile && resumeFile.size > 0) {
      const mimeOk = ALLOWED_MIME_TYPES.has(resumeFile.type);
      const ext = resumeFile.name.slice(resumeFile.name.lastIndexOf(".")).toLowerCase();
      const extOk = ALLOWED_EXTENSIONS.has(ext);

      if (!mimeOk && !extOk) {
        return NextResponse.json(
          {
            error: `Unsupported file type "${ext || resumeFile.type}". Please upload a PDF, DOC, DOCX, or TXT resume.`,
            code: "INVALID_FILE_TYPE",
          },
          { status: 400 }
        );
      }

      // ── 2. File size limit (5 MB) ────────────────────────────────────────
      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
      if (resumeFile.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File is too large. Please upload a resume under 5 MB.", code: "FILE_TOO_LARGE" },
          { status: 400 }
        );
      }
    }

    // ── 3. Extract text ──────────────────────────────────────────────────────
    let content = "";
    if (resumeFile && resumeFile.size > 0) {
      try {
        content = await extractTextFromFile(resumeFile);
      } catch {
        return NextResponse.json(
          {
            error:
              "Could not read your file. If it's a scanned PDF, please paste your resume text instead.",
            code: "PARSE_FAILED",
          },
          { status: 400 }
        );
      }
    } else if (resumeText?.trim()) {
      content = resumeText.trim();
    }

    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "Resume content is too short or could not be extracted. Please paste your resume text directly.",
          code: "CONTENT_TOO_SHORT",
        },
        { status: 400 }
      );
    }

    // ── 4. CV content validation ─────────────────────────────────────────────
    const { isResume, reason } = validateResumeContent(content);
    if (!isResume) {
      return NextResponse.json(
        { error: reason, code: "NOT_A_RESUME" },
        { status: 422 }
      );
    }

    // ── 5. Run AI analysis ───────────────────────────────────────────────────
    const prompt = buildAnalysisPrompt(content, role, tier, jdText || undefined);

    try {
      const { parsed } = await generateAICall("ats-evaluation", prompt, {
        userId: userId || "anonymous",
      });

      const result: AnalysisResult = {
        id: `report-${Date.now()}`,
        createdAt: new Date().toISOString(),
        role,
        companyTier: tier,
        ...parsed,
      };

      return NextResponse.json({ result });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "Analysis failed. Please try again.", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error?.message || "Analysis failed. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
