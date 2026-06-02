import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrError = await requireUser(req);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;
    if (!id || id.length > 160) {
      return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
    }

    const db = getAdminDb();
    const snapshot = await db.collection("reports").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const report = snapshot.data() ?? {};
    if (report.userId !== user.uid) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
    const careerGaps = report.careerGaps || [];

    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111111; line-height: 1.5;">
        <h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 20px;">
          Your Gapl Readiness Report Summary
        </h2>
        <p>Here is the analysis report for your resume scanned against the <strong>${report.role}</strong> role for <strong>${report.companyTier}</strong> company standards.</p>
        
        <div style="display: flex; gap: 16px; margin: 24px 0;">
          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; width: 45%;">
            <p style="font-size: 11px; color: #71717a; margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase;">ATS SCORE</p>
            <span style="font-size: 28px; font-weight: bold; color: #dc2626;">${report.atsScore}%</span>
          </div>
          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; width: 45%;">
            <p style="font-size: 11px; color: #71717a; margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase;">READINESS</p>
            <span style="font-size: 28px; font-weight: bold; color: #16a34a;">${report.readiness}%</span>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em;">
          Identified Skill Deficits & Projects
        </h3>
        <ul style="padding-left: 20px; margin: 0;">
          ${careerGaps.map((gap: any) => `
            <li style="margin-bottom: 16px;">
              <strong style="font-size: 13px; color: #111;">${gap.skill}</strong> 
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: #fef3c7; color: #d97706; margin-left: 6px;">
                ${gap.priority} Priority
              </span>
              <div style="font-size: 12px; color: #555; margin-top: 4px;">
                <strong>Gaps:</strong> ${gap.gapName || "Skill evidence gap detected"}
              </div>
              <div style="font-size: 12px; color: #4F46E5; margin-top: 2px; font-weight: 500;">
                <strong>Recommended Project:</strong> ${gap.recommendedProject || "Build custom roadmap project"}
              </div>
            </li>
          `).join("")}
        </ul>

        <div style="margin: 32px 0; border-top: 1px solid #e4e4e7; pt: 20px;">
          <p style="font-size: 12px; color: #71717a;">Access your complete interactive dashboard to check off roadmap milestones, rewrite resume bullets, and track progress live.</p>
          <a href="${appUrl}/report/${id}" style="background-color: #111111; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin-top: 10px;">
            View Interactive Report →
          </a>
        </div>

        <p style="font-size: 11px; color: #a1a1aa; margin-top: 48px;">
          Gapl | Application Readiness Intelligence Engine
        </p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `Gapl Report Summary: ${report.role}`,
      html: bodyHtml,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to email report:", err);
    return NextResponse.json({ error: err.message || "Failed to send email." }, { status: 500 });
  }
}
