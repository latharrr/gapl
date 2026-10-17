"use client";

import { LoadingChart } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { Progress } from "@/components/ui/Progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface FunnelStep {
  name: string;
  value: number;
}

interface SkillGap {
  skill: string;
  count: number;
}

interface UnitEconomics {
  revenuePerReport?: number | string;
  aiCostPerReport?: number | string;
  pdfCostPerReport?: number | string;
  storageCostPerReport?: number | string;
  hostingCostPerReport?: number | string;
  profitPerReport?: number | string;
}

interface Profitability {
  revenue: number;
  aiCost: number;
  storageCost: number;
  infrastructureCost: number;
  profit: number;
  margin: number;
  unitEconomics?: UnitEconomics;
}

interface CostTaskEntry {
  name: string;
  cost: number;
}

interface CostUserEntry {
  email: string;
  cost: number;
}

interface CostPromptEntry {
  task: string;
  cost: number;
}

interface CostStats {
  profitability?: Profitability;
  costByTask?: CostTaskEntry[];
  topExpensiveUsers?: CostUserEntry[];
  topExpensivePrompts?: CostPromptEntry[];
}

interface AnalyticsCharts {
  conversionFunnel?: FunnelStep[];
  commonSkillGaps?: SkillGap[];
}

interface AnalyticsStats {
  charts: AnalyticsCharts;
  costStats?: CostStats;
}

interface AnalyticsResponse extends AnalyticsStats {
  error?: string;
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const res = await adminFetch("/api/admin/stats");
        const data: AnalyticsResponse = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load analytics");
        if (!cancelled) setStats(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <LoadingChart />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20 text-ink-muted">
        Failed to compile analytics logs.
      </div>
    );
  }

  const { charts, costStats } = stats;

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
        <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Analytics and costs</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Explore landing conversions, candidate deficits, and platform profitability metrics</p>
      </div>

      {/* Profitability aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase block">Gross Income</span>
          <p className="text-md font-bold text-ink mt-1">₹{profitability.revenue}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase block">AI Gateway Spend</span>
          <p className="text-md font-bold text-danger mt-1">${profitability.aiCost}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase block">Est. DB Storage</span>
          <p className="text-md font-bold text-danger mt-1">${profitability.storageCost}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase block">Net Margin Profit</span>
          <p className="text-md font-bold text-success mt-1">₹{profitability.profit}</p>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT col-span-2 md:col-span-1">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase block">Operating Margin</span>
          <p className="text-md font-bold text-success mt-1">{profitability.margin}%</p>
        </Card>
      </div>

      {/* Unit Economics Section */}
      <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-6">
        <div>
          <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Unit Economics (Average Cost Per Report)</h2>
          <p className="text-[0.6875rem] text-ink-muted">Detailed revenue, infrastructure, and margin profile breakdown per analysis cycle</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-3 bg-surface-muted border border-border-DEFAULT rounded-[6px] text-center">
            <span className="text-[0.6875rem] text-ink-muted block uppercase font-medium">Revenue</span>
            <span className="text-sm font-bold text-ink font-mono mt-1 block">
              ${profitability.unitEconomics?.revenuePerReport || "0.00"}
            </span>
          </div>
          <div className="p-3 bg-surface-muted border border-border-DEFAULT rounded-[6px] text-center">
            <span className="text-[0.6875rem] text-ink-muted block uppercase font-medium">AI Cost</span>
            <span className="text-sm font-bold text-danger font-mono mt-1 block">
              -${profitability.unitEconomics?.aiCostPerReport || "0.000"}
            </span>
          </div>
          <div className="p-3 bg-surface-muted border border-border-DEFAULT rounded-[6px] text-center">
            <span className="text-[0.6875rem] text-ink-muted block uppercase font-medium">PDF Engine</span>
            <span className="text-sm font-bold text-danger font-mono mt-1 block">
              -${profitability.unitEconomics?.pdfCostPerReport || "0.15"}
            </span>
          </div>
          <div className="p-3 bg-surface-muted border border-border-DEFAULT rounded-[6px] text-center">
            <span className="text-[0.6875rem] text-ink-muted block uppercase font-medium">Storage</span>
            <span className="text-sm font-bold text-danger font-mono mt-1 block">
              -${profitability.unitEconomics?.storageCostPerReport || "0.05"}
            </span>
          </div>
          <div className="p-3 bg-surface-muted border border-border-DEFAULT rounded-[6px] text-center">
            <span className="text-[0.6875rem] text-ink-muted block uppercase font-medium">Hosting</span>
            <span className="text-sm font-bold text-danger font-mono mt-1 block">
              -${profitability.unitEconomics?.hostingCostPerReport || "0.10"}
            </span>
          </div>
          <div className="p-3 bg-surface-muted border border-border-DEFAULT rounded-[6px] text-center col-span-2 md:col-span-1">
            <span className="text-[0.6875rem] text-ink-muted block uppercase font-medium">Profit</span>
            <span className="text-sm font-bold text-success font-mono mt-1 block">
              ${profitability.unitEconomics?.profitPerReport || "0.00"}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Onboarding Funnel Progress */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-6">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Conversion Funnel Dropoffs</h2>
            <p className="text-[0.6875rem] text-ink-muted">Weekly aggregate onboarding milestones</p>
          </div>
          <div className="space-y-4">
            {charts?.conversionFunnel?.map((f: FunnelStep, idx: number, arr: FunnelStep[]) => {
              const baseValue = arr[0]?.value || 1;
              const pct = baseValue > 0 ? Math.round((f.value / baseValue) * 100) : 0;
              return (
                <div key={f.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-ink">
                    <span className="font-medium">{f.name}</span>
                    <span className="font-mono text-ink-muted">{f.value} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-surface-muted" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* User Retention curve */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-6">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Weekly User Retention Cohort</h2>
            <p className="text-[0.6875rem] text-ink-muted">Proportion of active users returning weekly</p>
          </div>
          <div className="text-center py-12 text-ink-muted text-xs border border-dashed border-border-DEFAULT rounded-[6px]">
            Retention cohort tracking not yet implemented. Requires session-level analytics integration.
          </div>
        </Card>

        {/* AI Cost by Task */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">AI Gateway Cost By Feature</h2>
            <p className="text-[0.6875rem] text-ink-muted">Spend categorized by gateway task mappings</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costStats?.costByTask || []} layout="vertical">
                <XAxis type="number" stroke="#595c69" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#595c69" fontSize={9} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: "#fcfcf7", border: "1px solid #d2d1c4", fontSize: "10px" }} labelClassName="text-ink-muted" />
                <Bar dataKey="cost" fill="#1d2b6b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Common Skill Gaps Chart */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Most Common Skill Deficits</h2>
            <p className="text-[0.6875rem] text-ink-muted">Top missing topics parsed from evaluated resumes</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.commonSkillGaps} layout="vertical">
                <XAxis type="number" stroke="#595c69" fontSize={10} tickLine={false} />
                <YAxis dataKey="skill" type="category" stroke="#595c69" fontSize={9} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: "#fcfcf7", border: "1px solid #d2d1c4", fontSize: "10px" }} labelClassName="text-ink-muted" />
                <Bar dataKey="count" fill="#1d2b6b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top 10 Expensive Users */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Top 10 Most Expensive Users</h2>
            <p className="text-[0.6875rem] text-ink-muted">Total gateway API costs incurred by user profiles</p>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {costStats?.topExpensiveUsers?.map((u: CostUserEntry, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-surface-muted border border-border-DEFAULT rounded-[6px]">
                <span className="text-ink-muted font-mono truncate max-w-[200px]">{u.email}</span>
                <span className="font-mono text-danger font-bold">${u.cost}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 10 Expensive Prompts/Tasks */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Top Expensive Prompts & Tasks</h2>
            <p className="text-[0.6875rem] text-ink-muted">Ranking tasks consuming the largest token budgets</p>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {costStats?.topExpensivePrompts?.map((p: CostPromptEntry, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-surface-muted border border-border-DEFAULT rounded-[6px]">
                <span className="text-ink font-semibold capitalize">{p.task.replace("-", " ")}</span>
                <span className="font-mono text-danger font-bold">${p.cost}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
