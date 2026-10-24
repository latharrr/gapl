import { emailLayout, emailButton, escapeHtml } from "@/lib/email-layout";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";
import { getGroq } from "@/lib/groq";

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
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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

      const completion = await getGroq().chat.completions.create({
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

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.vercel.app";

      const bodyHtml = emailLayout(
        `<h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(subject)}</h1>
         <div style="white-space:pre-wrap;">${escapeHtml(message)}</div>
         <div style="margin:28px 0 0 0;">${emailButton(`${appUrl}/dashboard`, "Open my dashboard")}</div>`
      );

      await sendEmail({
        to: targetEmail,
        subject: `[Gapl] ${subject}`,
        html: bodyHtml,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action. Use 'rewrite' or 'send'." }, { status: 400 });
  } catch (err) {
    console.error("[admin/send-email]", err);
    const message = err instanceof Error && err.message ? err.message : "Failed to process request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

