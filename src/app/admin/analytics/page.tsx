"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  Award,
  Users,
  Compass,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-uid": user.uid },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20 text-[#71717a]">
        Failed to compile analytics logs.
      </div>
    );
  }

  const { charts, costStats } = stats;

  const funnelSteps = [
    { step: "Landing / Visits", count: 1240, pct: 100 },
    { step: "Created Accounts", count: 820, pct: 66 },
    { step: "Uploaded Resumes", count: 560, pct: 45 },
    { step: "Ran Analysis", count: 480, pct: 38 },
    { step: "Upgraded Subscriptions", count: 38, pct: 3.1 },
  ];

  const retentionWeeks = [
    { label: "Week 1", rate: 84 },
    { label: "Week 2", rate: 68 },
    { label: "Week 3", rate: 52 },
    { label: "Week 4", rate: 45 },
  ];

  const profitability = costStats?.profitability || {
    revenue: 0,
    aiCost: 0,
    storageCost: 0,
    infrastructureCost: 0,
    profit: 0,
    margin: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Analytics & Costs</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Explore landing conversions, candidate deficits, and platform profitability metrics</p>
      </div>

      {/* Profitability aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase block">Gross Income</span>
          <p className="text-md font-bold text-white mt-1">${profitability.revenue}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase block">AI Gateway Spend</span>
          <p className="text-md font-bold text-red-400 mt-1">${profitability.aiCost}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase block">Est. DB Storage</span>
          <p className="text-md font-bold text-red-400 mt-1">${profitability.storageCost}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase block">Net Margin Profit</span>
          <p className="text-md font-bold text-emerald-400 mt-1">${profitability.profit}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a] col-span-2 md:col-span-1">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase block">Operating Margin</span>
          <p className="text-md font-bold text-emerald-400 mt-1">{profitability.margin}%</p>
        </Card>
      </div>

      {/* Unit Economics Section */}
      <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-6">
        <div>
          <h2 className="text-sm font-bold text-white">Unit Economics (Average Cost Per Report)</h2>
          <p className="text-[10px] text-[#71717a]">Detailed revenue, infrastructure, and margin profile breakdown per analysis cycle</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-center">
            <span className="text-[9px] text-[#a1a1aa] block uppercase font-medium">Revenue</span>
            <span className="text-sm font-bold text-white font-mono mt-1 block">
              ${profitability.unitEconomics?.revenuePerReport || "0.00"}
            </span>
          </div>
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-center">
            <span className="text-[9px] text-[#a1a1aa] block uppercase font-medium">AI Cost</span>
            <span className="text-sm font-bold text-red-400 font-mono mt-1 block">
              -${profitability.unitEconomics?.aiCostPerReport || "0.000"}
            </span>
          </div>
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-center">
            <span className="text-[9px] text-[#a1a1aa] block uppercase font-medium">PDF Engine</span>
            <span className="text-sm font-bold text-red-400 font-mono mt-1 block">
              -${profitability.unitEconomics?.pdfCostPerReport || "0.15"}
            </span>
          </div>
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-center">
            <span className="text-[9px] text-[#a1a1aa] block uppercase font-medium">Storage</span>
            <span className="text-sm font-bold text-red-400 font-mono mt-1 block">
              -${profitability.unitEconomics?.storageCostPerReport || "0.05"}
            </span>
          </div>
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-center">
            <span className="text-[9px] text-[#a1a1aa] block uppercase font-medium">Hosting</span>
            <span className="text-sm font-bold text-red-400 font-mono mt-1 block">
              -${profitability.unitEconomics?.hostingCostPerReport || "0.10"}
            </span>
          </div>
          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-xl text-center col-span-2 md:col-span-1">
            <span className="text-[9px] text-[#a1a1aa] block uppercase font-medium">Profit</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">
              ${profitability.unitEconomics?.profitPerReport || "0.00"}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Onboarding Funnel Progress */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white">Conversion Funnel Dropoffs</h2>
            <p className="text-[10px] text-[#71717a]">Weekly aggregate onboarding milestones</p>
          </div>
          <div className="space-y-4">
            {funnelSteps.map((f) => (
              <div key={f.step} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-white">
                  <span className="font-medium">{f.step}</span>
                  <span className="font-mono text-[#a1a1aa]">{f.count} ({f.pct}%)</span>
                </div>
                <Progress value={f.pct} className="h-1.5 bg-[#09090b] indicator-bg-[#6366f1]" />
              </div>
            ))}
          </div>
        </Card>

        {/* User Retention curve */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white">Weekly User Retention Cohort</h2>
            <p className="text-[10px] text-[#71717a]">Proportion of active users returning weekly</p>
          </div>
          <div className="space-y-4">
            {retentionWeeks.map((w) => (
              <div key={w.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-white">
                  <span className="font-medium">{w.label}</span>
                  <span className="font-mono text-[#a1a1aa]">{w.rate}%</span>
                </div>
                <Progress value={w.rate} className="h-1.5 bg-[#09090b] indicator-bg-emerald-400" />
              </div>
            ))}
          </div>
        </Card>

        {/* AI Cost by Task */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">AI Gateway Cost By Feature</h2>
            <p className="text-[10px] text-[#71717a]">Spend categorized by gateway task mappings</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costStats?.costByTask || []} layout="vertical">
                <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={9} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", fontSize: "10px" }} labelClassName="text-[#a1a1aa]" />
                <Bar dataKey="cost" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Common Skill Gaps Chart */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Most Common Skill Deficits</h2>
            <p className="text-[10px] text-[#71717a]">Top missing topics parsed from evaluated resumes</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.commonSkillGaps} layout="vertical">
                <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis dataKey="skill" type="category" stroke="#52525b" fontSize={9} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", fontSize: "10px" }} labelClassName="text-[#a1a1aa]" />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top 10 Expensive Users */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Top 10 Most Expensive Users</h2>
            <p className="text-[10px] text-[#71717a]">Total gateway API costs incurred by user profiles</p>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {costStats?.topExpensiveUsers?.map((u: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-[#09090b] border border-[#27272a] rounded-xl">
                <span className="text-[#a1a1aa] font-mono truncate max-w-[200px]">{u.email}</span>
                <span className="font-mono text-red-400 font-bold">${u.cost}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 10 Expensive Prompts/Tasks */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Top Expensive Prompts & Tasks</h2>
            <p className="text-[10px] text-[#71717a]">Ranking tasks consuming the largest token budgets</p>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {costStats?.topExpensivePrompts?.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-[#09090b] border border-[#27272a] rounded-xl">
                <span className="text-white font-semibold capitalize">{p.task.replace("-", " ")}</span>
                <span className="font-mono text-red-400 font-bold">${p.cost}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
