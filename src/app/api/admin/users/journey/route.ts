import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { requireAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Verify Firebase ID token and admin role via Admin SDK
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get("userId");
    if (!targetUid) {
      return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
    }

    // 1. Fetch user doc
    const userRef = doc(db, "users", targetUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userSnap.data();

    const timeline: any[] = [];

    // 2. Fetch User registrations / audits
    const auditRef = collection(db, "audit_logs");
    const auditSnap = await getDocs(query(auditRef, where("targetUserId", "==", targetUid)));
    auditSnap.docs.forEach((d) => {
      const data = d.data();
      timeline.push({
        id: d.id,
        type: "audit",
        timestamp: data.timestamp,
        title: data.action,
        description: data.details,
        meta: `Admin: ${data.adminEmail}`,
      });
    });

    // 3. Fetch Reports
    const reportsRef = collection(db, "reports");
    const reportsSnap = await getDocs(query(reportsRef, where("userId", "==", targetUid)));
    reportsSnap.docs.forEach((d) => {
      const data = d.data();
      timeline.push({
        id: d.id,
        type: "report",
        timestamp: data.createdAt,
        title: "Report Generated",
        description: `ATS score optimized for '${data.role}' role. (Verdict: ${data.recruiterVerdict?.verdict || "Maybe"})`,
        meta: `Report ID: ${d.id}`,
      });
    });

    // 4. Fetch AI Calls
    const aiRef = collection(db, "ai_calls");
    const aiSnap = await getDocs(query(aiRef, where("userId", "==", targetUid)));
    aiSnap.docs.forEach((d) => {
      const data = d.data();
      timeline.push({
        id: d.id,
        type: "ai_call",
        timestamp: data.timestamp,
        title: "AI Invocation",
        description: `Executed '${data.task}' via ${data.provider} (${data.model})`,
        meta: `Latency: ${data.latency}ms · Cost: $${data.cost || 0}`,
      });
    });

    // 5. Fetch Payments
    const paymentsRef = collection(db, "payments");
    const paymentsSnap = await getDocs(query(paymentsRef, where("userId", "==", targetUid)));
    paymentsSnap.docs.forEach((d) => {
      const data = d.data();
      timeline.push({
        id: d.id,
        type: "payment",
        timestamp: data.createdAt || new Date().toISOString(),
        title: `Payment ${data.status.toUpperCase()}`,
        description: `Plan: ${data.plan.toUpperCase()} · Amount: $${data.amount}`,
        meta: `Order: ${data.orderId}`,
      });
    });

    // Add baseline account creation timeline
    if (userData.createdAt) {
      timeline.push({
        id: "creation",
        type: "system",
        timestamp: userData.createdAt,
        title: "Account Created",
        description: `Registered email profile on Gapl platform.`,
        meta: `Plan: ${userData.plan || "free"}`,
      });
    }

    // Sort chronologically (oldest to newest for user journey flow)
    const sortedTimeline = timeline.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json({
      user: { uid: targetUid, ...userData },
      timeline: sortedTimeline,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
