// One-time credit packs. Credits never expire; one credit = one analysis, CV build or tailor.
// Prices are sized for Claude Opus 5.5 at roughly ₹9–12 of model cost per credit.

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  description: string;
  highlighted: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: 4, priceInr: 99, description: "Check one resume, fix it, check again.", highlighted: false },
  { id: "plus", name: "Plus", credits: 10, priceInr: 199, description: "For a placement season across a few roles.", highlighted: true },
  { id: "pro", name: "Pro", credits: 20, priceInr: 349, description: "Tailor a CV for every application.", highlighted: false },
];

/** Credits a new account starts with. Granted once, at signup. */
export const FREE_SIGNUP_CREDITS = 1;

export function getPack(id: unknown): CreditPack | null {
  if (typeof id !== "string") return null;
  const normalized = id.trim().toLowerCase();
  return CREDIT_PACKS.find((pack) => pack.id === normalized) ?? null;
}

export function pricePerCredit(pack: CreditPack): number {
  return Math.round((pack.priceInr / pack.credits) * 100) / 100;
}

// Monthly plans sold before 2026-10-24, kept only to give their buyers a starting balance.
const LEGACY_PLAN_CREDITS: Record<string, number> = { basic: 5, pro: 20, premium: 50 };

/**
 * Starting balance for a user document written before credits existed.
 * Free users who already ran an analysis have used their one free credit.
 */
export function initialCreditsFor(data: { plan?: unknown; analysisCount?: unknown }): number {
  const plan = String(data.plan || "free").toLowerCase();
  if (plan in LEGACY_PLAN_CREDITS) return LEGACY_PLAN_CREDITS[plan];
  return Number(data.analysisCount || 0) > 0 ? 0 : FREE_SIGNUP_CREDITS;
}

/** The user's credit balance, backfilling documents written before credits existed. */
export function creditBalance(data: { credits?: unknown; plan?: unknown; analysisCount?: unknown }): number {
  if (typeof data.credits === "number" && Number.isFinite(data.credits)) return Math.max(0, Math.floor(data.credits));
  return initialCreditsFor(data);
}
