export type Verdict = "Shortlist" | "Maybe" | "Reject";
export type Priority = "Critical" | "High" | "Medium" | "Low";
export type SkillLevel = "None" | "Beginner" | "Intermediate" | "Advanced";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface RecruiterVerdict {
  verdict: Verdict;
  confidence: number;
  reason: string;
  strongestSignal: string;
  topGap: string;
  whatWouldChangeDecision: string;
}

export interface ReadinessComponent {
  score: number;
}

export interface ReadinessBreakdown {
  skillMatch: ReadinessComponent;
  projectComplexity: ReadinessComponent;
  deploymentEvidence: ReadinessComponent;
  teamCollaboration: ReadinessComponent;
}

export interface CareerGap {
  skill: string;
  currentLevel: SkillLevel;
  priority: Priority;
  recommendedProject: string;
  difficulty: Difficulty;
  estimatedWeeks: number;
  expectedReadinessAfter: number;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  description: string;
  tasks: string[];
  milestone: string;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  role: string;
  companyTier: string;
  atsScore: number;
  readiness: number;
  recruiterVerdict: RecruiterVerdict;
  readinessBreakdown: ReadinessBreakdown;
  careerGaps: CareerGap[];
  roadmap: RoadmapWeek[];
  missingSkills: string[];
  strongSkills: string[];
}
