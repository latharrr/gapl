import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const { email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Email, subject, and message are required." },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 1. Resolve User ID from email
    let userId = "admin_manual_user";
    try {
      const userSnap = await db
        .collection("users")
        .where("email", "==", email.trim())
        .limit(1)
        .get();
      if (!userSnap.empty) {
        userId = userSnap.docs[0].id;
      }
    } catch (e) {
      console.warn("Failed to lookup user by email:", e);
    }

    // 2. Format HTML email body
    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111; line-height: 1.6; padding: 20px;">
        <div style="white-space: pre-wrap; font-size: 14px;">${message}</div>
        <p style="font-size: 11px; color: #a1a1aa; margin-top: 48px; border-top: 1px solid #e4e4e7; padding-top: 12px;">
          Sent by Admin from Gapl | Application Readiness Intelligence Engine
        </p>
      </div>
    `;

    // 3. Generate Campaign Document if it doesn't exist
    const campaignId = "admin_manual";
    const campaignRef = db.collection("email_campaigns").doc(campaignId);
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
      await campaignRef.set({
        id: campaignId,
        name: "Admin Manual Outbox",
        type: "transactional",
        subject: "Manual Admin Message",
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Send email via Resend
    const res = await sendEmail({
      to: email.trim(),
      subject: subject.trim(),
      html: bodyHtml,
      tags: [
        { name: "campaign_id", value: campaignId },
      ],
    });

    const timestamp = new Date().toISOString();
    const messageId = `msg-${Math.random().toString(36).substring(2, 11)}`;

    // 5. Write to email_messages collection
    const msgPayload = {
      id: messageId,
      campaignId,
      userId,
      email: email.trim(),
      resendEmailId: res.id || "mock-id",
      status: res.isMock ? "delivered" : "sent",
      sentAt: timestamp,
      deliveredAt: res.isMock ? timestamp : null,
      openedAt: null,
      clickedAt: null,
      firstVisitAt: null,
      convertedAt: null,
    };
    await db.collection("email_messages").doc(messageId).set(msgPayload);

    // 6. Log email event
    const eventId = `evt-${Math.random().toString(36).substring(2, 11)}`;
    await db.collection("email_events").doc(eventId).set({
      id: eventId,
      emailId: messageId,
      userId,
      type: "email_sent",
      timestamp,
      metadata: { campaignId, to: email, subject },
    });

    return NextResponse.json({ success: true, messageId });
  } catch (err: any) {
    console.error("Admin send email failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
