import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { creditBalance, getPack, type CreditPack } from "./plans";

export class PaymentMismatchError extends Error {}

interface CapturedPayment {
  orderId: string;
  paymentId: string;
  source: "checkout-verification" | "webhook";
  /** The account the payment must belong to (the signed-in user on checkout). */
  expectedUserId?: string;
  /** Amount Razorpay reports, in paise (webhook only). */
  amountPaise?: number;
  currency?: string;
}

export interface CapturedResult {
  userId: string;
  pack: CreditPack;
  alreadyProcessed: boolean;
}

/**
 * Credits the pack bought by a Razorpay order, exactly once.
 *
 * Checkout verification and the webhook both land here; whichever arrives first
 * adds the credits and the other sees the order already captured.
 */
export async function applyCapturedPayment(payment: CapturedPayment): Promise<CapturedResult> {
  const db = getAdminDb();
  const orderRef = db.collection("payment_orders").doc(payment.orderId);
  const paymentRef = db.collection("payments").doc(payment.paymentId);

  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists) throw new PaymentMismatchError("Payment order was not found.");
  const order = orderSnapshot.data() ?? {};
  const userId = String(order.userId || "");

  const { getLastTouchAttribution } = await import("./link-tracker");
  const attribution = userId ? await getLastTouchAttribution(userId) : null;

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    const current = snapshot.data() ?? {};
    const pack = getPack(current.pack);
    if (
      !pack ||
      !userId ||
      current.userId !== userId ||
      current.amount !== pack.priceInr ||
      current.credits !== pack.credits ||
      (payment.expectedUserId !== undefined && payment.expectedUserId !== userId) ||
      (payment.amountPaise !== undefined && payment.amountPaise !== pack.priceInr * 100)
    ) {
      throw new PaymentMismatchError("Payment order details do not match this account.");
    }

    if (current.status === "captured" || current.status === "verified" || current.status === "refunded") {
      return { userId, pack, alreadyProcessed: true };
    }

    const userRef = db.collection("users").doc(userId);
    const userSnapshot = await transaction.get(userRef);
    const balance = creditBalance(userSnapshot.data() ?? {});
    const now = new Date().toISOString();

    transaction.set(paymentRef, {
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      userId,
      pack: pack.id,
      credits: pack.credits,
      amount: pack.priceInr,
      currency: payment.currency || current.currency || "INR",
      status: "captured",
      refunded: false,
      source: payment.source,
      createdAt: FieldValue.serverTimestamp(),
      timestamp: now,
      ...(attribution ? {
        attributedCampaignId: attribution.campaignId,
        attributedEmailId: attribution.emailId,
        attributedAt: now,
      } : {}),
    }, { merge: true });
    transaction.set(orderRef, {
      status: payment.source === "webhook" ? "captured" : "verified",
      paymentId: payment.paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(userRef, {
      credits: balance + pack.credits,
      creditsPurchased: FieldValue.increment(pack.credits),
      lastPackId: pack.id,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { userId, pack, alreadyProcessed: false };
  });
}
