import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { computeAlerts, Alert } from "@/lib/alerts-calculator";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Cron authorization check for production environment
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
        (alert) => `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 12px; font-weight: bold; color: ${alert.type === "danger" ? "#dc2626" : "#d97706"};">
          ${alert.type.toUpperCase()}
        </td>
        <td style="padding: 12px; font-weight: 600; color: #111111;">
          ${alert.title}
        </td>
        <td style="padding: 12px; color: #4b5563; line-height: 1.4;">
          ${alert.message}
        </td>
        <td style="padding: 12px; font-weight: bold; color: #111111; white-space: nowrap;">
          ${alert.metric}
        </td>
      </tr>`
      )
      .join("");

    const subject = isWeeklyDigestDay
      ? `[Gapl Weekly Digest] ${activeAlerts.length} Active System Alerts`
      : `[CRITICAL ALERT] ${activeAlerts.length} Danger Alerts Detected on Gapl`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #111111; margin-top: 0; font-size: 20px; font-weight: 700;">Gapl System Alert Digest</h2>
        <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
          The following alerts were detected during the automated health check at ${now.toUTCString()}.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 24px; text-align: left; font-size: 13px;">
          <thead>
            <tr style="background-color: #f4f4f5; border-bottom: 2px solid #e4e4e7;">
              <th style="padding: 12px; color: #71717a; font-weight: 600;">Severity</th>
              <th style="padding: 12px; color: #71717a; font-weight: 600;">Alert</th>
              <th style="padding: 12px; color: #71717a; font-weight: 600;">Details</th>
              <th style="padding: 12px; color: #71717a; font-weight: 600;">Metric</th>
            </tr>
          </thead>
          <tbody>
            ${alertsHtmlList}
          </tbody>
        </table>

        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
          <a href="${alertsDashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.15s ease;">
            Open Alerts Dashboard
          </a>
        </div>
      </div>
    `;

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
  } catch (err: any) {
    console.error("Cron alerts failure:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
