// Static content for landing page, pricing, and UI — no mock analysis data

export const TESTIMONIALS = [
  {
    name: "Aryan Mehta",
    role: "SDE Intern @ Razorpay",
    avatar: "AM",
    text: "Gapl told me exactly what was wrong. I had no deployed projects. Built one in 3 weeks, updated my resume, got shortlisted by 4 companies the next month.",
    result: "Reject → Shortlist",
  },
  {
    name: "Priya Sharma",
    role: "Data Analyst @ Zepto",
    avatar: "PS",
    text: "The recruiter simulation was scary accurate. It said I'd get rejected because of vague project descriptions. Fixed them using the feedback. Got my first offer in 6 weeks.",
    result: "65% → 89% Readiness",
  },
  {
    name: "Karan Joshi",
    role: "SDE @ Cred",
    avatar: "KJ",
    text: "I'd been applying for 3 months with no response. Gapl identified my backend gap in 30 seconds. The roadmap it gave me was exactly what I needed.",
    result: "3 months → 6 weeks to offer",
  },
];

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
    period: "month",
    description: "For serious job seekers.",
    features: [
      "5 resume analyses",
      "Full recruiter simulation",
      "Career gap analysis",
      "4-week roadmap",
      "PDF export",
    ],
    cta: "Get Basic",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 149,
    period: "month",
    description: "Track progress over time.",
    features: [
      "Unlimited analyses",
      "Progress tracking",
      "Return user delta",
      "JD matching",
      "Shareable report card",
      "Priority support",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Premium",
    price: 299,
    period: "month",
    description: "For placement cells & bootcamps.",
    features: [
      "Everything in Pro",
      "Team dashboard",
      "Bulk uploads",
      "Custom branding",
      "LaTeX resume export",
      "Dedicated support",
    ],
    cta: "Get Premium",
    highlighted: false,
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Upload Your Resume",
    description:
      "Drop your PDF or paste your content. We parse every section — skills, projects, experience, education.",
  },
  {
    step: "02",
    title: "Select Role & Target",
    description:
      "Tell us what you're applying for and at what tier. SDE Intern at a product startup needs a very different profile than a mass recruiter.",
  },
  {
    step: "03",
    title: "Recruiter Simulation",
    description:
      "Our AI simulates how a recruiter at your target company would read your resume. 6 seconds. First impression. Real feedback.",
  },
  {
    step: "04",
    title: "Get Your Roadmap",
    description:
      "Week-by-week plan to close the gap. Not generic advice — specific projects, timelines, and expected readiness improvement.",
  },
];

export const ANALYSIS_STAGES = [
  { id: "parse", label: "Parsing Resume", duration: 1800 },
  { id: "role", label: "Understanding Role", duration: 1400 },
  { id: "ats", label: "Running ATS Check", duration: 2000 },
  { id: "recruiter", label: "Simulating Recruiter", duration: 2200 },
  { id: "roadmap", label: "Building Roadmap", duration: 1800 },
];
