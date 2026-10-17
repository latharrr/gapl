// Static content for landing page, pricing, and UI — no mock analysis data

export const PRICING_PLANS = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Get a feel for your readiness.",
    features: [
      "1 resume analysis",
      "ATS Score",
      "Basic skill gap list",
      "No roadmap",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Basic",
    price: 49,
    period: "one-time",
    description: "For a focused application sprint.",
    features: [
      "5 resume analyses",
      "Full recruiter simulation",
      "Career gap analysis",
      "4-week roadmap",
      "Printable CV export",
    ],
    cta: "Get Basic",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 149,
    period: "one-time",
    description: "For an active job search.",
    features: [
      "20 analyses each month",
      "Progress tracking",
      "Return user delta",
      "JD matching",
      "Shareable report summary",
    ],
    cta: "Get Pro",
    highlighted: true,
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
