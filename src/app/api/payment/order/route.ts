import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { normalizePlan, PLAN_PRICES_INR } from "@/lib/plans";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userOrError = await requireUser(req);
  if (userOrError instanceof NextResponse) return userOrError;
  const user = userOrError;

  if (!takeRateLimit(`payment-order:${user.uid}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many payment attempts. Please wait and try again." }, { status: 429 });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });

    const body = await req.json();
    const plan = normalizePlan(body.plan);
    if (!plan || plan === "free") return NextResponse.json({ error: "Choose a valid paid plan." }, { status: 400 });

    const amount = PLAN_PRICES_INR[plan];
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `gapl_${plan}_${Date.now()}`,
      notes: { plan, userId: user.uid },
    });

    await getAdminDb().collection("payment_orders").doc(order.id).set({
      userId: user.uid,
      plan,
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
