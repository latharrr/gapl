import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * Creates the signed-in user's profile document if it is missing and returns it.
 *
 * Runs on the server so signup never depends on the Firestore rules deployed to
 * the project; it also backfills accounts created while those rules denied it.
 */
export async function POST(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  const body = (await req.json().catch(() => ({}))) as { displayName?: unknown; photoURL?: unknown };
  const ref = getAdminDb().collection("users").doc(user.uid);

  try {
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 100) : "";
    const photoURL = typeof body.photoURL === "string" && body.photoURL.startsWith("https://") ? body.photoURL.slice(0, 500) : null;

    await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        // Signup and the auth listener race; whichever call carries the typed name fills it in.
        if (!snap.data()?.displayName && displayName) tx.update(ref, { displayName, updatedAt: new Date() });
        return;
      }
      tx.set(ref, {
        displayName: displayName || null,
        email: user.email || null,
        photoURL,
        createdAt: new Date(),
        plan: "free",
        analysisCount: 0,
      });
    });

    const data = (await ref.get()).data() ?? {};
    return NextResponse.json({
      user: {
        id: user.uid,
        displayName: data.displayName ?? null,
        email: data.email ?? null,
        plan: String(data.plan || "free").toLowerCase(),
        role: String(data.role || "user"),
        analysisUsageCount: Number(data.analysisUsageCount || 0),
        analysisUsageMonth: data.analysisUsageMonth ?? null,
      },
    });
  } catch (err) {
    console.error("Could not ensure user document:", err);
    return NextResponse.json({ error: "Couldn't finish setting up your account. Please try again." }, { status: 500 });
  }
}
