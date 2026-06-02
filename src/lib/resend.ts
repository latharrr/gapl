import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "re_mock_key";

export const resend = new Resend(apiKey === "re_mock_key" ? "re_dummy" : apiKey);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail({ to, subject, html, tags }: SendEmailOptions) {
  if (apiKey === "re_mock_key" || !process.env.RESEND_API_KEY) {
    console.warn(`[MOCK EMAIL SEND]
To: ${Array.isArray(to) ? to.join(", ") : to}
Subject: ${subject}
Html: ${html.substring(0, 300)}...
Tags: ${JSON.stringify(tags || [])}
[Please add a valid RESEND_API_KEY in .env.local to send real emails]`);
    return { success: true, id: `mock-msg-${Math.random().toString(36).substring(2, 11)}`, isMock: true };
  }

  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Gapl <onboarding@resend.dev>",
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
  } catch (err: any) {
    console.error("Failed to send email via Resend:", err);
    throw err;
  }
}
