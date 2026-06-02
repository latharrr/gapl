import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { normalizePlan, PLAN_PRICES_INR } from "@/lib/plans";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  if (!takeRateLimit(`payment-verify:${user.uid}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many verification attempts. Please wait and try again." }, { status: 429 });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });

    const { orderId, paymentId, signature } = await req.json();
    if (![orderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 0)) {
      return NextResponse.json({ error: "Missing payment verification details." }, { status: 400 });
    }

    const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    if (!signaturesMatch(signature, expected)) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection("payment_orders").doc(orderId);
    const paymentRef = db.collection("payments").doc(paymentId);
    const userRef = db.collection("users").doc(user.uid);

    const { getLastTouchAttribution } = await import("@/lib/link-tracker");
    const attribution = await getLastTouchAttribution(user.uid);

    let verifiedPlan = "";
    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) throw new Error("Payment order was not found.");

      const order = orderSnapshot.data() ?? {};
      const plan = normalizePlan(order.plan);
      if (!plan || plan === "free" || order.userId !== user.uid || order.amount !== PLAN_PRICES_INR[plan]) {
        throw new Error("Payment order details do not match this account.");
      }

      verifiedPlan = plan;
      transaction.set(paymentRef, {
        paymentId,
        orderId,
        userId: user.uid,
        plan,
        amount: order.amount,
        currency: order.currency || "INR",
        status: "captured",
        refunded: false,
        source: "checkout-verification",
        createdAt: FieldValue.serverTimestamp(),
        timestamp: new Date().toISOString(),
        ...(attribution ? {
          attributedCampaignId: attribution.campaignId,
          attributedEmailId: attribution.emailId,
          attributedAt: new Date().toISOString(),
        } : {}),
      }, { merge: true });
      transaction.set(orderRef, { status: "verified", paymentId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      transaction.set(userRef, { plan, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    // Trigger Payment Success Email
    if (user.email) {
      const { sendPaymentSuccessEmail } = await import("@/lib/email-service");
      sendPaymentSuccessEmail(
        user.uid,
        user.email,
        paymentId,
        verifiedPlan,
        PLAN_PRICES_INR[verifiedPlan as any] || 0
      ).catch((err) => console.error("Failed to send Payment Success email:", err));
    }

    return NextResponse.json({ success: true, plan: verifiedPlan });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status: 400 });
  }
}
