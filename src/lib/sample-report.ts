// Illustrative sample report. Shown on the landing page and /demo, always labelled "Sample".
// Not real AI output and not a real candidate.
import type { Verdict } from "@/components/ui/Badge";

export const SAMPLE = {
  role: "SDE Intern",
  companyTier: "Product Startup",
  atsScore: 68,
  readiness: 65,
  verdict: "Reject" as Verdict,
  confidence: 72,
  reason:
    "Strong academics but missing deployed projects. Resume lacks evidence of real-world impact — no production systems, no GitHub contributions with meaningful stars, no backend depth.",
  strongestSignal: "IIT/NIT academic foundation — recognized tier",
  topGap: "Zero deployed projects visible in resume",
  whatWouldChangeDecision:
    "One end-to-end deployed SaaS or API with documented impact (users, requests, uptime) would flip this to a shortlist.",
  breakdown: [
    { key: "skillMatch", label: "Skill match", score: 78, pulledBy: "Core DSA and React present; no backend framework listed" },
    { key: "projectComplexity", label: "Project complexity", score: 70, pulledBy: "Two coursework CRUD apps, no auth or payments" },
    { key: "deploymentEvidence", label: "Deployment evidence", score: 42, pulledBy: "Zero deployed projects visible in resume" },
    { key: "teamCollaboration", label: "Team collaboration", score: 70, pulledBy: "One hackathon team; no open-source PRs" },
  ],
  gaps: [
    { skill: "Backend Development", priority: "Critical", recommendedProject: "Expense Tracking SaaS", estimatedWeeks: 3, expectedReadinessAfter: 78 },
    { skill: "Deployment & DevOps", priority: "High", recommendedProject: "Deploy any project on Railway/Render", estimatedWeeks: 1, expectedReadinessAfter: 69 },
    { skill: "System Design", priority: "High", recommendedProject: "Design a URL Shortener", estimatedWeeks: 1, expectedReadinessAfter: 72 },
  ],
  // The route the sample roadmap takes, in build order. Readiness values are illustrative.
  route: [
    { code: "STN", label: "Today", build: "Resume as it stands", weeks: 0, readiness: 65, status: "WL 3" },
    { code: "W1", label: "Week 1", build: "Deploy any project on Railway/Render", closes: "Deployment & DevOps", weeks: 1, readiness: 69, status: "WL 2" },
    { code: "W2", label: "Week 2", build: "Design a URL Shortener", closes: "System Design", weeks: 1, readiness: 72, status: "WL 1" },
    { code: "W3–5", label: "Weeks 3–5", build: "Expense Tracking SaaS", closes: "Backend Development", weeks: 3, readiness: 78, status: "RAC" },
  ],
} as const;

/** Gaps standing between a resume and a shortlist: Critical + High priority gaps. */
export function waitlistCount(gaps: ReadonlyArray<{ priority: string }>): number {
  return gaps.filter((g) => g.priority === "Critical" || g.priority === "High").length;
}
