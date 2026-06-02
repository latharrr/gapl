import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { logAuditAction } from "@/lib/audit-logger";

export const runtime = "nodejs";

async function getAdminUser(req: NextRequest) {
  const adminUid = req.headers.get("x-admin-uid");
  if (!adminUid) return null;
  const userRef = doc(db, "users", adminUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as any;
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser || !["super_admin", "admin", "support", "readonly"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const paymentsRef = collection(db, "payments");
    const snap = await getDocs(paymentsRef);
    const payments = snap.docs.map((d) => ({ paymentId: d.id, ...d.data() }));

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { action, paymentId } = await req.json();
    if (!action || !paymentId) {
      return NextResponse.json({ error: "Missing action or paymentId." }, { status: 400 });
    }

    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }
    const payment = paymentSnap.data();

    if (action === "refund") {
      // Only super_admin can issue refunds
      if (adminUser.role !== "super_admin") {
        return NextResponse.json({ error: "Only super_admin can issue refunds." }, { status: 403 });
      }

      if (payment.refunded) {
        return NextResponse.json({ error: "Payment is already refunded." }, { status: 400 });
      }

      // Upgrade payment doc
      await updateDoc(paymentRef, { refunded: true, status: "refunded" });

      // Demote user plan to free
      if (payment.userId) {
        const userRef = doc(db, "users", payment.userId);
        await updateDoc(userRef, { plan: "free" });
      }

      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Refunds",
        targetUserId: payment.userId,
        details: `Issued refund for payment ID ${paymentId} ($${payment.amount}). User plan reverted to free.`,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
