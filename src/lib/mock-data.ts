import { CREDIT_PACKS, pricePerCredit } from "./plans";
// Static content for landing page, pricing, and UI — no mock analysis data

// Every pack gets the full product; packs differ only in how many credits they hold
// (PLAN_LIMITS in src/lib/plans.ts). Analyses, CV builds and tailoring each use one.
// Public price list: the free signup credit, then the one-time packs from lib/plans.
export const PRICING_PLANS = [
  {
    name: "Free",
    price: 0,
    description: "Check where you stand.",
    features: [
      "1 free credit when you sign up",
      "Recruiter verdict with reasons",
      "Career gaps and roadmap",
      "CV builder and tailoring",
    ],
    cta: "Start free",
    highlighted: false,
  },
  ...CREDIT_PACKS.map((pack) => ({
    name: pack.name,
    price: pack.priceInr,
    description: pack.description,
    features: [
      `${pack.credits} credits · ₹${pricePerCredit(pack)} each`,
      "Credits never expire",
      "Everything in Free",
    ],
    cta: `Get ${pack.credits} credits`,
    highlighted: pack.highlighted,
  })),
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "UPLOAD",
    title: "Upload your resume",
    description: "Drop a PDF or paste the text. Gapl parses every section: skills, projects, experience, education.",
  },
  {
    step: "TARGET",
    title: "Pick a role and tier",
    description: "An SDE intern at a product startup needs a very different profile than one at a mass recruiter.",
  },
  {
    step: "READ",
    title: "Recruiter read",
    description: "Gapl reads your resume the way a recruiter at that tier would, then prints a verdict with its reasons.",
  },
  {
    step: "ROUTE",
    title: "Your route",
    description: "A week-by-week plan to close the gaps: specific projects, timelines, and the readiness to expect.",
  },
];

export const ANALYSIS_STAGES = [
  { id: "parse", label: "Parsing Resume" },
  { id: "jd", label: "Comparing with Job Description" },
  { id: "recruiter", label: "Simulating Recruiter" },
  { id: "roadmap", label: "Building Roadmap" },
  { id: "readiness", label: "Calculating Readiness" },
];
