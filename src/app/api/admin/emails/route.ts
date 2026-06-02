import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const db = getAdminDb();

    // 1. Fetch campaigns, messages, and payments
    const campaignsSnap = await db.collection("email_campaigns").get();
    const messagesSnap = await db.collection("email_messages").get();
    const paymentsSnap = await db.collection("payments").get();
    const reportsSnap = await db.collection("reports").get();

    const campaigns = campaignsSnap.docs.map((d) => d.data());
    const messages = messagesSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => d.data());
    const reports = reportsSnap.docs.map((d) => d.data());

    // 2. Compute overall KPIs
    const sentCount = messages.length;
    const deliveredCount = messages.filter((m) =>
      ["delivered", "opened", "clicked"].includes(m.status)
    ).length;
    const openedCount = messages.filter((m) =>
      ["opened", "clicked"].includes(m.status)
    ).length;
    const clickedCount = messages.filter((m) => m.status === "clicked").length;
    const bouncedCount = messages.filter((m) => m.status === "bounced").length;
    const complainedCount = messages.filter((m) => m.status === "complained").length;
    const unsubscribedCount = messages.filter((m) => m.status === "unsubscribed").length;
    const failedCount = messages.filter((m) => m.status === "failed").length;

    const deliveryRate = sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0;
    const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
    const clickRate = openedCount > 0 ? (clickedCount / openedCount) * 100 : 0;
    const ctr = deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0;
    const bounceRate = sentCount > 0 ? (bouncedCount / sentCount) * 100 : 0;
    const complaintRate = sentCount > 0 ? (complainedCount / sentCount) * 100 : 0;
    const unsubscribeRate = sentCount > 0 ? (unsubscribedCount / sentCount) * 100 : 0;

    // 3. Attribution calculations (Revenue & Reports)
    let totalRevenue = 0;
    const campaignRevenue: Record<string, number> = {};
    const campaignReports: Record<string, number> = {};
    const campaignRoadmaps: Record<string, number> = {};
    const campaignPayments: Record<string, number> = {};

    payments.forEach((p) => {
      if (p.status === "captured") {
        totalRevenue += p.amount || 0;
        if (p.attributedCampaignId) {
          campaignRevenue[p.attributedCampaignId] =
            (campaignRevenue[p.attributedCampaignId] || 0) + (p.amount || 0);
          campaignPayments[p.attributedCampaignId] =
            (campaignPayments[p.attributedCampaignId] || 0) + 1;
        }
      }
    });

    reports.forEach((r) => {
      if (r.attributedCampaignId) {
        campaignReports[r.attributedCampaignId] =
          (campaignReports[r.attributedCampaignId] || 0) + 1;
      }
    });

    // 4. Build Campaign breakdown list
    const campaignsStats = campaigns.map((c) => {
      const campMessages = messages.filter((m) => m.campaignId === c.id);
      const campSent = campMessages.length;
      const campDelivered = campMessages.filter((m) =>
        ["delivered", "opened", "clicked"].includes(m.status)
      ).length;
      const campOpened = campMessages.filter((m) =>
        ["opened", "clicked"].includes(m.status)
      ).length;
      const campClicked = campMessages.filter((m) => m.status === "clicked").length;

      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        sent: campSent,
        delivered: campDelivered,
        opened: campOpened,
        clicked: campClicked,
        reports: campaignReports[c.id] || 0,
        payments: campaignPayments[c.id] || 0,
        revenue: campaignRevenue[c.id] || 0,
        openRate: campDelivered > 0 ? parseFloat(((campOpened / campDelivered) * 100).toFixed(1)) : 0,
        ctr: campDelivered > 0 ? parseFloat(((campClicked / campDelivered) * 100).toFixed(1)) : 0,
      };
    });

    // 5. Funnel Analysis
    // Sent -> Delivered -> Opened -> Clicked -> Visited -> Report -> Payment
    // We assume Visited matches Clicked for link redirects
    const funnel = [
      { name: "Sent", value: sentCount },
      { name: "Delivered", value: deliveredCount },
      { name: "Opened", value: openedCount },
      { name: "Clicked", value: clickedCount },
      { name: "Visited", value: clickedCount },
      { name: "Report Generated", value: reports.filter((r) => r.attributedCampaignId).length },
      { name: "Payment", value: payments.filter((p) => p.status === "captured" && p.attributedCampaignId).length },
    ];

    // 6. User Engagement Score calculator
    // Open = 5, Click = 10, Report = 20, Roadmap Start = 25, Complete Task = 30, Payment = 50
    // We construct recent list of email messages for dashboard audit
    const formattedMessages = messages.slice(0, 100).map((m) => {
      let score = 0;
      if (["opened", "clicked"].includes(m.status)) score += 5;
      if (m.status === "clicked") score += 10;
      // Fetch related actions for this user to calculate additional score
      const userReports = reports.filter((r) => r.userId === m.userId && r.attributedEmailId === m.id);
      const userPayments = payments.filter((p) => p.userId === m.userId && p.attributedEmailId === m.id && p.status === "captured");
      
      score += userReports.length * 20;
      score += userPayments.length * 50;

      let scoreLabel = "Cold";
      if (score >= 100) scoreLabel = "Power User";
      else if (score >= 50) scoreLabel = "Active";
      else if (score >= 20) scoreLabel = "Warm";

      return {
        ...m,
        score,
        scoreLabel,
        hasConverted: userPayments.length > 0,
      };
    });

    return NextResponse.json({
      overview: {
        sent: sentCount,
        delivered: deliveredCount,
        opened: openedCount,
        clicked: clickedCount,
        bounced: bouncedCount,
        complained: complainedCount,
        unsubscribed: unsubscribedCount,
        failed: failedCount,
        deliveryRate: parseFloat(deliveryRate.toFixed(1)),
        openRate: parseFloat(openRate.toFixed(1)),
        clickRate: parseFloat(clickRate.toFixed(1)),
        ctr: parseFloat(ctr.toFixed(1)),
        bounceRate: parseFloat(bounceRate.toFixed(1)),
        complaintRate: parseFloat(complaintRate.toFixed(1)),
        unsubscribeRate: parseFloat(unsubscribeRate.toFixed(1)),
        revenueGenerated: totalRevenue,
        reportsGenerated: reports.length,
      },
      funnel,
      campaigns: campaignsStats,
      messages: formattedMessages,
    });
  } catch (err: any) {
    console.error("Failed to load admin emails metrics:", err);
    return NextResponse.json({ error: err.message || "Failed to load stats." }, { status: 500 });
  }
}
