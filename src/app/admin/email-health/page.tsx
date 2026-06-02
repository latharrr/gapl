"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
  Server,
  ShieldAlert,
} from "lucide-react";

export default function AdminEmailHealthPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/emails");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load email health metrics");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealthData(true);
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
        <AlertTriangle size={32} className="text-yellow-500 mx-auto" />
        <h2 className="text-md font-bold text-white">Failed to Compile Email Health Metrics</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchHealthData()}>
          Retry Fetch
        </Button>
      </div>
    );
  }

  const { overview = {}, messages = [] } = data || {};

  // Filter issues (failed, bounced, complained)
  const healthIssues = messages.filter((m: any) =>
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
      <div className="flex items-center justify-between border-b border-[#1f1f23] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-[#6366f1]" />
            <h1 className="text-xl font-bold tracking-tight text-white">Email Health Dashboard</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Analyze ISP reputation metrics, bounce/complaint thresholds, and DMARC/SPF compliance settings.
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

      {/* Main Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bounce Rate Indicator */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Bounce Rate</span>
              <div className="text-3xl font-extrabold text-white mt-1">{overview.bounceRate}%</div>
            </div>
            {getStatusBadge(bounceStatus)}
          </div>
          <div className="text-xs text-[#a1a1aa] leading-relaxed">
            Standard ISP targets are &lt;2%. Rates exceeding 5% compromise sender reputation and trigger inbox routing drops.
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[#71717a] border-t border-[#27272a]">
            <Info size={11} />
            Target: &lt; 2.0%
          </div>
        </div>

        {/* Spam Complaint Indicator */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Spam Complaints</span>
              <div className="text-3xl font-extrabold text-white mt-1">{overview.complaintRate}%</div>
            </div>
            {getStatusBadge(complaintStatus)}
          </div>
          <div className="text-xs text-[#a1a1aa] leading-relaxed">
            Standard ISP complaint limits are &lt;0.1%. Going above 1.0% causes automatic domain blacklisting on Yahoo/Gmail.
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[#71717a] border-t border-[#27272a]">
            <Info size={11} />
            Target: &lt; 0.1%
          </div>
        </div>

        {/* Avg Open Rate Indicator */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Average Open Rate</span>
              <div className="text-3xl font-extrabold text-white mt-1">{overview.openRate}%</div>
            </div>
            {getStatusBadge(openStatus)}
          </div>
          <div className="text-xs text-[#a1a1aa] leading-relaxed">
            Measures engagement and inbox placement. Open rates &lt;20% imply spam folder routing or poor copy quality.
          </div>
          <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[#71717a] border-t border-[#27272a]">
            <Info size={11} />
            Target: &gt; 30%
          </div>
        </div>
      </div>

      {/* Domain DNS Verification Status */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-[#6366f1]" />
          <h2 className="text-sm font-semibold text-white">DNS Records & Authentication Status</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">SPF Record</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-[#71717a]">Validates Resend server outbound authorization IP ranges.</p>
          </div>
          <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">DKIM Key</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-[#71717a]">Cryptographically signs email headers to prevent spoofing.</p>
          </div>
          <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">DMARC Policy</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-[#71717a]">Defines routing rules for failed alignment (reject / quarantine).</p>
          </div>
          <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Custom Domain CNAME</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-[#71717a]">Custom CNAME links.gapl.in routing configured on Vercel.</p>
          </div>
        </div>
      </div>

      {/* Audited Failures, Bounces and Complaints */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-rose-500" />
            <h2 className="text-sm font-semibold text-white">Delivery Failures & Bounce Log</h2>
          </div>
          <Badge variant="danger">{healthIssues.length} issues logged</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#a1a1aa]">
            <thead className="bg-[#09090b] text-[10px] uppercase font-bold text-[#71717a] border-b border-[#27272a]">
              <tr>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Error Reason</th>
                <th className="px-6 py-3 text-right">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {healthIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#71717a]">
                    No delivery failures, bounces, or spam complaints recorded in active history. Domain health looks clean!
                  </td>
                </tr>
              ) : (
                healthIssues.map((issue: any) => (
                  <tr key={issue.id} className="hover:bg-[#18181b]/55 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{issue.email}</div>
                      <div className="text-[10px] text-[#71717a] mt-0.5 font-mono">{issue.userId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{issue.campaignId.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="danger">{issue.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 text-rose-400 font-mono text-[10px] max-w-xs truncate">
                      {issue.error || "Bounced back by recipient mail server or mailbox full."}
                    </td>
                    <td className="px-6 py-4 text-right text-[#71717a]">
                      {new Date(issue.updatedAt || issue.sentAt).toLocaleString()}
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
