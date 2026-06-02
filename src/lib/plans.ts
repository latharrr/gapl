export const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  basic: 5,
  pro: 20,
  premium: 50,
};

export const PLAN_PRICES_INR: Record<string, number> = {
  basic: 49,
  pro: 149,
  premium: 299,
};

export function normalizePlan(plan: unknown): string | null {
  if (typeof plan !== "string") return null;
  const normalized = plan.trim().toLowerCase();
  return normalized in PLAN_PRICES_INR || normalized === "free" ? normalized : null;
}
