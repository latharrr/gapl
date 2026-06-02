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
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const { getAuth } = await import("firebase-admin/auth");
        const decoded = await getAuth().verifyIdToken(token);
        userId = decoded.uid;
      } catch (_) { /* invalid or expired token - treat as anonymous */ }
    }

    const eventDoc = {
      userId,
      sessionId: sessionId || "unknown",
      event,
      timestamp: new Date().toISOString(),
    };

    await getAdminDb().collection("analytics_events").add(eventDoc);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to log event:", err);
    return NextResponse.json({ error: err.message || "Failed to log event." }, { status: 500 });
  }
}
