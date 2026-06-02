import { NextRequest, NextResponse } from "next/server";
import { generateAICall } from "@/lib/ai-gateway";
import { releaseAnalysis, reserveAnalysis, UsageLimitError } from "@/lib/analysis-usage";
import { requireUser } from "@/lib/firebase-admin";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME_CHARS = 3500;
const MAX_JD_CHARS = 1000;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + "\n[truncated]";
}

function buildTailorPrompt(resumeText: string, role: string, tier: string, jdText?: string): string {
  const resume = truncate(resumeText.trim(), MAX_RESUME_CHARS);
  const jd = jdText ? truncate(jdText.trim(), MAX_JD_CHARS) : null;

  return `You are an expert resume writer. Rewrite this resume to maximise shortlisting at a ${tier} company for a ${role} role.
${jd ? `\nJob Description:\n${jd}\n` : ""}
Original Resume:
${resume}

Rules:
- Keep all real facts — NEVER invent experience, companies, or metrics
- Rewrite bullets: strong action verbs + quantified impact wherever real data exists
- Add ATS keywords for the role and tier
- Remove weak or irrelevant content
- Objective must be laser-focused on this specific role and tier

Return ONLY valid JSON — no markdown, no explanation:

{
  "name": <full name string>,
  "phone": <string>,
  "location": <city, state/country>,
  "email": <string>,
  "linkedin": <url or empty string>,
  "github": <url or empty string>,
  "objective": <1-2 sentence tailored objective>,
  "education": [
    {
      "degree": <string>,
      "institution": <string>,
      "year": <string>,
      "coursework": <comma-separated relevant courses or empty string>
    }
  ],
  "skills": [
    { "category": <string>, "items": <comma-separated string> }
  ],
  "experience": [
    {
      "role": <string>,
      "company": <string>,
      "location": <string>,
      "duration": <string>,
      "bullets": [<string>, <string>, <string>]
    }
  ],
  "projects": [
    {
      "name": <string>,
      "description": <string with tech stack and quantified impact>
    }
  ],
  "activities": [<string>],
  "changes": [
    {
      "type": <"improved"|"added"|"removed"|"reordered">,
      "section": <string>,
      "description": <one sentence>
    }
  ],
  "keywordsAdded": [<max 10 strings>],
  "beforeAtsScore": <0-100>,
  "afterAtsScore": <0-100>,
  "topChange": <string>
}

Rules: changes 4-8 items, afterAtsScore > beforeAtsScore, valid JSON no trailing commas.`;
}

export async function POST(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  if (!takeRateLimit(`tailor:${user.uid}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many tailoring requests. Please wait a few minutes." }, { status: 429 });
  }

  let reserved = false;
  try {
    const body = await req.json();
    const { resumeText, role, tier, jdText } = body as {
      resumeText: string;
      role: string;
      tier: string;
      jdText?: string;
    };

    if (!resumeText || !role || !tier) {
      return NextResponse.json({ error: "resumeText, role, and tier are required." }, { status: 400 });
    }
    if (resumeText.trim().length < 100) {
      return NextResponse.json({ error: "Resume text is too short to tailor." }, { status: 400 });
    }
    if (resumeText.length > 50000 || (jdText && jdText.length > 10000) || role.length > 80 || tier.length > 80) {
      return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 });
    }

    const prompt = buildTailorPrompt(resumeText, role, tier, jdText);

    try {
      await reserveAnalysis(user.uid, user.plan);
      reserved = true;
      const { parsed } = await generateAICall("resume-optimization", prompt, {
        userId: user.uid,
        temperature: 0.7,
      });

      return NextResponse.json({ result: parsed });
    } catch (err: unknown) {
      if (reserved) await releaseAnalysis(user.uid).catch(console.error);
      if (err instanceof UsageLimitError) {
        return NextResponse.json({ error: err.message, code: "LIMIT_REACHED" }, { status: 403 });
      }
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Tailoring failed. Please try again." },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Tailor error:", error);
    return NextResponse.json(
      { error: error?.message || "Tailoring failed. Please try again." },
      { status: 500 }
    );
  }
}
