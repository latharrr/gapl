"use client";

import { LoadingChart } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
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

interface EmailOverview {
  sent?: number;
  delivered?: number;
  deliveryRate?: number;
  opened?: number;
  openRate?: number;
  clicked?: number;
  ctr?: number;
  bounced?: number;
  bounceRate?: number;
  revenueGenerated?: number;
}

interface EmailFunnelStep {
  name: string;
  value: number;
}

interface EmailCampaign {
  id: string;
  name?: string;
  subject?: string;
  sent?: number;
  openRate?: number | string;
  ctr?: number | string;
  reports?: number;
  payments?: number;
  revenue?: number;
}

interface EmailMessage {
  id: string;
  email?: string;
  userId?: string;
  campaignId: string;
  status: string;
  score?: number;
  scoreLabel?: string;
  hasConverted?: boolean;
  updatedAt?: string;
  sentAt?: string;
}

interface EmailsData {
  overview?: EmailOverview;
  funnel?: EmailFunnelStep[];
  campaigns?: EmailCampaign[];
  messages?: EmailMessage[];
}

interface EmailsResponse extends EmailsData {
  error?: string;
}

async function loadEmailMetrics(): Promise<EmailsResponse> {
  const res = await adminFetch("/api/admin/emails");
  const json: EmailsResponse = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load metrics");
  return json;
}

export default function AdminEmailsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<EmailsResponse | null>(null);
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
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : String(err));
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
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingEmail(false);
    }
  };

  const fetchMetrics = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      setData(await loadEmailMetrics());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const result = await loadEmailMetrics();
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics(true);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <LoadingChart />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertOctagon size={32} className="text-danger mx-auto animate-pulse" />
        <h2 className="text-lg font-[800] tracking-[-0.015em] text-ink">Failed to Compile Email control</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" size="sm" onClick={() => fetchMetrics()}>
            Retry Fetch
          </Button>
        </div>
      </div>
    );
  }

  const { overview = {}, funnel = [], campaigns = [], messages = [] } = data;

  const cardStats = [
    { label: "Emails Sent", value: overview.sent, sub: "Total dispatches", icon: Send, color: "text-primary-600" },
    { label: "Delivered", value: overview.delivered, sub: `${overview.deliveryRate}% delivery rate`, icon: CheckCircle, color: "text-success" },
    { label: "Opened", value: overview.opened, sub: `${overview.openRate}% open rate`, icon: Eye, color: "text-primary-600" },
    { label: "Clicked", value: overview.clicked, sub: `${overview.ctr}% CTR (delivered)`, icon: MousePointer, color: "text-warning" },
    { label: "Bounces", value: overview.bounced, sub: `${overview.bounceRate}% bounce rate`, icon: AlertOctagon, color: "text-danger" },
    { label: "ROI Revenue", value: `₹${(overview.revenueGenerated || 0).toLocaleString()}`, sub: "Attributed sales", icon: Zap, color: "text-primary-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-DEFAULT pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Email control</h1>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">
            Monitor delivery funnels, track custom redirect analytics, and review email conversions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-surface-DEFAULT border-border-DEFAULT text-ink-muted hover:text-ink"
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
            <div key={i} className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">{stat.label}</span>
                <Icon size={14} className={stat.color} />
              </div>
              <div>
                <div className="text-lg font-bold text-ink">{stat.value}</div>
                <div className="text-[0.6875rem] text-ink-muted mt-0.5 truncate">{stat.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Email Dispatcher */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-DEFAULT pb-4">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-primary-600" />
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Send Email to Candidate</h2>
          </div>
          {sendCount > 0 && (
            <Badge variant={sendCount >= 5 ? "danger" : "success"}>
              Dispatched {sendCount}/5 times
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Candidate Email</label>
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
              className="w-full bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Subject Line</label>
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
              className="w-full bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary-600 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Message Body</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiRewrite}
              disabled={aiRewriting || !emailMessage}
              className="h-7 text-[0.6875rem] px-2 bg-surface-muted border-border-DEFAULT text-ink-muted hover:text-ink"
            >
              {aiRewriting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin text-primary-600" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles size={11} className="mr-1 text-primary-600" />
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
            className="w-full bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 text-xs text-ink focus:outline-none focus:border-primary-600 transition-colors font-sans resize-y"
          />
        </div>

        {sendSuccessMsg && (
          <div className="bg-success-bg border border-success-border rounded-[5px] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle size={14} className="shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
            {sendCount < 5 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="h-7 text-[0.6875rem] px-3 bg-success hover:bg-success text-white border-none"
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
          <div className="bg-danger-bg border border-danger-border rounded-[5px] p-3 flex items-center gap-2 text-xs text-danger">
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
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={16} className="text-primary-600" />
          <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Attributed Conversion Funnel</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {funnel.map((step: EmailFunnelStep, index: number) => {
            const nextStep = funnel[index + 1];
            const pct = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(0) : null;
            return (
              <div key={index} className="contents">
                <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-4 text-center space-y-1 relative">
                  <div className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider">{step.name}</div>
                  <div className="text-xl font-extrabold text-ink">{step.value}</div>
                </div>
                {pct !== null && (
                  <div className="flex flex-col items-center justify-center text-center">
                    <ArrowRight size={14} className="text-ink-muted rotate-90 md:rotate-0" />
                    <span className="text-[0.6875rem] font-bold text-primary-600 mt-1">{pct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaigns Overview */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border-DEFAULT flex items-center justify-between">
          <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Campaign Performance</h2>
          <Badge variant="primary">ROI Attribution Active</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-surface-muted text-[0.6875rem] uppercase font-bold text-ink-muted border-b border-border-DEFAULT">
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
            <tbody className="divide-y divide-border-DEFAULT">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-ink-muted">
                    No campaigns tracked yet. Ready emails must be sent first.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp: EmailCampaign) => (
                  <tr key={camp.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{camp.name}</div>
                      <div className="text-[0.6875rem] text-ink-muted mt-0.5 truncate max-w-xs">{camp.subject}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-ink">{camp.sent}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-ink">{camp.openRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-ink">{camp.ctr}%</span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-ink">{camp.reports}</td>
                    <td className="px-6 py-4 text-center font-medium text-ink">{camp.payments}</td>
                    <td className="px-6 py-4 text-right font-bold text-ink">
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
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border-DEFAULT">
          <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Audited Outbox & User Timelines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-surface-muted text-[0.6875rem] uppercase font-bold text-ink-muted border-b border-border-DEFAULT">
              <tr>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-DEFAULT">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-ink-muted">
                    No email logs detected.
                  </td>
                </tr>
              ) : (
                messages.map((msg: EmailMessage) => {
                  const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "primary" | "outline"> = {
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
                    <tr key={msg.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-ink">{msg.email}</div>
                        <div className="text-[0.6875rem] text-ink-muted mt-0.5 font-mono select-all">{msg.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-ink">{msg.campaignId.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColors[msg.status] || "default"}>
                          {msg.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${(msg.score ?? 0) >= 100 ? "text-primary-600" : (msg.score ?? 0) >= 50 ? "text-success" : (msg.score ?? 0) >= 20 ? "text-warning" : "text-ink-muted"}`}>
                            {msg.score}
                          </span>
                          <span className="text-[0.6875rem] text-ink-muted">({msg.scoreLabel})</span>
                          {msg.hasConverted && <ShieldCheck size={12} className="text-success" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-ink-muted">
                        {msg.updatedAt ? new Date(msg.updatedAt).toLocaleString() : new Date(msg.sentAt ?? "").toLocaleString()}
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
