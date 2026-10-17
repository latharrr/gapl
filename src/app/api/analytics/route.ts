import { NextRequest, NextResponse, after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export const runtime = "nodejs";

// Only events the app itself sends are accepted; anything else is rejected
// so the collection can't be flooded with arbitrary names.
const ALLOWED_EVENTS = new Set([
  "analysis_completed",
  "analysis_failed",
  "analysis_started",
  "jd_skipped",
  "jd_uploaded",
  "landing_enquiry",
  "landing_view",
  "payment_started",
  "payment_success",
  "report_viewed",
  "resume_uploaded",
  "roadmap_started",
  "signup",
  "task_completed",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, sessionId } = body;
    if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Unknown event." }, { status: 400 });
    }

    let userId = "anonymous";
    let decodedToken: DecodedIdToken | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const { getAuth } = await import("firebase-admin/auth");
        decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch { /* invalid or expired token - treat as anonymous */ }
    }

    const eventDoc = {
      userId,
      sessionId: typeof sessionId === "string" ? sessionId.slice(0, 80) : "unknown",
      event,
      timestamp: new Date().toISOString(),
    };

    try {
      await getAdminDb().collection("analytics_events").add(eventDoc);

      // Welcome email: only for a verified signed-in user, only to the email on
      // their verified token, and only once per account. Client-supplied
      // metadata (userId / email / name) is never trusted for sending mail.
      if (event === "signup" && decodedToken?.email) {
        const uid = decodedToken.uid;
        const email = decodedToken.email;
        after(async () => {
          try {
            const db = getAdminDb();
            const userRef = db.collection("users").doc(uid);
            const claimed = await db.runTransaction(async (tx) => {
              const snap = await tx.get(userRef);
              if (snap.exists && snap.data()?.welcomeEmailSentAt) return null;
              tx.set(userRef, { welcomeEmailSentAt: FieldValue.serverTimestamp() }, { merge: true });
              return snap.exists ? snap.data() : {};
            });
            if (!claimed) return;
            const name = (claimed.displayName as string) || decodedToken?.name || "there";
            const { sendWelcomeEmail } = await import("@/lib/email-service");
            await sendWelcomeEmail(uid, email, name);
          } catch (emailErr) {
            console.error("Welcome email dispatch failed:", emailErr);
          }
        });
      }
    } catch (dbErr) {
      const detail = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn("Firestore Admin: Failed to log event to database. Is FIREBASE_SERVICE_ACCOUNT_KEY configured? Error:", detail || dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to log event:", err);
    return NextResponse.json({ error: "Failed to log event." }, { status: 500 });
  }
}
