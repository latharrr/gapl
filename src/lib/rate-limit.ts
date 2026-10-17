import { getAdminDb } from "./firebase-admin";

/**
 * Fixed-window rate limiter shared across every serverless instance.
 *
 * Counters live in Firestore (`rate_limits/{key}`), so a limit holds no matter
 * which Vercel instance serves the request. Each doc carries `expiresAt`; add a
 * Firestore TTL policy on that field to clean old windows up automatically.
 *
 * If Firestore is unreachable (e.g. local dev without admin credentials) it
 * falls back to a per-instance in-memory window rather than failing open.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, Bucket>();

function takeFromMemory(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const current = memoryBuckets.get(key);
  if (!current || current.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= maxRequests) return false;
  current.count += 1;
  return true;
}

export async function takeRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const docId = key.replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 300);
  try {
    const db = getAdminDb();
    const ref = db.collection("rate_limits").doc(docId);
    return await db.runTransaction(async (tx) => {
      const now = Date.now();
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as Partial<Bucket>) : undefined;
      if (!data || typeof data.resetAt !== "number" || data.resetAt <= now) {
        tx.set(ref, { count: 1, resetAt: now + windowMs, expiresAt: new Date(now + windowMs) });
        return true;
      }
      const count = typeof data.count === "number" ? data.count : 0;
      if (count >= maxRequests) return false;
      tx.update(ref, { count: count + 1 });
      return true;
    });
  } catch (err) {
    console.warn("Rate limit store unavailable; using in-memory fallback:", err instanceof Error ? err.message : err);
    return takeFromMemory(key, maxRequests, windowMs);
  }
}
