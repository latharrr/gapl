import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { creditBalance } from "./plans";

export class UsageLimitError extends Error {
  constructor() {
    super("You're out of credits. Buy a credit pack to run another analysis.");
  }
}

/** Takes one credit from the user, or throws UsageLimitError when the balance is empty. */
export async function reserveAnalysis(uid: string) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.exists ? snapshot.data() ?? {} : {};

    if (data.suspended === true) throw new Error("This account is suspended.");
    const credits = creditBalance(data);
    if (credits < 1) throw new UsageLimitError();

    transaction.set(
      userRef,
      {
        credits: credits - 1,
        analysisCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/** Gives back a credit taken by reserveAnalysis when the work it paid for failed. */
export async function releaseAnalysis(uid: string) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);

  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) return;

        const data = snapshot.data() ?? {};
        transaction.update(userRef, {
          credits: creditBalance(data) + 1,
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
