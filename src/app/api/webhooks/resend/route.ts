import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Webhook } from "svix";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const payloadText = await req.text();

  let payload: any;
  
  // 1. Signature Verification
  if (secret) {
    const svixId = req.headers.get("webhook-id") || "";
    const svixTimestamp = req.headers.get("webhook-timestamp") || "";
    const svixSignature = req.headers.get("webhook-signature") || "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing SVIX webhook headers." }, { status: 400 });
    }

    try {
      const wh = new Webhook(secret);
      payload = wh.verify(payloadText, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
    }
  } else {
    // Development fallback
    console.warn("RESEND_WEBHOOK_SECRET is not configured. Webhook signature check was skipped.");
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
  }

  try {
    const eventType = payload.type; // e.g. email.sent, email.delivered, email.opened, email.clicked, email.bounced
    const emailData = payload.data;
    const resendEmailId = emailData.email_id || emailData.id;

    if (!resendEmailId) {
      return NextResponse.json({ error: "Missing email_id in payload." }, { status: 400 });
    }

    const db = getAdminDb();

    // 1.5. Idempotency check using webhook_events collection
    const svixId = req.headers.get("webhook-id") || payload.id || `evt-${resendEmailId}-${eventType}`;
    const webhookEventRef = db.collection("webhook_events").doc(svixId);
    const eventSnap = await webhookEventRef.get();

    if (eventSnap.exists) {
      console.log(`Duplicate webhook event ignored: ${svixId}`);
      return NextResponse.json({ success: true, duplicated: true });
    }

    await webhookEventRef.set({
      eventId: svixId,
      type: eventType,
      receivedAt: new Date().toISOString(),
    });
    
    // 2. Query email_messages to locate matching sent record
    const messagesRef = db.collection("email_messages");
    const qSnap = await messagesRef.where("resendEmailId", "==", resendEmailId).limit(1).get();

    if (qSnap.empty) {
      console.warn(`Webhook received for untracked Resend email ID: ${resendEmailId}`);
      return NextResponse.json({ success: true, message: "Webhook received but untracked." });
    }

    const msgDoc = qSnap.docs[0];
    const msgData = msgDoc.data() ?? {};
    const messageId = msgDoc.id;
    const campaignId = msgData.campaignId || "unknown_campaign";
    const userId = msgData.userId || "anonymous";

    const timestamp = payload.created_at || new Date().toISOString();
    
    // Map Resend events to email_messages statuses and email_events types
    let newStatus = "sent";
    let logType = "email_sent";

    switch (eventType) {
      case "email.sent":
        newStatus = "sent";
        logType = "email_sent";
        break;
      case "email.delivered":
        newStatus = "delivered";
        logType = "email_delivered";
        break;
      case "email.opened":
        newStatus = "opened";
        logType = "email_opened";
        break;
      case "email.clicked":
        newStatus = "clicked";
        logType = "email_clicked";
        break;
      case "email.bounced":
        newStatus = "bounced";
        logType = "email_bounced";
        break;
      case "email.complained":
        newStatus = "complained";
        logType = "email_complained";
        break;
      case "email.failed":
        newStatus = "failed";
        logType = "email_failed";
        break;
      default:
        // Handle other edge events like unsubscribe
        if (eventType.includes("unsubscribe")) {
          newStatus = "unsubscribed";
          logType = "email_unsubscribed";
        }
        break;
    }

    // 3. Update Email Message Document
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: timestamp,
    };

    if (eventType === "email.delivered") {
      updatePayload.deliveredAt = timestamp;
    } else if (eventType === "email.opened") {
      updatePayload.openedAt = msgData.openedAt || timestamp;
    } else if (eventType === "email.clicked") {
      updatePayload.clickedAt = msgData.clickedAt || timestamp;
    }

    await msgDoc.ref.update(updatePayload);

    // 4. Create Transaction Log in email_events
    const eventRef = db.collection("email_events").doc();
    await eventRef.set({
      id: eventRef.id,
      emailId: messageId,
      userId,
      type: logType,
      timestamp,
      metadata: {
        eventType,
        subject: emailData.subject || "none",
        to: emailData.to || [],
        clickDetails: emailData.click || null, // Contains click destination if Resend opens/clicks tracking is enabled
      },
    });

    // 5. Add to global analytics_events for Funnel tracking
    await db.collection("analytics_events").add({
      event: logType,
      campaignId,
      emailId: messageId,
      userId,
      timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error processing Resend Webhook:", err);
    return NextResponse.json({ error: err.message || "Failed to process webhook." }, { status: 500 });
  }
}
