"use client";


import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Sheet, PageHeader, FigureStrip, EmptyState, Loading } from "@/components/ui/Sheet";
import { RotateCcw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardMetrics {
  totalUsers?: number;
  activeUsers?: number;
  newUsersToday?: number;
  conversionRate?: number | string;
  totalRevenue?: number;
  revenue30d?: number;
  aiCostToday?: number;
  refundRate?: number | string;
  reportsCount?: number;
  profitToday?: number | string;
  usdToInr?: number;
  processingFailures?: number;
}

interface GrowthPoint {
  date: string;
  users: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface CostPoint {
  date: string;
  cost: number;
}

interface FunnelPoint {
  name: string;
  value: number;
}

interface DashboardCharts {
  usersGrowth?: GrowthPoint[];
  revenueGrowth?: RevenuePoint[];
  aiCostTrend?: CostPoint[];
  conversionFunnel?: FunnelPoint[];
}

interface DashboardStats {
  metrics?: DashboardMetrics;
  charts?: DashboardCharts;
}

interface DashboardResponse extends DashboardStats {
  error?: string;
}

async function loadDashboardStats(): Promise<DashboardResponse> {
  const res = await adminFetch("/api/admin/stats");
  const data: DashboardResponse = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load admin stats");
  return data;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      setStats(await loadDashboardStats());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const result = await loadDashboardStats();
        if (!cancelled) setStats(result);
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
        <Loading />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-5">
        <PageHeader title="Control room" description="Live operations overview." />
        <Sheet>
          <EmptyState
            title="Couldn't load the stats"
            action={<Button onClick={fetchStats}><RotateCcw size={16} /> Try again</Button>}
          >
            {error || "The database is empty or the admin credentials failed."}
          </EmptyState>
        </Sheet>
      </div>
    );
  }

  const { metrics = {}, charts = {} } = stats;
  const inr = (n: number | undefined) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const axis = { stroke: "#c3c3bb", fontSize: 11, tickLine: false, tick: { fill: "#5e616a" } };
  const tip = { contentStyle: { background: "#ffffff", border: "1px solid #e1e1db", borderRadius: 8, color: "#16171b", fontSize: 12 }, labelStyle: { color: "#5e616a" }, itemStyle: { color: "#16171b" } };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Control room"
        description="Live operations overview."
        actions={
          <Button variant="outline" onClick={fetchStats}>
            <RotateCcw size={16} /> Refresh
          </Button>
        }
      />

      <Sheet title="Users">
        <FigureStrip
          items={[
            { label: "Total users", value: metrics.totalUsers, note: "All registrations" },
            { label: "Active", value: metrics.activeUsers, note: "Not suspended" },
            { label: "New today", value: metrics.newUsersToday, note: "Last 24 hours" },
            { label: "Conversion", value: `${metrics.conversionRate}%`, note: "Accounts that bought credits" },
          ]}
        />
      </Sheet>

      <Sheet title="Money" aside="Revenue in INR · AI cost in USD">
        <FigureStrip
          items={[
            { label: "Total revenue", value: inr(metrics.totalRevenue), note: "Gross collections" },
            { label: "Revenue, 30 days", value: inr(metrics.revenue30d), note: "Captured minus refunds" },
            { label: "AI cost today", value: `$${Number(metrics.aiCostToday || 0).toFixed(3)}`, note: "LLM token billing" },
            { label: "Refund rate", value: `${metrics.refundRate}%`, note: "Refunds over gross", tone: Number(metrics.refundRate) > 5 ? "text-danger" : undefined },
          ]}
        />
      </Sheet>

      <Sheet title="Operations">
        <FigureStrip
          items={[
            { label: "Reports", value: metrics.reportsCount, note: "Analyses generated" },
            { label: "Profit today", value: inr(Number(metrics.profitToday ?? 0)), note: `Revenue minus AI cost at ₹${metrics.usdToInr ?? 84}/$` },
            { label: "Failures", value: metrics.processingFailures, note: "Crashed reports", tone: Number(metrics.processingFailures) > 0 ? "text-danger" : "text-success" },
          ]}
        />
      </Sheet>

      <div className="grid gap-5 lg:grid-cols-2">
        <Sheet title="User growth" aside="Cumulative">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.usersGrowth} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#e6e6dc" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tip} />
                <Line type="linear" dataKey="users" stroke="#16171b" strokeWidth={2} dot={{ r: 3, fill: "#ffe14d", stroke: "#16171b" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Sheet>

        <Sheet title="Revenue" aside="INR, cumulative">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueGrowth} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#e6e6dc" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tip} />
                <Area type="linear" dataKey="revenue" stroke="#1d7337" fill="#e3efe3" fillOpacity={1} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Sheet>

        <Sheet title="Daily LLM cost" aside="USD">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.aiCostTrend} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="#e6e6dc" vertical={false} />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tip} cursor={{ fill: "#e6e6dc" }} />
                <Bar dataKey="cost" fill="#b0241c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sheet>

        <Sheet title="Conversion funnel" aside="% completing each step">
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.conversionFunnel} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#e6e6dc" horizontal={false} />
                <XAxis type="number" {...axis} />
                <YAxis dataKey="name" type="category" {...axis} width={120} />
                <Tooltip {...tip} cursor={{ fill: "#e6e6dc" }} />
                <Bar dataKey="value" fill="#16171b" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sheet>
      </div>
    </div>
  );
}
