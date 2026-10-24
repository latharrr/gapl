import crypto from "crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { applyCapturedPayment, PaymentMismatchError } from "@/lib/payments";

export const runtime = "nodejs";

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
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
    const paymentId = payment?.id;
    const orderId = payment?.order_id;
    if (!paymentId || !orderId) return NextResponse.json({ received: true, ignored: "missing ids" });

    let result;
    try {
      result = await applyCapturedPayment({
        orderId,
        paymentId,
        source: "webhook",
        amountPaise: payment.amount,
        currency: payment.currency,
      });
    } catch (err) {
      // Not ours, or not a pack order (e.g. another app on the same Razorpay account).
      // Acknowledge so Razorpay stops retrying; a 5xx here would eventually disable the webhook.
      if (err instanceof PaymentMismatchError) {
        console.error(`Webhook ignored payment ${paymentId} for order ${orderId}: ${err.message}`);
        return NextResponse.json({ received: true, ignored: err.message });
      }
      throw err;
    }

    if (result.alreadyProcessed) return NextResponse.json({ received: true });

    const { userId, pack } = result;
    after(async () => {
      try {
        const userSnap = await getAdminDb().collection("users").doc(userId).get();
        const email = userSnap.data()?.email;
        if (!email) return;
        const { sendPaymentSuccessEmail } = await import("@/lib/email-service");
        await sendPaymentSuccessEmail(userId, email, paymentId, pack.name, pack.credits, pack.priceInr);
      } catch (err) {
        console.error("Webhook payment success email failed to send:", err);
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
