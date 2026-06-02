import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes("YOUR_KEY") || keySecret.includes("YOUR_KEY")) {
      return NextResponse.json(
        { error: "Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local" },
        { status: 503 }
      );
    }

    const { amount, plan, userId } = (await req.json()) as { amount: number; plan: string; userId?: string };

    if (!amount || !plan) {
      return NextResponse.json({ error: "amount and plan are required" }, { status: 400 });
    }

    // Lazy import so missing keys don't crash at module load time
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `gapl_${plan}_${Date.now()}`,
      notes: { plan, userId: userId || "anonymous" },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment order." },
      { status: error?.statusCode ?? 500 }
    );
  }
}
