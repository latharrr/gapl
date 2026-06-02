"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  Users,
  Coins,
  Cpu,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
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
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertTriangle size={32} className="text-yellow-500 mx-auto" />
        <h2 className="text-md font-bold text-white">Failed to Compile Stats</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          {error || "The platform database is currently empty or database credentials failed."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" size="sm" onClick={fetchStats}>
            Retry Fetch
          </Button>
        </div>
      </div>
    );
  }

  const { metrics, charts } = stats;

  const topMetrics = [
    { label: "Total Users", value: metrics.totalUsers, description: "All registrations", icon: Users, color: "text-[#818cf8]" },
    { label: "Active Users", value: metrics.activeUsers, description: "Non-suspended accounts", icon: CheckCircle, color: "text-emerald-400" },
    { label: "New Users Today", value: metrics.newUsersToday, description: "Joined last 24h", icon: TrendingUp, color: "text-[#818cf8]" },
    { label: "Total Revenue", value: `$${metrics.totalRevenue}`, description: "Gross earnings", icon: Coins, color: "text-amber-400" },
    { label: "MRR Estimate", value: `$${metrics.mrr}`, description: "Monthly recurring", icon: Coins, color: "text-purple-400" },
    { label: "Reports Generated", value: metrics.reportsCount, description: "Total ATS optimization", icon: Sparkles, color: "text-cyan-400" },
    { label: "AI Cost Today", value: `$${metrics.aiCostToday.toFixed(3)}`, description: "LLM token billing", icon: Cpu, color: "text-rose-400" },
    { label: "Profit Today", value: `$${metrics.profitToday}`, description: "Revenue minus token costs", icon: Coins, color: "text-emerald-400" },
    { label: "Conversion Rate", value: `${metrics.conversionRate}%`, description: "Paid plan conversions", icon: TrendingUp, color: "text-[#818cf8]" },
    { label: "Refund Rate", value: `${metrics.refundRate}%`, description: "Total refunds ratio", icon: AlertTriangle, color: "text-yellow-400" },
    { label: "Processing Failures", value: metrics.processingFailures, description: "Crashed reports", icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">Real-time SaaS operations overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats} className="p-2 border border-[#27272a] rounded-lg hover:bg-[#18181b] transition-colors text-[#a1a1aa] hover:text-white">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {topMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] text-[#a1a1aa] font-medium tracking-wide uppercase">{m.label}</span>
                <Icon size={12} className={m.color} />
              </div>
              <p className="text-lg font-bold text-white mt-2 tracking-tight">{m.value}</p>
              <span className="text-[9px] text-[#71717a] mt-0.5 block">{m.description}</span>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a]">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">User Registrations Growth</h3>
            <p className="text-[10px] text-[#71717a]">Total user accumulation timeline</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.usersGrowth}>
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", fontSize: "11px" }} labelClassName="text-[#a1a1aa]" />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Growth */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a]">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">Gross Revenue Performance</h3>
            <p className="text-[10px] text-[#71717a]">Accumulated payment collections (USD)</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueGrowth}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", fontSize: "11px" }} labelClassName="text-[#a1a1aa]" />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Costs Trend */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a]">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">Daily LLM Token Cost</h3>
            <p className="text-[10px] text-[#71717a]">API cost breakdown in USD</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.aiCostTrend}>
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", fontSize: "11px" }} labelClassName="text-[#a1a1aa]" />
                <Bar dataKey="cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a]">
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">Conversion Funnel Dropoffs</h3>
            <p className="text-[10px] text-[#71717a]">Onboarding & subscription completion rate %</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.conversionFunnel} layout="vertical">
                <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={10} tickLine={false} width={120} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", fontSize: "11px" }} labelClassName="text-[#a1a1aa]" />
                <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
