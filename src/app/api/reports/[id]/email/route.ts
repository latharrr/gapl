import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/resend";
import { emailLayout, emailButton, escapeHtml, EMAIL } from "@/lib/email-layout";

export const runtime = "nodejs";

interface ReportCareerGap {
  skill?: string;
  priority?: string;
  gapName?: string;
  recommendedProject?: string;
}

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

    const verdict: string = report.recruiterVerdict?.verdict ?? "";
    const status = verdict === "Shortlist" ? { code: "CNF", color: EMAIL.success } : verdict === "Maybe" ? { code: "RAC", color: "#8f5300" } : { code: "WL", color: EMAIL.danger };
    const gapRows = careerGaps
      .map(
        (gap: ReportCareerGap, i: number) => `
        <tr style="${i % 2 ? "background-color:#e3ecdc;" : ""}">
          <td style="padding:10px 12px;font-family:${EMAIL.mono};font-size:11px;font-weight:700;text-transform:uppercase;white-space:nowrap;color:${gap.priority === "Critical" ? EMAIL.danger : EMAIL.muted};">${escapeHtml(gap.priority ?? "")}</td>
          <td style="padding:10px 12px;font-weight:700;">${escapeHtml(gap.skill ?? gap.gapName ?? "Skill gap")}</td>
          <td style="padding:10px 12px;color:${EMAIL.navy};font-weight:600;">${escapeHtml(gap.recommendedProject ?? "See your roadmap")}</td>
        </tr>`
      )
      .join("");

    const bodyHtml = emailLayout(
      `<h1 style="margin:0 0 10px 0;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;">Your report summary</h1>
       <p style="margin:0 0 14px 0;">${escapeHtml(report.role)} · ${escapeHtml(report.companyTier)}</p>
       <p style="margin:0 0 18px 0;"><span style="display:inline-block;border:1.5px solid ${status.color};color:${status.color};border-radius:3px;padding:2px 8px;font-family:${EMAIL.mono};font-size:12px;font-weight:700;text-transform:uppercase;">${status.code} / ${escapeHtml(verdict || "Pending")}</span></p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border:1px solid ${EMAIL.rule};border-top:2px solid ${EMAIL.ink};background-color:#ffffff;"><tr>
         <td style="padding:14px 16px;border-right:1px solid ${EMAIL.rule};"><p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${EMAIL.muted};">ATS</p><span style="font-family:${EMAIL.mono};font-size:26px;font-weight:700;">${escapeHtml(report.atsScore)}</span></td>
         <td style="padding:14px 16px;"><p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${EMAIL.muted};">Readiness</p><span style="font-family:${EMAIL.mono};font-size:26px;font-weight:700;">${escapeHtml(report.readiness)}</span></td>
       </tr></table>
       ${report.recruiterVerdict?.reason ? `<p style="margin:0 0 18px 0;"><strong>Why:</strong> ${escapeHtml(report.recruiterVerdict.reason)}</p>` : ""}
       ${gapRows ? `<p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${EMAIL.muted};">Gaps and what to build</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL.rule};border-top:2px solid ${EMAIL.ink};background-color:#ffffff;font-size:13px;text-align:left;">${gapRows}</table>` : ""}
       <div style="margin:28px 0 0 0;">${emailButton(`${appUrl}/report/${encodeURIComponent(id)}`, "Open my full report")}</div>`,
      { preheader: `${status.code} / ${verdict} · Readiness ${report.readiness}` }
    );

    // ── Rolling 8-hour window rate limit (3 sends per window) ──────────────────
    const WINDOW_MS = 8 * 60 * 60 * 1000; // 8 hours
    const MAX_SENDS = 3;

    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};

    const now = Date.now();
    const windowStart: number = userData?.summaryEmailWindowStart ?? 0;
    const windowCount: number = userData?.summaryEmailWindowCount ?? 0;

    const windowActive = now - windowStart < WINDOW_MS;
    const currentCount = windowActive ? windowCount : 0;

    if (currentCount >= MAX_SENDS) {
      const resetAt = new Date(windowStart + WINDOW_MS);
      return NextResponse.json(
        {
          error: `You've sent this report summary ${MAX_SENDS} times. Try again after ${resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
          remaining: 0,
          resetAt: resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    await sendEmail({
      to: user.email,
      subject: `Gapl Report Summary: ${report.role}`,
      html: bodyHtml,
    });

    const { FieldValue } = await import("firebase-admin/firestore");
    if (windowActive) {
      await userRef.set({ summaryEmailWindowCount: FieldValue.increment(1) }, { merge: true });
    } else {
      await userRef.set(
        { summaryEmailWindowStart: now, summaryEmailWindowCount: 1 },
        { merge: true }
      );
    }

    const newCount = currentCount + 1;
    const remaining = MAX_SENDS - newCount;

    return NextResponse.json({ success: true, remaining, total: MAX_SENDS, sent: newCount });
  } catch (err: unknown) {
    console.error("Failed to email report:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to send email." }, { status: 500 });
  }
}
