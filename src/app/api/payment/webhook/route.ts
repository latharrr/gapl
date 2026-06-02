import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("Razorpay Webhook Secret not configured in server variables.");
      return NextResponse.json({ error: "Server secret configuration missing" }, { status: 500 });
    }

    const rawBody = await req.text();
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Razorpay webhook signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);
    console.log("Verified Razorpay Webhook Received:", eventData.event);

    if (eventData.event === "payment.captured") {
      const paymentEntity = eventData.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const amount = paymentEntity.amount / 100; // in INR
      const plan = paymentEntity.notes?.plan || "free";
      const userId = paymentEntity.notes?.userId;

      if (userId && userId !== "anonymous") {
        console.log(`Processing plan upgrade for user: ${userId} to plan: ${plan}`);
        
        // 1. Upgrade user tier in Firestore database
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          plan: plan.toLowerCase(),
          updatedAt: new Date().toISOString(),
        });

        // 2. Track/log payment transaction in Firestore under payments collection
        const payRef = doc(db, "payments", orderId || `pay_${Date.now()}`);
        await setDoc(payRef, {
          id: orderId || `pay_${Date.now()}`,
          userId,
          amount,
          plan: plan.toLowerCase(),
          status: "captured",
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn("Webhook received payment entity without user mapping notes.");
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook receiver processing exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
