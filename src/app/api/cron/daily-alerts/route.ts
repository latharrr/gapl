import { emailLayout, emailButton, escapeHtml, EMAIL } from "@/lib/email-layout";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { computeAlerts } from "@/lib/alerts-calculator";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Cron authorization check for production environment
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const allAlerts = await computeAlerts(db);

    const now = new Date();
    // Sunday (0) is weekly digest day, which includes warnings. Otherwise, only send dangers.
    const isWeeklyDigestDay = now.getUTCDay() === 0;

    const activeAlerts = allAlerts.filter((alert) => {
      if (alert.type === "danger") return true;
      if (isWeeklyDigestDay && alert.type === "warning") return true;
      return false;
    });

    if (activeAlerts.length === 0) {
      return NextResponse.json({ sent: false, message: "No active alerts requiring dispatch." });
    }

    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (!adminEmail) {
      console.warn("ADMIN_ALERT_EMAIL is not set in environment variables. Skipping email dispatch.");
      return NextResponse.json({ sent: false, error: "ADMIN_ALERT_EMAIL is not configured." });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
    const alertsDashboardUrl = `${appUrl}/admin/alerts`;

    // Construct HTML table rows for active alerts
    const alertsHtmlList = activeAlerts
      .map(
        (alert, i) => `
      <tr style="${i % 2 ? "background-color:${EMAIL.band};" : ""}">
        <td style="padding:10px 12px;font-weight:700;color:${alert.type === "danger" ? EMAIL.danger : "#94600a"};">${escapeHtml(alert.type.toUpperCase())}</td>
        <td style="padding:10px 12px;font-weight:700;">${escapeHtml(alert.title)}</td>
        <td style="padding:10px 12px;color:${EMAIL.muted};line-height:1.4;">${escapeHtml(alert.message)}</td>
        <td style="padding:10px 12px;font-weight:700;white-space:nowrap;">${escapeHtml(alert.metric)}</td>
      </tr>`
      )
      .join("");

    const subject = isWeeklyDigestDay
      ? `[Gapl Weekly Digest] ${activeAlerts.length} Active System Alerts`
      : `[CRITICAL ALERT] ${activeAlerts.length} Danger Alerts Detected on Gapl`;

    const html = emailLayout(
      `<h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;">Alert digest</h1>
       <p style="margin:0 0 18px 0;color:${EMAIL.muted};font-size:14px;">Detected during the automated health check at ${escapeHtml(now.toUTCString())}.</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL.rule};border-top:2px solid ${EMAIL.ink};background-color:#ffffff;font-size:13px;text-align:left;">
         <tr>
           <th style="padding:10px 12px;color:${EMAIL.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid ${EMAIL.rule};">Severity</th>
           <th style="padding:10px 12px;color:${EMAIL.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid ${EMAIL.rule};">Alert</th>
           <th style="padding:10px 12px;color:${EMAIL.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid ${EMAIL.rule};">Details</th>
           <th style="padding:10px 12px;color:${EMAIL.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid ${EMAIL.rule};">Metric</th>
         </tr>
         ${alertsHtmlList}
       </table>
       <div style="margin:24px 0 0 0;">${emailButton(alertsDashboardUrl, "Open founder alerts")}</div>`,
      { preheader: `${activeAlerts.length} active alerts` }
    );

    await sendEmail({
      to: adminEmail,
      subject,
      html,
    });

    return NextResponse.json({
      sent: true,
      alertsCount: activeAlerts.length,
      isWeeklyDigest: isWeeklyDigestDay,
    });
  } catch (err: unknown) {
    console.error("Cron alerts failure:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
