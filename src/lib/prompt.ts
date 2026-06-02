import { type AnalysisResult } from "@/types/analysis";

// Free Groq tier: 8000 TPM — keep prompt under ~5500 tokens to leave room for output
const MAX_RESUME_CHARS = 3500; // ≈ 875 tokens
const MAX_JD_CHARS = 1000;     // ≈ 250 tokens

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n[truncated for length]";
}

export function buildAnalysisPrompt(
  resumeText: string,
  role: string,
  tier: string,
  jdText?: string
): string {
  const resume = truncate(resumeText.trim(), MAX_RESUME_CHARS);
  const jd = jdText ? truncate(jdText.trim(), MAX_JD_CHARS) : null;

  return `You are a senior technical recruiter with 15 years of experience at top tech companies. Analyze the resume below for a **${role}** role at a **${tier}** company.

Tier context:
- Mass Recruiter: volume hiring, emphasis on basics
- Product Startup: shipped projects, backend depth
- Top Product: FAANG-tier, system design, deep impact
${jd ? `\nJob Description:\n${jd}\n` : ""}
Resume:
${resume}

Be brutally honest. Think like a recruiter spending 6 seconds on this resume.

Return ONLY valid JSON — no markdown, no explanation:

{
  "atsScore": <0-100>,
  "readiness": <0-100, weighted: skillMatch×0.4 + projectComplexity×0.3 + deploymentEvidence×0.2 + teamCollab×0.1>,
  "recruiterVerdict": {
    "verdict": <"Shortlist"|"Maybe"|"Reject">,
    "confidence": <0-100>,
    "reason": <2-3 sentences, specific>,
    "strongestSignal": <string>,
    "topGap": <string>,
    "whatWouldChangeDecision": <string>
  },
  "readinessBreakdown": {
    "skillMatch": { "score": <0-100> },
    "projectComplexity": { "score": <0-100> },
    "deploymentEvidence": { "score": <0-100> },
    "teamCollaboration": { "score": <0-100> }
  },
  "careerGaps": [
    {
      "skill": <string>,
      "currentLevel": <"None"|"Beginner"|"Intermediate"|"Advanced">,
      "priority": <"Critical"|"High"|"Medium"|"Low">,
      "recommendedProject": <specific project to build>,
      "difficulty": <"Easy"|"Medium"|"Hard">,
      "estimatedWeeks": <number>,
      "expectedReadinessAfter": <0-100>
    }
  ],
  "roadmap": [
    {
      "week": <1-4>,
      "title": <string>,
      "description": <string>,
      "tasks": [<string>, <string>, <string>],
      "milestone": <one measurable outcome>
    }
  ],
  "missingSkills": [<max 8 strings>],
  "strongSkills": [<max 6 strings>]
}

Rules: careerGaps 3-5 items most critical first, roadmap exactly 4 weeks, expectedReadinessAfter > current readiness, valid JSON no trailing commas.`;
}
