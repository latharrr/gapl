"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Award,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Mail,
  Zap,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserMinus,
} from "lucide-react";

export default function AdminEmailInsightsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/email-insights");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load email insights");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInsights(true);
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
        <h2 className="text-md font-bold text-white">Failed to Compile Email Insights</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchInsights()}>
          Retry Fetch
        </Button>
      </div>
    );
  }

  const { qAndA, highlyEngaged, likelyToChurn, aiSummary } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f23] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#6366f1]" />
            <h1 className="text-xl font-bold tracking-tight text-white">AI-Powered Email Insights</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Automated intelligence mapping conversion drivers, subject line stats, and weekly cohort assessments.
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

      {/* Analytical Q&A Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Q1: Best Subject */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Mail size={40} className="text-[#6366f1]" />
          </div>
          <span className="text-[9px] uppercase font-extrabold text-[#71717a] tracking-wider block">Best Subject Line</span>
          {qAndA.bestSubject ? (
            <>
              <div className="text-xs font-semibold text-white truncate">"{qAndA.bestSubject.subject}"</div>
              <div className="text-[10px] text-[#a1a1aa] mt-1">
                Campaign: <span className="font-bold text-white capitalize">{qAndA.bestSubject.campaign.replace(/_/g, " ")}</span>
              </div>
              <Badge variant="success" className="mt-2">{qAndA.bestSubject.rate} Open Rate</Badge>
            </>
          ) : (
            <div className="text-xs text-[#71717a]">Insufficient campaign data.</div>
          )}
        </div>

        {/* Q2: Best Revenue */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Zap size={40} className="text-amber-400" />
          </div>
          <span className="text-[9px] uppercase font-extrabold text-[#71717a] tracking-wider block">Highest Revenue Generated</span>
          {qAndA.bestRevenue ? (
            <>
              <div className="text-md font-extrabold text-white">{qAndA.bestRevenue.revenue}</div>
              <div className="text-[10px] text-[#a1a1aa]">
                Campaign: <span className="font-bold text-white capitalize">{qAndA.bestRevenue.campaign.replace(/_/g, " ")}</span>
              </div>
              <Badge variant="primary" className="mt-2">ROI Attributed</Badge>
            </>
          ) : (
            <div className="text-xs text-[#71717a]">Insufficient billing data.</div>
          )}
        </div>

        {/* Q3: Best Roadmap Activity */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={40} className="text-emerald-400" />
          </div>
          <span className="text-[9px] uppercase font-extrabold text-[#71717a] tracking-wider block">Roadmap Engagement Drive</span>
          {qAndA.bestRoadmap ? (
            <>
              <div className="text-xs font-semibold text-white truncate capitalize">{qAndA.bestRoadmap.campaign.replace(/_/g, " ")}</div>
              <div className="text-[10px] text-[#a1a1aa] mt-1">
                Highest Click CTR yields: <span className="font-bold text-emerald-400">{qAndA.bestRoadmap.ctr}</span>
              </div>
              <Badge variant="success" className="mt-2">High Interaction</Badge>
            </>
          ) : (
            <div className="text-xs text-[#71717a]">Insufficient CTR tracking.</div>
          )}
        </div>

        {/* Q4: Highest Open Rate */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Award size={40} className="text-indigo-400" />
          </div>
          <span className="text-[9px] uppercase font-extrabold text-[#71717a] tracking-wider block">Highest Click Yield</span>
          {qAndA.highestOpen ? (
            <>
              <div className="text-xs font-semibold text-white truncate capitalize">{qAndA.highestOpen.campaign.replace(/_/g, " ")}</div>
              <div className="text-[10px] text-[#a1a1aa] mt-1">
                Average conversion rate: <span className="font-bold text-white">{qAndA.highestOpen.rate}</span>
              </div>
              <Badge variant="outline" className="mt-2 border-indigo-500/50 text-indigo-400">Top Performer</Badge>
            </>
          ) : (
            <div className="text-xs text-[#71717a]">Insufficient metadata.</div>
          )}
        </div>
      </div>

      {/* Weekly AI summary panel */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 relative overflow-hidden space-y-4">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366f1]/5 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#6366f1]" />
          <h2 className="text-sm font-semibold text-white">Weekly Email Intelligence Report</h2>
        </div>
        <div className="prose prose-invert max-w-none text-xs text-[#a1a1aa] leading-relaxed space-y-4 font-normal whitespace-pre-wrap">
          {aiSummary}
        </div>
      </div>

      {/* Users engagement analysis tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highly Engaged Users */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Highly Engaged Cohort</h2>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left text-xs text-[#a1a1aa]">
              <thead className="bg-[#09090b] text-[10px] uppercase font-bold text-[#71717a] border-b border-[#27272a] sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">User Email</th>
                  <th className="px-4 py-2.5 text-center">Score</th>
                  <th className="px-4 py-2.5 text-center">Opens</th>
                  <th className="px-4 py-2.5 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {highlyEngaged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[#71717a]">
                      No active users matching threshold yet.
                    </td>
                  </tr>
                ) : (
                  highlyEngaged.map((user: any) => (
                    <tr key={user.userId} className="hover:bg-[#18181b]/55 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white truncate max-w-[180px]">{user.email}</div>
                        <div className="text-[9px] text-[#71717a] font-mono">{user.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-emerald-400">{user.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-white">{user.opens}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{user.clicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Churn Risks */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center gap-2">
            <UserMinus size={16} className="text-yellow-500" />
            <h2 className="text-sm font-semibold text-white">High Churn Risk Cohort</h2>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left text-xs text-[#a1a1aa]">
              <thead className="bg-[#09090b] text-[10px] uppercase font-bold text-[#71717a] border-b border-[#27272a] sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">User Email</th>
                  <th className="px-4 py-2.5 text-center">Score</th>
                  <th className="px-4 py-2.5 text-center">Opens</th>
                  <th className="px-4 py-2.5 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {likelyToChurn.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[#71717a]">
                      No low-engagement users detected yet.
                    </td>
                  </tr>
                ) : (
                  likelyToChurn.map((user: any) => (
                    <tr key={user.userId} className="hover:bg-[#18181b]/55 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white truncate max-w-[180px]">{user.email}</div>
                        <div className="text-[9px] text-[#71717a] font-mono">{user.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-yellow-500">{user.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-white">{user.opens}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{user.clicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
