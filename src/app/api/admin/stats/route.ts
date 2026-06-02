import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, getCountFromServer, query, where } from "firebase/firestore";

export const runtime = "nodejs";

async function getAdminUser(req: NextRequest) {
  const adminUid = req.headers.get("x-admin-uid");
  if (!adminUid) return null;
  const userRef = doc(db, "users", adminUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as any;
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminUser(req);
    if (!adminUser || !["super_admin", "admin", "support", "readonly"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    // 1. Server-Side Aggregations (Cheap & Scalable!)
    const totalUsersCountSnap = await getCountFromServer(collection(db, "users"));
    const totalReportsCountSnap = await getCountFromServer(collection(db, "reports"));
    const totalPaymentsCountSnap = await getCountFromServer(collection(db, "payments"));
    const totalAICallsCountSnap = await getCountFromServer(collection(db, "ai_calls"));

    const totalUsers = totalUsersCountSnap.data().count;
    const totalReports = totalReportsCountSnap.data().count;
    const totalPayments = totalPaymentsCountSnap.data().count;
    const totalAICallsCount = totalAICallsCountSnap.data().count;

    // Fetch health status
    const healthSnap = await getDocs(collection(db, "provider_health"));
    const providerHealth = healthSnap.docs.map((d) => d.data());

    // Retrieve only recent data (last 30 days) to construct trend lines and perform daily calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // We construct queries filtering by timestamp
    const usersQuery = query(collection(db, "users"), where("createdAt", ">=", thirtyDaysAgo));
    const reportsQuery = query(collection(db, "reports"), where("createdAt", ">=", thirtyDaysAgo));
    const paymentsQuery = query(collection(db, "payments"), where("createdAt", ">=", thirtyDaysAgo));
    const aiCallsQuery = query(collection(db, "ai_calls"), where("timestamp", ">=", thirtyDaysAgo.toISOString()));

    const [usersSnap, reportsSnap, paymentsSnap, aiCallsSnap] = await Promise.all([
      getDocs(usersQuery),
      getDocs(reportsQuery),
      getDocs(paymentsQuery),
      getDocs(aiCallsQuery),
    ]);

    const users = usersSnap.docs.map((d) => d.data());
    const reports = reportsSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => d.data());
    const aiCalls = aiCallsSnap.docs.map((d) => d.data());

    // 2. Calculations
    const activeUsers = users.filter((u) => u.suspended !== true).length + (totalUsers - users.length); // approximate active users based on recent delta
    const newUsersToday = users.filter((u) => {
      if (!u.createdAt) return false;
      const created = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return created.toDateString() === new Date().toDateString();
    }).length;

    // Payments calculations
    let totalRevenue = 0;
    let failedPayments = 0;
    let refunds = 0;
    const planCounts: Record<string, number> = { free: 0, basic: 0, pro: 0, premium: 0 };

    payments.forEach((p) => {
      if (p.status === "captured" || p.status === "refunded") {
        if (p.refunded) {
          refunds += p.amount;
        } else {
          totalRevenue += p.amount;
        }
      } else if (p.status === "failed") {
        failedPayments++;
      }
    });

    users.forEach((u) => {
      const plan = (u.plan || "free").toLowerCase();
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    // MRR approximation: Basic ($49), Pro ($149), Premium ($299)
    const mrr = (planCounts.basic * 49) + (planCounts.pro * 149) + (planCounts.premium * 299);

    // AI Costs
    let totalAICostToday = 0;
    let totalRecentAICalls = aiCalls.length;
    let failedAICalls = 0;

    aiCalls.forEach((call) => {
      const isToday = new Date(call.timestamp).toDateString() === new Date().toDateString();
      if (isToday) {
        totalAICostToday += call.cost || 0;
      }
      if (call.status === "error") {
        failedAICalls++;
      }
    });

    // Error calculations
    const promptFailureRate = totalRecentAICalls > 0 ? (failedAICalls / totalRecentAICalls) * 100 : 0;
    const processingFailures = reports.filter((r) => r.recruiterVerdict?.verdict === "Reject").length;
    const refundRate = totalRevenue > 0 ? (refunds / (totalRevenue + refunds)) * 100 : 0;
    const conversionRate = totalUsers > 0 ? ((planCounts.basic + planCounts.pro + planCounts.premium) / totalUsers) * 100 : 0;

    // 3. Build real daily growth charts from the last-30-day query results
    const dailyUsers: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};
    const dailyAICost: Record<string, number> = {};

    users.forEach((u) => {
      if (!u.createdAt) return;
      const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      dailyUsers[key] = (dailyUsers[key] || 0) + 1;
    });

    payments.forEach((p) => {
      if (!p.createdAt && !p.timestamp) return;
      const raw = p.createdAt || p.timestamp;
      const d = raw?.toDate ? raw.toDate() : new Date(raw);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      if (p.status === "captured") {
        dailyRevenue[key] = (dailyRevenue[key] || 0) + (p.amount || 0);
      }
    });

    aiCalls.forEach((c) => {
      const d = new Date(c.timestamp);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      dailyAICost[key] = (dailyAICost[key] || 0) + (c.cost || 0);
    });

    const usersGrowth = Object.entries(dailyUsers).map(([date, count]) => ({ date, users: count }));
    const revenueGrowth = Object.entries(dailyRevenue).map(([date, rev]) => ({ date, revenue: rev }));
    const aiCostTrend = Object.entries(dailyAICost).map(([date, cost]) => ({ date, cost: parseFloat(cost.toFixed(3)) }));

    // Funnel Conversions (real data)
    const paidUsers = planCounts.basic + planCounts.pro + planCounts.premium;
    const conversionFunnel = [
      { name: "Total Users", value: totalUsers },
      { name: "Generated Report", value: totalReports },
      { name: "Purchased Plan", value: paidUsers },
    ];

    // --- ADVANCED COST ENGINE & PROFITABILITY ---
    // Group costs by Provider, Model, Task, User
    const costByProvider: Record<string, number> = {};
    const costByModel: Record<string, number> = {};
    const costByTask: Record<string, number> = {};
    const costByUser: Record<string, { email: string; cost: number }> = {};

    aiCalls.forEach((call) => {
      const cost = call.cost || 0;
      const prov = call.provider || "Unknown";
      const mdl = call.model || "Unknown";
      const tsk = call.task || "Unknown";
      const uid = call.userId || "anonymous";

      costByProvider[prov] = (costByProvider[prov] || 0) + cost;
      costByModel[mdl] = (costByModel[mdl] || 0) + cost;
      costByTask[tsk] = (costByTask[tsk] || 0) + cost;

      if (!costByUser[uid]) {
        // Look up user email from users list
        const matched = users.find(u => u.uid === uid);
        costByUser[uid] = { email: matched?.email || uid, cost: 0 };
      }
      costByUser[uid].cost += cost;
    });

    // Format rankings
    const topExpensiveUsers = Object.values(costByUser)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(u => ({ email: u.email, cost: parseFloat(u.cost.toFixed(4)) }));

    const topExpensivePrompts = Object.entries(costByTask)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([task, cost]) => ({ task, cost: parseFloat(cost.toFixed(4)) }));

    // Overall AI Cost
    const totalAICost = aiCalls.reduce((acc, c) => acc + (c.cost || 0), 0);
    // Storage + Infra cost estimate
    const storageCost = totalUsers * 0.02 + reports.length * 0.05;
    const infrastructureCost = 45.00; // Mocked Monthly VPS/Railway/Database constant
    const netProfit = totalRevenue - totalAICost - storageCost - infrastructureCost;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const costStats = {
      costByProvider: Object.entries(costByProvider).map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(4)) })),
      costByModel: Object.entries(costByModel).map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(4)) })),
      costByTask: Object.entries(costByTask).map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(4)) })),
      topExpensiveUsers,
      topExpensivePrompts,
      profitability: {
        revenue: totalRevenue,
        aiCost: parseFloat(totalAICost.toFixed(3)),
        storageCost: parseFloat(storageCost.toFixed(2)),
        infrastructureCost,
        profit: parseFloat(netProfit.toFixed(2)),
        margin: parseFloat(netMargin.toFixed(1)),
        unitEconomics: {
          revenuePerReport: parseFloat((totalRevenue / Math.max(1, totalReports)).toFixed(2)),
          aiCostPerReport: parseFloat((totalAICost / Math.max(1, totalReports)).toFixed(3)),
          pdfCostPerReport: 0.15,
          storageCostPerReport: 0.05,
          hostingCostPerReport: 0.10,
          profitPerReport: parseFloat(((totalRevenue / Math.max(1, totalReports)) - (totalAICost / Math.max(1, totalReports)) - 0.30).toFixed(2)),
        }
      }
    };

    // Skill gaps aggregated from real reports (last 30 days)
    const skillGapMap: Record<string, number> = {};
    reports.forEach((r) => {
      const gaps = r.missingSkills || r.careerGaps?.map((g: any) => g.skill) || [];
      gaps.forEach((s: string) => {
        skillGapMap[s] = (skillGapMap[s] || 0) + 1;
      });
    });
    const commonSkillGaps = Object.entries(skillGapMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeUsers,
        newUsersToday,
        totalRevenue,
        mrr,
        reportsCount: reports.length,
        aiCostToday: parseFloat(totalAICostToday.toFixed(4)),
        profitToday: parseFloat((newUsersToday * 49 - totalAICostToday).toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        refundRate: parseFloat(refundRate.toFixed(1)),
        processingFailures,
      },
      charts: {
        usersGrowth,
        revenueGrowth,
        aiCostTrend,
        conversionFunnel,
        commonSkillGaps,
      },
      providerHealth,
      costStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
