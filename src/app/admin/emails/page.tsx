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
  // Send Email State
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [aiRewriting, setAiRewriting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendCount, setSendCount] = useState(0);
  const [sendSuccessMsg, setSendSuccessMsg] = useState("");
  const [sendError, setSendError] = useState("");

  const handleAiRewrite = async () => {
    if (!emailMessage) return;
    setAiRewriting(true);
    setSendError("");
    try {
      const res = await adminFetch("/api/admin/emails/rewrite", {
        method: "POST",
        body: JSON.stringify({ message: emailMessage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to rewrite message");
      setEmailMessage(json.rewritten);
      setSendSuccessMsg("");
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setAiRewriting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !emailSubject || !emailMessage) {
      setSendError("Please fill out all fields.");
      return;
    }
    if (sendCount >= 5) {
      setSendError("Maximum of 5 sends reached for this message.");
      return;
    }
    setSendingEmail(true);
    setSendError("");
    try {
      const res = await adminFetch("/api/admin/emails/send", {
        method: "POST",
        body: JSON.stringify({
          email: recipientEmail,
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send email");
      
      const newCount = sendCount + 1;
      setSendCount(newCount);
      setSendSuccessMsg(`Email successfully sent! (Dispatch #${newCount} of 5)`);
      
      // Auto refresh the logs list to show the new manual email dispatch
      fetchMetrics(true);
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

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

  const { overview = {}, funnel = [], campaigns = [], messages = [] } = data || {};

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

      {/* Admin Email Dispatcher */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-[#6366f1]" />
            <h2 className="text-sm font-semibold text-white">Send Email to Candidate</h2>
          </div>
          {sendCount > 0 && (
            <Badge variant={sendCount >= 5 ? "danger" : "success"}>
              Dispatched {sendCount}/5 times
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Candidate Email</label>
            <input
              type="email"
              placeholder="candidate@example.com"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
                setSendCount(0);
                setSendSuccessMsg("");
                setSendError("");
              }}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Subject Line</label>
            <input
              type="text"
              placeholder="e.g. Your application review update"
              value={emailSubject}
              onChange={(e) => {
                setEmailSubject(e.target.value);
                setSendCount(0);
                setSendSuccessMsg("");
                setSendError("");
              }}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Message Body</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiRewrite}
              disabled={aiRewriting || !emailMessage}
              className="h-7 text-[10px] px-2 bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:text-white"
            >
              {aiRewriting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin text-[#6366f1]" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles size={11} className="mr-1 text-[#6366f1]" />
                  AI Rewrite
                </>
              )}
            </Button>
          </div>
          <textarea
            placeholder="Write your email body here. Placeholders and line breaks are fully supported."
            value={emailMessage}
            onChange={(e) => {
              setEmailMessage(e.target.value);
              setSendSuccessMsg("");
              setSendError("");
            }}
            rows={5}
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#6366f1] transition-colors font-sans resize-y"
          />
        </div>

        {sendSuccessMsg && (
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle size={14} className="shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
            {sendCount < 5 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="h-7 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-500 text-white border-none"
              >
                {sendingEmail ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Send Again?"
                )}
              </Button>
            )}
          </div>
        )}

        {sendError && (
          <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-3 flex items-center gap-2 text-xs text-rose-400">
            <AlertOctagon size={14} className="shrink-0" />
            <span>{sendError}</span>
          </div>
        )}

        {!sendSuccessMsg && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendEmail}
              disabled={sendingEmail || !recipientEmail || !emailSubject || !emailMessage || sendCount >= 5}
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={13} className="mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        )}
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
