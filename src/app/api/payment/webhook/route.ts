import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { normalizePlan, PLAN_PRICES_INR } from "@/lib/plans";

export const runtime = "nodejs";

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  notes?: { plan?: string; userId?: string };
}

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

    const rawBody = await req.text();
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (!signaturesMatch(signature, expected)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: RazorpayPaymentEntity } };
    };
    if (event.event !== "payment.captured") return NextResponse.json({ received: true });

    const payment = event.payload?.payment?.entity;
    const plan = normalizePlan(payment?.notes?.plan);
    const userId = payment?.notes?.userId;
    const paymentId = payment?.id;
    const orderId = payment?.order_id;

    if (!paymentId || !orderId || !userId || !plan || plan === "free" || payment.amount !== PLAN_PRICES_INR[plan] * 100) {
      return NextResponse.json({ error: "Webhook payment details are invalid." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection("payment_orders").doc(orderId);
    const paymentRef = db.collection("payments").doc(paymentId);
    const userRef = db.collection("users").doc(userId);

    const { getLastTouchAttribution } = await import("@/lib/link-tracker");
    const attribution = await getLastTouchAttribution(userId);

    const alreadyProcessed = await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) throw new Error("Webhook order was not created by Gapl.");

      const order = orderSnapshot.data() ?? {};
      if (order.userId !== userId || order.plan !== plan || order.amount !== PLAN_PRICES_INR[plan]) {
        throw new Error("Webhook order does not match its server-side record.");
      }

      if (order.status === "captured" || order.status === "verified") {
        return true;
      }

      transaction.set(paymentRef, {
        paymentId,
        orderId,
        userId,
        plan,
        amount: PLAN_PRICES_INR[plan],
        currency: payment.currency || "INR",
        status: "captured",
        refunded: false,
        source: "webhook",
        createdAt: FieldValue.serverTimestamp(),
        timestamp: new Date().toISOString(),
        ...(attribution ? {
          attributedCampaignId: attribution.campaignId,
          attributedEmailId: attribution.emailId,
          attributedAt: new Date().toISOString(),
        } : {}),
      }, { merge: true });
      transaction.set(orderRef, { status: "captured", paymentId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      transaction.set(userRef, { plan, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return false;
    });

    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }

    // Send Payment Success Email
    try {
      const userSnap = await db.collection("users").doc(userId).get();
      if (userSnap.exists) {
        const userData = userSnap.data() || {};
        const email = userData.email;
        if (email) {
          const { sendPaymentSuccessEmail } = await import("@/lib/email-service");
          sendPaymentSuccessEmail(
            userId,
            email,
            paymentId,
            plan,
            PLAN_PRICES_INR[plan as any] || 0
          ).catch(console.error);
        }
      }
    } catch (emailErr) {
      console.error("Webhook payment success email failed to send:", emailErr);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
