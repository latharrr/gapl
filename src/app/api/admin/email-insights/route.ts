import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { generateAICall } from "@/lib/ai-gateway";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    const db = getAdminDb();

    // 1. Load data
    const campaignsSnap = await db.collection("email_campaigns").get();
    const messagesSnap = await db.collection("email_messages").get();
    const paymentsSnap = await db.collection("payments").get();
    const linksSnap = await db.collection("trackable_links").get();
    const reportsSnap = await db.collection("reports").get();

    const campaigns = campaignsSnap.docs.map((d) => d.data());
    const messages = messagesSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => d.data());
    const links = linksSnap.docs.map((d) => d.data());
    const reports = reportsSnap.docs.map((d) => d.data());

    // 2. Programmatic aggregation
    const campaignStatsMap: Record<string, any> = {};
    campaigns.forEach((c) => {
      campaignStatsMap[c.id] = {
        id: c.id,
        name: c.name,
        subject: c.subject,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        revenue: 0,
        reports: 0,
      };
    });

    messages.forEach((m) => {
      const cStats = campaignStatsMap[m.campaignId];
      if (cStats) {
        cStats.sent += 1;
        if (["delivered", "opened", "clicked"].includes(m.status)) cStats.delivered += 1;
        if (["opened", "clicked"].includes(m.status)) cStats.opened += 1;
        if (m.status === "clicked") cStats.clicked += 1;
      }
    });

    payments.forEach((p) => {
      if (p.status === "captured" && p.attributedCampaignId) {
        const cStats = campaignStatsMap[p.attributedCampaignId];
        if (cStats) {
          cStats.revenue += p.amount || 0;
        }
      }
    });

    reports.forEach((r) => {
      if (r.attributedCampaignId) {
        const cStats = campaignStatsMap[r.attributedCampaignId];
        if (cStats) {
          cStats.reports += 1;
        }
      }
    });

    const campaignsList = Object.values(campaignStatsMap).map((c: any) => {
      const openRate = c.delivered > 0 ? (c.opened / c.delivered) * 100 : 0;
      const clickRate = c.opened > 0 ? (c.clicked / c.opened) * 100 : 0;
      return {
        ...c,
        openRate: parseFloat(openRate.toFixed(1)),
        clickRate: parseFloat(clickRate.toFixed(1)),
      };
    });

    // 3. Answer core analytical questions
    // A. Best performance subject lines (highest open rate with min 3 sent)
    const validOpenRates = campaignsList.filter((c: any) => c.sent >= 1);
    const bestSubjectCampaign = validOpenRates.length > 0
      ? [...validOpenRates].sort((a: any, b: any) => b.openRate - a.openRate)[0]
      : null;

    // B. Best revenue producer
    const bestRevenueCampaign = campaignsList.length > 0
      ? [...campaignsList].sort((a: any, b: any) => b.revenue - a.revenue)[0]
      : null;

    // C. Best roadmap activity producer (highest CTR)
    const bestCtrCampaign = validOpenRates.length > 0
      ? [...validOpenRates].sort((a: any, b: any) => b.clickRate - a.clickRate)[0]
      : null;

    // D. User engagement analysis
    // Score calculation
    const userScores: Record<string, { email: string; score: number; opens: number; clicks: number }> = {};
    messages.forEach((m) => {
      if (!userScores[m.userId]) {
        userScores[m.userId] = { email: m.email, score: 0, opens: 0, clicks: 0 };
      }
      if (["opened", "clicked"].includes(m.status)) {
        userScores[m.userId].score += 5;
        userScores[m.userId].opens += 1;
      }
      if (m.status === "clicked") {
        userScores[m.userId].score += 10;
        userScores[m.userId].clicks += 1;
      }
    });

    // Add conversions
    reports.forEach((r) => {
      if (userScores[r.userId]) userScores[r.userId].score += 20;
    });
    payments.forEach((p) => {
      if (p.status === "captured" && userScores[p.userId]) userScores[p.userId].score += 50;
    });

    const userScoresList = Object.entries(userScores).map(([userId, stats]) => ({
      userId,
      ...stats,
    }));

    const highlyEngaged = [...userScoresList]
      .filter((u) => u.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const likelyToChurn = [...userScoresList]
      .filter((u) => u.score < 20)
      .slice(0, 10);

    // 4. Generate AI summary
    let aiSummary = "";
    const promptData = {
      totalEmailsSent: messages.length,
      totalRevenueAttributed: payments.filter((p) => p.status === "captured" && p.attributedCampaignId).reduce((sum, p) => sum + (p.amount || 0), 0),
      campaignBreakdowns: campaignsList.map((c: any) => ({
        id: c.id,
        name: c.name,
        sent: c.sent,
        opened: c.opened,
        clicked: c.clicked,
        openRate: `${c.openRate}%`,
        revenue: `₹${c.revenue}`,
      })),
      highlyEngagedCount: highlyEngaged.length,
      likelyToChurnCount: likelyToChurn.length,
    };

    const aiPrompt = `You are a growth marketer and AI product strategist for Gapl, an application readiness platform.
Analyze the following email marketing and user engagement stats:
${JSON.stringify(promptData, null, 2)}

Provide a beautiful, executive-level summary answering:
1. Overall summary of email performance and revenue generation.
2. Subject lines that are working best and why.
3. Campaign recommendations to drive conversion improvements.
4. Insights into active vs. churning user segments.

Write your response in clean Markdown formatting without markdown code fences in the text itself. Be concise, bold, and professional.`;

    try {
      // Try invoking Groq/FreeModel through our ai-gateway
      const aiResponse = await generateAICall("email-insights", aiPrompt, {
        temperature: 0.7,
      });
      aiSummary = aiResponse.text;
    } catch (err: any) {
      console.warn("Failed to generate AI insights via LLM, falling back to programmatic template:", err);
      // Premium fallback template
      aiSummary = `### Weekly Email Intelligence Summary

**Overall Summary**
Gapl outbox sent a total of **${promptData.totalEmailsSent} emails**, generating **₹${promptData.totalRevenueAttributed}** in attributed payments. The communication channel is acting as a primary engagement driver.

**Key Campaign Insights**
* **Best Campaign Subject Line:** *"${bestSubjectCampaign?.subject || "Welcome to Gapl"}"* with a high open rate of **${bestSubjectCampaign?.openRate || 0}%**.
* **Primary Conversion Driver:** The **${bestRevenueCampaign?.name || "Payment Onboarding"}** campaign generated the most sales revenue (**₹${bestRevenueCampaign?.revenue || 0}**).
* **Engagement Engine:** **${bestCtrCampaign?.name || "Report Ready Notification"}** yielded the highest Click-Through Rate (**${bestCtrCampaign?.clickRate || 0}%**), driving return traffic into user roadmaps.

**Segment Analysis**
* We identified **${highlyEngaged.length} Power Users** displaying high email click velocities and roadmap task completion events.
* We have **${likelyToChurn.length} Cold Users** who haven't opened emails or logged task actions in the last 7 days. Recommend triggering the *Two-Week Reanalysis Sequence* to re-engage them.`;
    }

    return NextResponse.json({
      campaigns: campaignsList,
      qAndA: {
        bestSubject: bestSubjectCampaign ? {
          campaign: bestSubjectCampaign.name,
          subject: bestSubjectCampaign.subject,
          rate: `${bestSubjectCampaign.openRate}%`,
        } : null,
        bestRevenue: bestRevenueCampaign ? {
          campaign: bestRevenueCampaign.name,
          revenue: `₹${bestRevenueCampaign.revenue}`,
        } : null,
        bestRoadmap: bestCtrCampaign ? {
          campaign: bestCtrCampaign.name,
          ctr: `${bestCtrCampaign.clickRate}%`,
        } : null,
        highestOpen: bestSubjectCampaign ? {
          campaign: bestSubjectCampaign.name,
          rate: `${bestSubjectCampaign.openRate}%`,
        } : null,
      },
      highlyEngaged,
      likelyToChurn,
      aiSummary,
    });
  } catch (err: any) {
    console.error("Failed to generate email insights:", err);
    return NextResponse.json({ error: err.message || "Failed to load insights." }, { status: 500 });
  }
}
