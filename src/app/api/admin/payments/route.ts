import { NextRequest, NextResponse } from "next/server";
import { db, collection, getDocs, doc, getDoc, updateDoc, query, orderBy, limit } from "@/lib/server-firestore";
import { logAuditAction } from "@/lib/audit-logger";
import { requireAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, orderBy("timestamp", "desc"), limit(200));
    const snap = await getDocs(q);
    const payments = snap.docs.map((d) => ({ paymentId: d.id, ...d.data() }));

    return NextResponse.json({ payments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : undefined;
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;
    const adminUser = adminOrError;

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
    if (!payment) {
      return NextResponse.json({ error: "Payment record is empty." }, { status: 500 });
    }

    if (action === "refund") {
      // Only super_admin can issue refunds
      if (adminUser.role !== "super_admin") {
        return NextResponse.json({ error: "Only super_admin can issue refunds." }, { status: 403 });
      }

      if (payment.refunded) {
        return NextResponse.json({ error: "Payment is already refunded." }, { status: 400 });
      }

      // Money first: if Razorpay refuses the refund, nothing changes on our side.
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });
      }
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Number(payment.amount) * 100,
        notes: { reason: "Admin refund", adminId: adminUser.uid },
      });

      await updateDoc(paymentRef, { refunded: true, status: "refunded", refundId: refund.id, refundedAt: new Date().toISOString() });

      // Take back the credits this payment added, as far as the balance allows.
      let creditsRemoved = 0;
      if (payment.userId) {
        const { getAdminDb } = await import("@/lib/firebase-admin");
        const { creditBalance } = await import("@/lib/plans");
        const adminDb = getAdminDb();
        const userRef = adminDb.collection("users").doc(payment.userId);
        await adminDb.runTransaction(async (tx) => {
          const snap = await tx.get(userRef);
          if (!snap.exists) return;
          const balance = creditBalance(snap.data() ?? {});
          creditsRemoved = Math.min(balance, Number(payment.credits || 0));
          tx.update(userRef, { credits: balance - creditsRemoved, updatedAt: new Date() });
        });
        if (payment.orderId) {
          await adminDb.collection("payment_orders").doc(payment.orderId).set({ status: "refunded" }, { merge: true });
        }
      }

      await logAuditAction({
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        adminRole: adminUser.role,
        action: "Refunds",
        targetUserId: payment.userId,
        details: `Refunded payment ${paymentId} (₹${payment.amount}, Razorpay refund ${refund.id}). Removed ${creditsRemoved} credit(s).`,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : undefined;
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
