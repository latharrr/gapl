"use client";


import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Sheet, PageHeader, FigureStrip, EmptyChart, LoadingChart } from "@/components/ui/Sheet";
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load admin stats");
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
        <LoadingChart />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-5">
        <PageHeader title="Control room" description="Live operations overview." />
        <Sheet>
          <EmptyChart
            led="STATS UNAVAILABLE"
            title="Couldn't load the stats"
            action={<Button onClick={fetchStats}><RotateCcw size={16} /> Try again</Button>}
          >
            {error || "The database is empty or the admin credentials failed."}
          </EmptyChart>
        </Sheet>
      </div>
    );
  }

  const { metrics, charts } = stats;
  const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const axis = { stroke: "#a9a89a", fontSize: 11, tickLine: false, tick: { fill: "#595c69", fontFamily: "var(--font-martian)" } };
  const tip = { contentStyle: { background: "#1d2b6b", border: "none", borderRadius: 4, color: "#fcfcf7", fontSize: 12 }, labelStyle: { color: "#f5c518" }, itemStyle: { color: "#fcfcf7" } };

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
            { label: "Conversion", value: `${metrics.conversionRate}%`, note: "Paid plan conversions" },
          ]}
        />
      </Sheet>

      <Sheet title="Money" aside="Revenue in INR · AI cost in USD">
        <FigureStrip
          items={[
            { label: "Total revenue", value: inr(metrics.totalRevenue), note: "Gross collections" },
            { label: "MRR estimate", value: inr(metrics.mrr), note: "From active paid plans" },
            { label: "AI cost today", value: `$${Number(metrics.aiCostToday || 0).toFixed(3)}`, note: "LLM token billing" },
            { label: "Refund rate", value: `${metrics.refundRate}%`, note: "Refunds over gross", tone: Number(metrics.refundRate) > 5 ? "text-danger" : undefined },
          ]}
        />
      </Sheet>

      <Sheet title="Operations">
        <FigureStrip
          items={[
            { label: "Reports", value: metrics.reportsCount, note: "Analyses generated" },
            { label: "Profit today", value: metrics.profitToday, note: "Revenue minus token cost" },
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
                <Line type="linear" dataKey="users" stroke="#1d2b6b" strokeWidth={2.5} dot={{ r: 3, fill: "#f5c518", stroke: "#14140f" }} />
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
                <Bar dataKey="value" fill="#1d2b6b" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Sheet>
      </div>
    </div>
  );
}
