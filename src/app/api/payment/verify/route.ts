import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured." },
        { status: 500 }
      );
    }

    const { orderId, paymentId, signature, userId, plan } = await req.json();

    if (!orderId || !paymentId || !signature || !userId || !plan) {
      return NextResponse.json(
        { error: "Missing required verification parameters." },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay signature
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature. Verification failed." },
        { status: 400 }
      );
    }

    // 2. Update user plan in Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      plan: plan.toLowerCase(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
