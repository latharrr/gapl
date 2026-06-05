import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";
import { groq } from "@/lib/groq";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get("uid");
    if (!targetUid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    // Return empty count — admin sends are unlimited
    return NextResponse.json({ adminEmailCount: 0, limit: null, unlimited: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const body = await req.json();
    const { action, targetUid, subject, message } = body;

    if (!targetUid || typeof targetUid !== "string" || targetUid.length > 128) {
      return NextResponse.json({ error: "Invalid targetUid." }, { status: 400 });
    }

    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(targetUid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userSnap.data() ?? {};

    // AI Rewrite action
    if (action === "rewrite") {
      if (!message || typeof message !== "string" || message.trim().length < 5) {
        return NextResponse.json({ error: "Message is required for rewrite." }, { status: 400 });
      }

      const completion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are an expert email copywriter for a B2B SaaS platform called Gapl. Rewrite the provided email message to be professional, warm, concise, and engaging. Keep the same intent but improve tone, structure, and clarity. Return ONLY the rewritten message text, no subject, no headers, no extra commentary.",
          },
          {
            role: "user",
            content: `Rewrite this email message:\n\n${message}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const rewritten = completion.choices[0]?.message?.content?.trim() || message;
      return NextResponse.json({ rewritten });
    }

    // Send email action — admin sends are unlimited, no rate limit applied
    if (action === "send") {
      if (!subject || typeof subject !== "string" || subject.trim().length < 2) {
        return NextResponse.json({ error: "Subject is required." }, { status: 400 });
      }
      if (!message || typeof message !== "string" || message.trim().length < 10) {
        return NextResponse.json({ error: "Message body is required." }, { status: 400 });
      }

      const targetEmail = userData.email;
      if (!targetEmail) {
        return NextResponse.json({ error: "Target user has no email address." }, { status: 400 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";

      const bodyHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111; line-height: 1.6;">
          <!-- Header bar -->
          <div style="background: linear-gradient(135deg, #09090b 0%, #18181b 100%); border-radius: 12px 12px 0 0; padding: 28px 32px; border-bottom: 2px solid #6366f1;">
            <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Gapl</span>
            <span style="font-size: 11px; color: #71717a; display: block; margin-top: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em;">Application Readiness Intelligence</span>
          </div>

          <!-- Body -->
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin: 0 0 16px 0;">
              ${subject}
            </h2>

            <div style="font-size: 14px; color: #3f3f46; white-space: pre-wrap; line-height: 1.7; margin-bottom: 28px;">${message}</div>

            <div style="border-top: 1px solid #f4f4f5; padding-top: 20px; margin-top: 20px;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: #6366f1; color: #ffffff; font-size: 13px; font-weight: 600; padding: 11px 22px; border-radius: 8px; text-decoration: none;">
                Open Gapl Dashboard →
              </a>
            </div>

            <p style="font-size: 11px; color: #a1a1aa; margin-top: 32px; margin-bottom: 0;">
              Gapl · Application Readiness Intelligence<br/>
              <a href="${appUrl}" style="color: #a1a1aa;">${appUrl}</a>
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: targetEmail,
        subject: `[Gapl] ${subject}`,
        html: bodyHtml,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action. Use 'rewrite' or 'send'." }, { status: 400 });
  } catch (err: any) {
    console.error("[admin/send-email]", err);
    return NextResponse.json({ error: err.message || "Failed to process request." }, { status: 500 });
  }
}

