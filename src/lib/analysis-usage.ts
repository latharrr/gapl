import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { PLAN_LIMITS } from "./plans";

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export class UsageLimitError extends Error {
  constructor(public readonly limit: number) {
    super(`Monthly analysis limit reached. Your plan includes ${limit} analysis${limit === 1 ? "" : "es"} per month.`);
  }
}

export async function reserveAnalysis(uid: string, fallbackPlan: string) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const month = currentMonth();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.exists ? snapshot.data() ?? {} : {};
    const plan = String(data.plan || fallbackPlan || "free").toLowerCase();
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const count = data.analysisUsageMonth === month ? Number(data.analysisUsageCount || 0) : 0;

    if (data.suspended === true) throw new Error("This account is suspended.");
    if (Number.isFinite(limit) && count >= limit) throw new UsageLimitError(limit);

    transaction.set(
      userRef,
      {
        plan,
        analysisUsageMonth: month,
        analysisUsageCount: count + 1,
        analysisCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function releaseAnalysis(uid: string) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const month = currentMonth();

  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) return;

        const data = snapshot.data() ?? {};
        if (data.analysisUsageMonth !== month) return;

        transaction.update(userRef, {
          analysisUsageCount: Math.max(0, Number(data.analysisUsageCount || 0) - 1),
          analysisCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      return; // Success
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

