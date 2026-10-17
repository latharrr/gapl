// Static content for landing page, pricing, and UI — no mock analysis data

// Every plan gets the full product; plans differ only in monthly analysis credits
// (PLAN_LIMITS in src/lib/plans.ts). Analyses, CV builds and tailoring each use one.
export const PRICING_PLANS = [
  {
    name: "Free",
    price: 0,
    period: "free",
    description: "Check where you stand.",
    features: [
      "1 analysis a month",
      "Recruiter verdict with reasons",
      "Career gaps and roadmap",
      "CV builder and tailoring",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Basic",
    price: 49,
    period: "one-time",
    description: "For a focused application sprint.",
    features: [
      "5 analyses a month",
      "Everything in Free",
      "Re-check after each build",
    ],
    cta: "Get Basic",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 149,
    period: "one-time",
    description: "For an active placement season.",
    features: [
      "20 analyses a month",
      "Everything in Free",
      "Check several roles and tiers",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Premium",
    price: 299,
    period: "one-time",
    description: "For heavy tailoring across many applications.",
    features: [
      "50 analyses a month",
      "Everything in Free",
      "Tailor a CV for every application",
    ],
    cta: "Get Premium",
    highlighted: false,
  },
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
