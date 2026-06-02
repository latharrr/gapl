import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { generateAICall } from "@/lib/ai-gateway";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const prompt = `Rewrite the following email message for a candidate using a highly professional, encouraging, clear, and engaging tone. 
Keep all formatting clean (newlines, spacing). If there are placeholders like links or names, preserve them exactly.
Only return the rewritten message body text, without any introductory or concluding pleasantries.

Original Message:
${message}`;

    const aiRes = await generateAICall("email_rewrite", prompt, {
      temperature: 0.7,
      isJson: false,
    });

    return NextResponse.json({ rewritten: aiRes.text.trim() });
  } catch (err: any) {
    console.error("AI Rewrite Failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to rewrite message with AI." },
      { status: 500 }
    );
  }
}
