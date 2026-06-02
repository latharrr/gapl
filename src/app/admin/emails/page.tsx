"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Mail,
  Send,
  CheckCircle,
  Eye,
  MousePointer,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function AdminEmailsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/emails");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load metrics");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics(true);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertOctagon size={32} className="text-red-500 mx-auto animate-pulse" />
        <h2 className="text-md font-bold text-white">Failed to Compile Email Intelligence</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" size="sm" onClick={() => fetchMetrics()}>
            Retry Fetch
          </Button>
        </div>
      </div>
    );
  }

  const { overview, funnel, campaigns, messages } = data;

  const cardStats = [
    { label: "Emails Sent", value: overview.sent, sub: "Total dispatches", icon: Send, color: "text-blue-400" },
    { label: "Delivered", value: overview.delivered, sub: `${overview.deliveryRate}% delivery rate`, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Opened", value: overview.opened, sub: `${overview.openRate}% open rate`, icon: Eye, color: "text-indigo-400" },
    { label: "Clicked", value: overview.clicked, sub: `${overview.ctr}% CTR (delivered)`, icon: MousePointer, color: "text-amber-400" },
    { label: "Bounces", value: overview.bounced, sub: `${overview.bounceRate}% bounce rate`, icon: AlertOctagon, color: "text-rose-500" },
    { label: "ROI Revenue", value: `₹${(overview.revenueGenerated || 0).toLocaleString()}`, sub: "Attributed sales", icon: Zap, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f23] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#6366f1]" />
            <h1 className="text-xl font-bold tracking-tight text-white">Email Intelligence</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Monitor delivery funnels, track custom redirect analytics, and review email conversions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
        >
          <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {cardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">{stat.label}</span>
                <Icon size={14} className={stat.color} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-[#a1a1aa] mt-0.5 truncate">{stat.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attribution Conversion Funnel */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={16} className="text-[#6366f1]" />
          <h2 className="text-sm font-semibold text-white">Attributed Conversion Funnel</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {funnel.map((step: any, index: number) => {
            const nextStep = funnel[index + 1];
            const pct = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(0) : null;
            return (
              <div key={index} className="contents">
                <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 text-center space-y-1 relative">
                  <div className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">{step.name}</div>
                  <div className="text-xl font-extrabold text-white">{step.value}</div>
                </div>
                {pct !== null && (
                  <div className="flex flex-col items-center justify-center text-center">
                    <ArrowRight size={14} className="text-[#71717a] rotate-90 md:rotate-0" />
                    <span className="text-[10px] font-bold text-[#6366f1] mt-1">{pct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaigns Overview */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Campaign Performance</h2>
          <Badge variant="primary">ROI Attribution Active</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#a1a1aa]">
            <thead className="bg-[#09090b] text-[10px] uppercase font-bold text-[#71717a] border-b border-[#27272a]">
              <tr>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3 text-center">Sent</th>
                <th className="px-6 py-3 text-center">Open Rate</th>
                <th className="px-6 py-3 text-center">CTR</th>
                <th className="px-6 py-3 text-center">Reports</th>
                <th className="px-6 py-3 text-center">Payments</th>
                <th className="px-6 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[#71717a]">
                    No campaigns tracked yet. Ready emails must be sent first.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp: any) => (
                  <tr key={camp.id} className="hover:bg-[#18181b]/55 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{camp.name}</div>
                      <div className="text-[10px] text-[#71717a] mt-0.5 truncate max-w-xs">{camp.subject}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-white">{camp.sent}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-white">{camp.openRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-white">{camp.ctr}%</span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-white">{camp.reports}</td>
                    <td className="px-6 py-4 text-center font-medium text-white">{camp.payments}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ₹{(camp.revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Audit Log */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#27272a]">
          <h2 className="text-sm font-semibold text-white">Audited Outbox & User Timelines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#a1a1aa]">
            <thead className="bg-[#09090b] text-[10px] uppercase font-bold text-[#71717a] border-b border-[#27272a]">
              <tr>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#71717a]">
                    No email logs detected.
                  </td>
                </tr>
              ) : (
                messages.map((msg: any) => {
                  const statusColors: any = {
                    failed: "danger",
                    bounced: "danger",
                    complained: "danger",
                    clicked: "success",
                    opened: "primary",
                    delivered: "success",
                    sent: "outline",
                    sending: "warning",
                  };
                  return (
                    <tr key={msg.id} className="hover:bg-[#18181b]/55 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{msg.email}</div>
                        <div className="text-[10px] text-[#71717a] mt-0.5 font-mono select-all">{msg.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{msg.campaignId.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColors[msg.status] || "default"}>
                          {msg.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${msg.score >= 100 ? "text-purple-400" : msg.score >= 50 ? "text-emerald-400" : msg.score >= 20 ? "text-amber-400" : "text-[#71717a]"}`}>
                            {msg.score}
                          </span>
                          <span className="text-[10px] text-[#71717a]">({msg.scoreLabel})</span>
                          {msg.hasConverted && <ShieldCheck size={12} className="text-emerald-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#71717a]">
                        {msg.updatedAt ? new Date(msg.updatedAt).toLocaleString() : new Date(msg.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
