import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "re_mock_key";

export const resend = new Resend(apiKey === "re_mock_key" ? "re_dummy" : apiKey);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}

const isProduction = process.env.NODE_ENV === "production";
const DEFAULT_FROM = "Gapl <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, tags }: SendEmailOptions) {
  if (apiKey === "re_mock_key" || !process.env.RESEND_API_KEY) {
    // Never report a fake success in production: callers would tell users "emailed!" when nothing was sent.
    if (isProduction) {
      console.error(`[EMAIL NOT SENT] RESEND_API_KEY is not set in production. Subject: ${subject}`);
      throw new Error("Email isn't available right now. Please try again later.");
    }
    console.warn(`[MOCK EMAIL SEND]
To: ${Array.isArray(to) ? to.join(", ") : to}
Subject: ${subject}
Html: ${html.substring(0, 300)}...
Tags: ${JSON.stringify(tags || [])}
[Please add a valid RESEND_API_KEY in .env.local to send real emails]`);
    return { success: true, id: `mock-msg-${Math.random().toString(36).substring(2, 11)}`, isMock: true };
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  if (isProduction && from.includes("@resend.dev")) {
    // Resend's shared test sender only delivers to the Resend account owner.
    console.error("[EMAIL] RESEND_FROM_EMAIL uses resend.dev; verify a sending domain in Resend and set RESEND_FROM_EMAIL.");
  }

  try {
    const response = await resend.emails.send({
      from,
      replyTo: process.env.RESEND_REPLY_TO || "deepanshulathar@gmail.com",
      to,
      subject,
      html,
      tags,
    });

    if (response.error) {
      console.error("Resend API returned an error:", response.error);
      throw new Error(response.error.message || "Resend API error");
    }

    return { success: true, id: response.data?.id, isMock: false };
  } catch (err) {
    console.error("Failed to send email via Resend:", err);
    throw err;
  }
}
