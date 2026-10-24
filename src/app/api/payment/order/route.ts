import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { getPack } from "@/lib/plans";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  if (!(await takeRateLimit(`payment-order:${user.uid}`, 10, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many payment attempts. Please wait and try again." }, { status: 429 });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });

    const body = await req.json();
    const pack = getPack(body.pack);
    if (!pack) return NextResponse.json({ error: "Choose a valid credit pack." }, { status: 400 });

    const amount = pack.priceInr;
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `gapl_${pack.id}_${Date.now()}`,
      notes: { pack: pack.id, credits: String(pack.credits), userId: user.uid },
    });

    await getAdminDb().collection("payment_orders").doc(order.id).set({
      userId: user.uid,
      pack: pack.id,
      credits: pack.credits,
      amount,
      amountPaise: amount * 100,
      currency: "INR",
      status: "created",
      createdAt: FieldValue.serverTimestamp(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: "Failed to create payment order." }, { status: 500 });
  }
}
