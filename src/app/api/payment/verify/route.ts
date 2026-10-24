import crypto from "crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { requireUser } from "@/lib/firebase-admin";
import { applyCapturedPayment, PaymentMismatchError } from "@/lib/payments";
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

  if (!(await takeRateLimit(`payment-verify:${user.uid}`, 12, 10 * 60 * 1000))) {
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

    const { pack, alreadyProcessed } = await applyCapturedPayment({
      orderId,
      paymentId,
      source: "checkout-verification",
      expectedUserId: user.uid,
    });

    // Receipt goes out once per order, from whichever of verify/webhook captured it.
    if (user.email && !alreadyProcessed) {
      const email = user.email;
      after(async () => {
        try {
          const { sendPaymentSuccessEmail } = await import("@/lib/email-service");
          await sendPaymentSuccessEmail(user.uid, email, paymentId, pack.name, pack.credits, pack.priceInr);
        } catch (err) {
          console.error("Failed to send Payment Success email:", err);
        }
      });
    }

    return NextResponse.json({ success: true, pack: pack.id, credits: pack.credits });
  } catch (error) {
    console.error("Payment verification error:", error);
    const message = error instanceof PaymentMismatchError ? error.message : "Payment verification failed. If money left your account, email deepanshulathar@gmail.com with your payment ID.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
