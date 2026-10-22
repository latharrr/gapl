// Roles and company tiers a resume can be read against. Shared by the landing hero and /analyze.
export const ROLES = ["SDE Intern", "SDE Full Time", "Data Analyst", "AI/ML Engineer", "Product Manager"];

export const TIERS = [
  { label: "Mass Recruiter", description: "Companies hiring 500+ engineers/year" },
  { label: "Product Startup", description: "Series A–C startups with strong engineering culture" },
  { label: "Top Product", description: "FAANG, Stripe, Razorpay, Notion-tier companies" },
];

export function analyzeHref(role?: string, tier?: string): string {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (tier) params.set("tier", tier);
  const qs = params.toString();
  return qs ? `/analyze?${qs}` : "/analyze";
}
