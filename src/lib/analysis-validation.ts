import { type AnalysisResult, type CareerGap, type ReadinessBreakdown, type RecruiterVerdict, type RoadmapWeek } from "@/types/analysis";

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`AI response is missing ${label}.`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string, max = 500): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`AI response is missing ${label}.`);
  return value.trim().slice(0, max);
}

function score(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`AI response has an invalid ${label}.`);
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function stringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, maxItems)
    .map((item) => item.trim().slice(0, 120));
}

export function validateAnalysisPayload(payload: unknown): Omit<AnalysisResult, "id" | "createdAt" | "role" | "companyTier"> {
  const root = record(payload, "analysis");
  const verdictData = record(root.recruiterVerdict, "recruiter verdict");
  const breakdownData = record(root.readinessBreakdown, "readiness breakdown");
  const verdict = string(verdictData.verdict, "recruiter verdict", 20);

  if (!["Shortlist", "Maybe", "Reject"].includes(verdict)) {
    throw new Error("AI response has an invalid recruiter verdict.");
  }

  const recruiterVerdict: RecruiterVerdict = {
    verdict: verdict as RecruiterVerdict["verdict"],
    confidence: score(verdictData.confidence, "confidence"),
    reason: string(verdictData.reason, "verdict reason"),
    strongestSignal: string(verdictData.strongestSignal, "strongest signal"),
    topGap: string(verdictData.topGap, "top gap"),
    whatWouldChangeDecision: string(verdictData.whatWouldChangeDecision, "decision guidance"),
  };

  const component = (key: keyof ReadinessBreakdown) => ({
    score: score(record(breakdownData[key], `${key} score`).score, key),
  });
  const readinessBreakdown: ReadinessBreakdown = {
    skillMatch: component("skillMatch"),
    projectComplexity: component("projectComplexity"),
    deploymentEvidence: component("deploymentEvidence"),
    teamCollaboration: component("teamCollaboration"),
  };

  const careerGaps: CareerGap[] = Array.isArray(root.careerGaps)
    ? root.careerGaps.slice(0, 5).map((item, index) => {
        const gap = record(item, `career gap ${index + 1}`);
        return {
          skill: string(gap.skill, "gap skill", 100),
          currentLevel: string(gap.currentLevel, "current level", 20) as CareerGap["currentLevel"],
          priority: string(gap.priority, "priority", 20) as CareerGap["priority"],
          recommendedProject: string(gap.recommendedProject, "recommended project"),
          difficulty: string(gap.difficulty, "difficulty", 20) as CareerGap["difficulty"],
          estimatedWeeks: Math.min(52, Math.max(1, Math.round(Number(gap.estimatedWeeks) || 1))),
          expectedReadinessAfter: score(gap.expectedReadinessAfter, "expected readiness"),
        };
      })
    : [];

  const roadmap: RoadmapWeek[] = Array.isArray(root.roadmap)
    ? root.roadmap.slice(0, 4).map((item, index) => {
        const week = record(item, `roadmap week ${index + 1}`);
        return {
          week: Math.min(4, Math.max(1, Math.round(Number(week.week) || index + 1))),
          title: string(week.title, "roadmap title", 120),
          description: string(week.description, "roadmap description"),
          tasks: stringArray(week.tasks, 6),
          milestone: string(week.milestone, "roadmap milestone"),
        };
      })
    : [];

  if (careerGaps.length === 0 || roadmap.length === 0) {
    throw new Error("AI response did not include actionable gaps and a roadmap.");
  }

  return {
    atsScore: score(root.atsScore, "ATS score"),
    readiness: score(root.readiness, "readiness"),
    recruiterVerdict,
    readinessBreakdown,
    careerGaps,
    roadmap,
    missingSkills: stringArray(root.missingSkills, 8),
    strongSkills: stringArray(root.strongSkills, 6),
  };
}
