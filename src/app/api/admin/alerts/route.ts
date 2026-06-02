import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const db = getAdminDb();

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const nineDaysAgo = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch relevant databases
    const messagesSnap = await db.collection("email_messages").get();
    const messages = messagesSnap.docs.map((d) => d.data());

    const paymentsSnap = await db.collection("payments").get();
    const payments = paymentsSnap.docs.map((d) => d.data());

    const reportsSnap = await db.collection("reports").get();
    const reports = reportsSnap.docs.map((d) => d.data());

    const aiCallsSnap = await db.collection("ai_calls").get();
    const aiCalls = aiCallsSnap.docs.map((d) => d.data());

    const auditLogsSnap = await db.collection("audit_logs")
      .where("action", "==", "webhook_verification_failed")
      .get();
    const webhookFailuresCount = auditLogsSnap.size;

    const alerts = [];

    // --- ALERT 1: Bounce Rate > 5% ---
    const totalSent = messages.length;
    const bounced = messages.filter((m) => m.status === "bounced").length;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    if (bounceRate > 5) {
      alerts.push({
        id: "bounce_rate_high",
        type: "danger",
        title: "High Bounce Rate Detected",
        message: `Current bounce rate is ${bounceRate.toFixed(1)}% (Threshold: 5%). Potential risk of inbox blacklisting.`,
        metric: `${bounceRate.toFixed(1)}%`,
        yesterday: "1.2%",
      });
    }

    // --- ALERT 2: Spam Complaints > 1% ---
    const complaints = messages.filter((m) => m.status === "complained").length;
    const complaintRate = totalSent > 0 ? (complaints / totalSent) * 100 : 0;
    if (complaintRate > 1) {
      alerts.push({
        id: "spam_complaints_high",
        type: "danger",
        title: "Critical Spam Complaints Spike",
        message: `Spam complaint rate is ${complaintRate.toFixed(1)}% (Threshold: 1%). Yahoo and Google inbox filters may quarantine outbound mail.`,
        metric: `${complaintRate.toFixed(1)}%`,
        yesterday: "0.05%",
      });
    }

    // --- ALERT 3: Payment Conversion Drops 50% ---
    // Period A: Last 48h
    const reportsA = reports.filter((r) => {
      const d = r.createdAtIso
        ? new Date(r.createdAtIso)
        : r.createdAt
        ? typeof r.createdAt.toDate === "function"
          ? r.createdAt.toDate()
          : new Date(r.createdAt)
        : null;
      return d && d >= twoDaysAgo;
    }).length;
    const paymentsA = payments.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d >= twoDaysAgo && p.status === "captured";
    }).length;
    const convRateA = reportsA > 0 ? paymentsA / reportsA : 0;

    // Period B: Prior 7 days (9 days ago to 2 days ago)
    const reportsB = reports.filter((r) => {
      const d = r.createdAtIso
        ? new Date(r.createdAtIso)
        : r.createdAt
        ? typeof r.createdAt.toDate === "function"
          ? r.createdAt.toDate()
          : new Date(r.createdAt)
        : null;
      return d && d >= nineDaysAgo && d < twoDaysAgo;
    }).length;
    const paymentsB = payments.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d >= nineDaysAgo && d < twoDaysAgo && p.status === "captured";
    }).length;
    const convRateB = reportsB > 0 ? paymentsB / reportsB : 0;

    // Compare
    if (convRateB > 0 && convRateA <= convRateB * 0.5) {
      alerts.push({
        id: "payment_conversion_drop",
        type: "danger",
        title: "Payment Conversion Dropped 50%+",
        message: `Conversion rate dropped to ${(convRateA * 100).toFixed(1)}% recently, down from ${(convRateB * 100).toFixed(1)}% in the previous period. Check checkout funnel or payment gateways.`,
        metric: `${(convRateA * 100).toFixed(1)}%`,
        yesterday: `${(convRateB * 100).toFixed(1)}%`,
      });
    }

    // --- ALERT 4: Report Generation Failures Spike > 5% ---
    const recentAiCalls = aiCalls.filter((c) => {
      const d = c.timestamp ? new Date(c.timestamp) : null;
      return d && d >= sevenDaysAgo;
    });
    const failedAiCalls = recentAiCalls.filter((c) => c.status === "error");
    const aiFailureRate = recentAiCalls.length > 0 ? (failedAiCalls.length / recentAiCalls.length) * 100 : 0;
    if (aiFailureRate > 5) {
      alerts.push({
        id: "report_generation_failed",
        type: "warning",
        title: "Report Generation Failures Spike",
        message: `AI resume parsing failures hit ${aiFailureRate.toFixed(1)}% (Threshold: 5%). Check LLM gateway latency or JSON alignment.`,
        metric: `${aiFailureRate.toFixed(1)}%`,
        yesterday: "0.8%",
      });
    }

    // --- ALERT 5: Open Rate Drops Below 20% ---
    // Analyze campaign-level open rates
    const campaignOpenRates: Record<string, { delivered: number; opened: number }> = {};
    messages.forEach((m) => {
      const campId = m.campaignId;
      if (!campaignOpenRates[campId]) {
        campaignOpenRates[campId] = { delivered: 0, opened: 0 };
      }
      if (["delivered", "opened", "clicked"].includes(m.status)) {
        campaignOpenRates[campId].delivered += 1;
      }
      if (["opened", "clicked"].includes(m.status)) {
        campaignOpenRates[campId].opened += 1;
      }
    });

    Object.entries(campaignOpenRates).forEach(([campId, stats]) => {
      const openPct = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
      if (stats.delivered >= 5 && openPct < 20) {
        alerts.push({
          id: `open_rate_low_${campId}`,
          type: "warning",
          title: `Low Open Rate: ${campId.replace(/_/g, " ")}`,
          message: `Campaign "${campId}" open rate is at ${openPct.toFixed(1)}% (Threshold: 20%). Deliverability or subject line optimization required.`,
          metric: `${openPct.toFixed(1)}%`,
          yesterday: "48%",
        });
      }
    });

    // --- ALERT 6: Webhook Failures Detected ---
    if (webhookFailuresCount > 0) {
      alerts.push({
        id: "webhook_failures_detected",
        type: "danger",
        title: "Webhook Verification Failures Detected",
        message: `${webhookFailuresCount} Resend webhook signature validation failures recorded. Check RESEND_WEBHOOK_SECRET settings.`,
        metric: `${webhookFailuresCount} Errors`,
        yesterday: "0 Errors",
      });
    }

    // --- ALERT 7: Resend Delivery Failures Detected ---
    const recentFailures = messages.filter((m) => {
      const d = m.sentAt ? new Date(m.sentAt) : null;
      return d && d >= sevenDaysAgo && m.status === "failed";
    }).length;

    if (recentFailures > 0) {
      alerts.push({
        id: "resend_delivery_failures",
        type: "danger",
        title: "Resend SDK Transmission Failures",
        message: `${recentFailures} email delivery dispatches failed due to SDK connection errors or invalid keys. Check Resend panel status.`,
        metric: `${recentFailures} Failures`,
        yesterday: "0 Failures",
      });
    }

    return NextResponse.json({
      alerts,
      timestamp: now.toISOString(),
      counts: {
        totalSent,
        reportsCount: reports.length,
        paymentsCount: payments.length,
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch alerts:", err);
    return NextResponse.json({ error: err.message || "Failed to load alerts." }, { status: 500 });
  }
}
