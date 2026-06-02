import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, sessionId } = body;
    if (!event) {
      return NextResponse.json({ error: "Event name required." }, { status: 400 });
    }

    let userId = "anonymous";
    let decodedToken: any = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const { getAuth } = await import("firebase-admin/auth");
        decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (_) { /* invalid or expired token - treat as anonymous */ }
    }

    const eventDoc = {
      userId,
      sessionId: sessionId || "unknown",
      event,
      timestamp: new Date().toISOString(),
    };

    try {
      await getAdminDb().collection("analytics_events").add(eventDoc);

      // Trigger Welcome Email on signup event
      if (event === "signup" && userId !== "anonymous" && decodedToken) {
        (async () => {
          try {
            const userSnap = await getAdminDb().collection("users").doc(userId).get();
            const userData = userSnap.exists ? userSnap.data() : {};
            const email = decodedToken.email || userData?.email;
            const name = userData?.displayName || decodedToken.name || "Explorer";

            if (email) {
              const { sendWelcomeEmail } = await import("@/lib/email-service");
              await sendWelcomeEmail(userId, email, name);
            }
          } catch (emailErr) {
            console.error("Welcome email dispatch failed:", emailErr);
          }
        })();
      }
    } catch (dbErr: any) {
      console.warn("Firestore Admin: Failed to log event to database. Is FIREBASE_SERVICE_ACCOUNT_KEY configured? Error:", dbErr.message || dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to log event:", err);
    return NextResponse.json({ error: err.message || "Failed to log event." }, { status: 500 });
  }
}
