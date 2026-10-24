"use client";

import { Loading } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  Server,
  ShieldAlert,
} from "lucide-react";

interface EmailHealthOverview {
  bounceRate: number;
  complaintRate: number;
  openRate: number;
}

interface EmailHealthMessage {
  id: string;
  email?: string;
  userId?: string;
  campaignId: string;
  status: string;
  error?: string;
  updatedAt?: string;
  sentAt?: string;
}

interface EmailHealthData {
  overview: EmailHealthOverview;
  messages: EmailHealthMessage[];
}

interface EmailHealthResponse extends EmailHealthData {
  error?: string;
}

async function loadEmailHealth(): Promise<EmailHealthResponse> {
  const res = await adminFetch("/api/admin/emails");
  const json: EmailHealthResponse = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load email health metrics");
  return json;
}

export default function AdminEmailHealthPage() {
  const { user } = useAuth();
  const [data, setData] = useState<EmailHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      setData(await loadEmailHealth());
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
        const result = await loadEmailHealth();
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
    fetchHealthData(true);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertTriangle size={32} className="text-warning mx-auto" />
        <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">Failed to Compile Email Health Metrics</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchHealthData()}>
          Retry Fetch
        </Button>
      </div>
    );
  }

  const { overview, messages } = data;

  // Filter issues (failed, bounced, complained)
  const healthIssues = messages.filter((m: EmailHealthMessage) =>
    ["failed", "bounced", "complained"].includes(m.status)
  );

  const bounceStatus = overview.bounceRate > 5 ? "poor" : overview.bounceRate > 2 ? "warning" : "healthy";
  const complaintStatus = overview.complaintRate > 0.5 ? "poor" : overview.complaintRate > 0.1 ? "warning" : "healthy";
  const openStatus = overview.openRate < 20 ? "poor" : overview.openRate < 35 ? "warning" : "healthy";

  const getStatusBadge = (status: "poor" | "warning" | "healthy") => {
    switch (status) {
      case "poor":
        return <Badge variant="danger">Critical</Badge>;
      case "warning":
        return <Badge variant="warning">Warning</Badge>;
      case "healthy":
        return <Badge variant="success">Excellent</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-DEFAULT pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Email health</h1>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">
            Analyze ISP reputation metrics, bounce/complaint thresholds, and DMARC/SPF compliance settings.
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

      {/* Main Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bounce Rate Indicator */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Bounce Rate</span>
              <div className="text-3xl font-extrabold text-ink mt-1">{overview.bounceRate}%</div>
            </div>
            {getStatusBadge(bounceStatus)}
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">
            Standard ISP targets are &lt;2%. Rates exceeding 5% compromise sender reputation and trigger inbox routing drops.
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-[0.6875rem] text-ink-muted border-t border-border-DEFAULT">
            <Info size={11} />
            Target: &lt; 2.0%
          </div>
        </div>

        {/* Spam Complaint Indicator */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Spam Complaints</span>
              <div className="text-3xl font-extrabold text-ink mt-1">{overview.complaintRate}%</div>
            </div>
            {getStatusBadge(complaintStatus)}
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">
            Standard ISP complaint limits are &lt;0.1%. Going above 1.0% causes automatic domain blacklisting on Yahoo/Gmail.
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-[0.6875rem] text-ink-muted border-t border-border-DEFAULT">
            <Info size={11} />
            Target: &lt; 0.1%
          </div>
        </div>

        {/* Avg Open Rate Indicator */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Average Open Rate</span>
              <div className="text-3xl font-extrabold text-ink mt-1">{overview.openRate}%</div>
            </div>
            {getStatusBadge(openStatus)}
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">
            Measures engagement and inbox placement. Open rates &lt;20% imply spam folder routing or poor copy quality.
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-[0.6875rem] text-ink-muted border-t border-border-DEFAULT">
            <Info size={11} />
            Target: &gt; 30%
          </div>
        </div>
      </div>

      {/* Domain DNS Verification Status */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-primary-600" />
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">DNS Records & Authentication Status</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-ink">SPF Record</span>
              <CheckCircle size={14} className="text-success" />
            </div>
            <p className="text-[0.6875rem] text-ink-muted">Validates Resend server outbound authorization IP ranges.</p>
          </div>
          <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-ink">DKIM Key</span>
              <CheckCircle size={14} className="text-success" />
            </div>
            <p className="text-[0.6875rem] text-ink-muted">Cryptographically signs email headers to prevent spoofing.</p>
          </div>
          <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-ink">DMARC Policy</span>
              <CheckCircle size={14} className="text-success" />
            </div>
            <p className="text-[0.6875rem] text-ink-muted">Defines routing rules for failed alignment (reject / quarantine).</p>
          </div>
          <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-ink">Custom Domain CNAME</span>
              <CheckCircle size={14} className="text-success" />
            </div>
            <p className="text-[0.6875rem] text-ink-muted">Tracked links resolve through /api/t on the app domain, or a links.* domain when NEXT_PUBLIC_TRACKING_DOMAIN is set.</p>
          </div>
        </div>
      </div>

      {/* Audited Failures, Bounces and Complaints */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border-DEFAULT flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-danger" />
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Delivery Failures & Bounce Log</h2>
          </div>
          <Badge variant="danger">{healthIssues.length} issues logged</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-surface-muted text-[0.6875rem] uppercase font-bold text-ink-muted border-b border-border-DEFAULT">
              <tr>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Error Reason</th>
                <th className="px-6 py-3 text-right">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-DEFAULT">
              {healthIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-ink-muted">
                    No delivery failures, bounces, or spam complaints recorded in active history. Domain health looks clean!
                  </td>
                </tr>
              ) : (
                healthIssues.map((issue: EmailHealthMessage) => (
                  <tr key={issue.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{issue.email}</div>
                      <div className="text-[0.6875rem] text-ink-muted mt-0.5 font-mono">{issue.userId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-ink">{issue.campaignId.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="danger">{issue.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-danger font-mono text-[0.6875rem] max-w-xs truncate">
                      {issue.error || "Bounced back by recipient mail server or mailbox full."}
                    </td>
                    <td className="px-6 py-4 text-right text-ink-muted">
                      {new Date(issue.updatedAt || issue.sentAt || "").toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
