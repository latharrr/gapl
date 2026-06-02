// ─── Usage Quota ──────────────────────────────────────────────────────────────
// Free tier: FREE_LIMIT analyses per month
// Stored in localStorage (client-side). Replace with Firestore for server enforcement.

export const FREE_LIMIT = 3;
const STORAGE_KEY = "gapl_usage";

interface UsageRecord {
  count: number;
  month: string; // "YYYY-MM"
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getRecord(): UsageRecord {
  if (typeof window === "undefined") return { count: 0, month: currentMonth() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, month: currentMonth() };
    const rec = JSON.parse(raw) as UsageRecord;
    // Reset if new month
    if (rec.month !== currentMonth()) return { count: 0, month: currentMonth() };
    return rec;
  } catch {
    return { count: 0, month: currentMonth() };
  }
}

function saveRecord(rec: UsageRecord) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
}

/** How many analyses the user has used this month */
export function getUsageCount(): number {
  return getRecord().count;
}

/** How many analyses remain this month */
export function getRemainingAnalyses(): number {
  return Math.max(0, FREE_LIMIT - getRecord().count);
}

/** Returns true if the user can run another analysis */
export function canRunAnalysis(): boolean {
  return getRecord().count < FREE_LIMIT;
}

/** Call this after a successful analysis to increment the counter */
export function incrementUsage(): void {
  const rec = getRecord();
  saveRecord({ count: rec.count + 1, month: currentMonth() });
}

/** Reset usage (call after user upgrades to Pro) */
export function resetUsage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
