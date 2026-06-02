import { NextRequest, NextResponse } from "next/server";
import { generateAICall } from "@/lib/ai-gateway";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME_CHARS = 3500;
const MAX_JD_CHARS = 1200;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + "\n[truncated]";
}

function buildCVPrompt(
  resumeText: string,
  role: string,
  seniority: string,
  companyType: string,
  companyName: string,
  jdText?: string
): string {
  const resume = truncate(resumeText.trim(), MAX_RESUME_CHARS);
  const jd = jdText ? truncate(jdText.trim(), MAX_JD_CHARS) : null;

  return `You are a world-class resume writer with 20 years of experience placing candidates at ${companyType} companies. Your goal is to produce a resume that scores 90+ on ATS systems for a ${seniority} ${role} role${companyName ? ` at ${companyName}` : ""}.

${jd ? `Job Description:\n${jd}\n` : ""}
Original Resume:
${resume}

ATS 90+ RULES (strictly follow all):
1. Use EXACT keywords from the job description and role — frequency matters
2. Every bullet MUST start with a strong past-tense action verb (Led, Built, Engineered, Reduced, Improved, Designed, Deployed, Increased, Automated, Optimised)
3. Every bullet MUST have a quantified metric — if the original has none, infer a realistic one from context
4. Skills section MUST contain all major technical keywords for a ${seniority} ${role} in ${companyType} companies
5. Objective must mention the exact role title and company type
6. Education section must list relevant coursework matching the role
7. Never fabricate experience, companies, or degrees — only enhance what exists
8. Remove anything that dilutes keyword density (generic filler phrases, weak verbs)
9. Keep section headings standard: OBJECTIVE, EDUCATION, SKILLS, EXPERIENCE, PROJECTS — ATS recognises these

Return ONLY valid JSON:

{
  "name": <string>,
  "phone": <string>,
  "location": <string>,
  "email": <string>,
  "linkedin": <string or "">,
  "github": <string or "">,
  "objective": <1-2 sentences, mention exact role title and ${companyType} company type>,
  "education": [
    {
      "degree": <string>,
      "institution": <string>,
      "year": <string>,
      "coursework": <comma-separated relevant courses for the role>
    }
  ],
  "skills": [
    { "category": <string>, "items": <comma-separated, dense with ATS keywords> }
  ],
  "experience": [
    {
      "role": <string>,
      "company": <string>,
      "location": <string>,
      "duration": <string>,
      "bullets": [<start with action verb + quantified metric>, ...]
    }
  ],
  "projects": [
    {
      "name": <string>,
      "description": <tech stack + quantified impact, mention relevant technologies for ${role}>
    }
  ],
  "activities": [<string>],
  "atsScore": <estimated ATS score 0-100, must be 90+ if you followed all rules>,
  "originalAtsScore": <estimated original ATS score>,
  "keywordsInjected": [<all keywords you added, max 15>],
  "bulletsImproved": <count of bullets you rewrote>,
  "topWin": <single most impactful change made>
}

Valid JSON only — no trailing commas, no markdown.`;
}

export async function POST(req: NextRequest) {
  try {
    let resumeText = "";
    let role = "";
    let seniority = "";
    let companyType = "";
    let companyName = "";
    let jdText = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // ── File upload path ──────────────────────────────────────────────────
      const form = await req.formData();
      role        = (form.get("role") as string) || "";
      seniority   = (form.get("seniority") as string) || "";
      companyType = (form.get("companyType") as string) || "";
      companyName = (form.get("companyName") as string) || "";
      jdText      = (form.get("jdText") as string) || "";

      const file = form.get("resumeFile") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.type === "text/plain") {
        resumeText = buffer.toString("utf-8");
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          // Extract text from PDF using unpdf
          const { extractText } = await import("unpdf");
          const result = await extractText(new Uint8Array(buffer), { mergePages: true });
          resumeText = Array.isArray(result.text) ? result.text.join(" ") : (result.text as string);
        } catch (pdfErr) {
          console.warn("unpdf extraction failed, trying pdf-parse fallback...", pdfErr);
          try {
            const pdf = await import("pdf-parse");
            const parser = ((pdf as any).default || pdf) as any;
            const data = await parser(buffer);
            resumeText = data.text || "";
          } catch (pdfErr2) {
            console.error("All PDF extraction libraries failed:", pdfErr2);
            // Last resort: extract printable ASCII characters
            resumeText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
          }
        }
      } else {
        // DOC/DOCX — best effort: read as text
        resumeText = buffer.toString("utf-8");
      }
    } else {
      // ── JSON / paste path ─────────────────────────────────────────────────
      const body = await req.json();
      resumeText  = body.resumeText  || "";
      role        = body.role        || "";
      seniority   = body.seniority   || "";
      companyType = body.companyType || "";
      companyName = body.companyName || "";
      jdText      = body.jdText      || "";
    }

    if (!role || !seniority || !companyType) {
      return NextResponse.json(
        { error: "role, seniority and companyType are required." },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.trim().length < 80) {
      return NextResponse.json(
        { error: "Resume content is too short. Please upload a valid resume." },
        { status: 400 }
      );
    }

    const prompt = buildCVPrompt(resumeText, role, seniority, companyType, companyName, jdText);

    try {
      const { parsed } = await generateAICall("resume-optimization", prompt, {
        temperature: 0.6,
      });

      return NextResponse.json({ result: parsed });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || "CV generation failed. Please try again." },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("CV Builder error:", error);
    return NextResponse.json(
      { error: error?.message || "CV generation failed. Please try again." },
      { status: 500 }
    );
  }
}
