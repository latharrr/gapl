"use client";

import { Loading } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Award,
  AlertTriangle,
  RefreshCw,
  Mail,
  Zap,
  TrendingUp,
  UserCheck,
  UserMinus,
} from "lucide-react";

interface InsightSubject {
  subject: string;
  campaign: string;
  rate: string | number;
}

interface InsightRevenue {
  revenue: string | number;
  campaign: string;
}

interface InsightRoadmap {
  campaign: string;
  ctr: string | number;
}

interface InsightOpen {
  campaign: string;
  rate: string | number;
}

interface EmailQAndA {
  bestSubject?: InsightSubject | null;
  bestRevenue?: InsightRevenue | null;
  bestRoadmap?: InsightRoadmap | null;
  highestOpen?: InsightOpen | null;
}

interface EngagedUser {
  userId: string;
  email?: string;
  score?: number | string;
  opens?: number;
  clicks?: number;
}

interface EmailInsightsData {
  qAndA?: EmailQAndA;
  highlyEngaged?: EngagedUser[];
  likelyToChurn?: EngagedUser[];
  aiSummary?: string;
}

interface EmailInsightsResponse extends EmailInsightsData {
  error?: string;
}

async function loadEmailInsights(): Promise<EmailInsightsResponse> {
  const res = await adminFetch("/api/admin/email-insights");
  const json: EmailInsightsResponse = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load email insights");
  return json;
}

export default function AdminEmailInsightsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<EmailInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      setData(await loadEmailInsights());
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
        const result = await loadEmailInsights();
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
    fetchInsights(true);
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
        <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">Failed to Compile Email Insights</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchInsights()}>
          Retry Fetch
        </Button>
      </div>
    );
  }

  const { qAndA = {}, highlyEngaged = [], likelyToChurn = [], aiSummary = "" } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-DEFAULT pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Email insights</h1>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">
            Automated intelligence mapping conversion drivers, subject line stats, and weekly cohort assessments.
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

      {/* Analytical Q&A Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Q1: Best Subject */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Mail size={40} className="text-primary-600" />
          </div>
          <span className="text-[0.6875rem] uppercase font-extrabold text-ink-muted tracking-wider block">Best Subject Line</span>
          {qAndA.bestSubject ? (
            <>
              <div className="text-xs font-semibold text-ink truncate">&quot;{qAndA.bestSubject.subject}&quot;</div>
              <div className="text-[0.6875rem] text-ink-muted mt-1">
                Campaign: <span className="font-bold text-ink capitalize">{qAndA.bestSubject.campaign.replace(/_/g, " ")}</span>
              </div>
              <Badge variant="success" className="mt-2">{qAndA.bestSubject.rate} Open Rate</Badge>
            </>
          ) : (
            <div className="text-xs text-ink-muted">Insufficient campaign data.</div>
          )}
        </div>

        {/* Q2: Best Revenue */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Zap size={40} className="text-warning" />
          </div>
          <span className="text-[0.6875rem] uppercase font-extrabold text-ink-muted tracking-wider block">Highest Revenue Generated</span>
          {qAndA.bestRevenue ? (
            <>
              <div className="text-md font-extrabold text-ink">{qAndA.bestRevenue.revenue}</div>
              <div className="text-[0.6875rem] text-ink-muted">
                Campaign: <span className="font-bold text-ink capitalize">{qAndA.bestRevenue.campaign.replace(/_/g, " ")}</span>
              </div>
              <Badge variant="primary" className="mt-2">ROI Attributed</Badge>
            </>
          ) : (
            <div className="text-xs text-ink-muted">Insufficient billing data.</div>
          )}
        </div>

        {/* Q3: Best Roadmap Activity */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={40} className="text-success" />
          </div>
          <span className="text-[0.6875rem] uppercase font-extrabold text-ink-muted tracking-wider block">Roadmap Engagement Drive</span>
          {qAndA.bestRoadmap ? (
            <>
              <div className="text-xs font-semibold text-ink truncate capitalize">{qAndA.bestRoadmap.campaign.replace(/_/g, " ")}</div>
              <div className="text-[0.6875rem] text-ink-muted mt-1">
                Highest Click CTR yields: <span className="font-bold text-success">{qAndA.bestRoadmap.ctr}</span>
              </div>
              <Badge variant="success" className="mt-2">High Interaction</Badge>
            </>
          ) : (
            <div className="text-xs text-ink-muted">Insufficient CTR tracking.</div>
          )}
        </div>

        {/* Q4: Highest Open Rate */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Award size={40} className="text-primary-600" />
          </div>
          <span className="text-[0.6875rem] uppercase font-extrabold text-ink-muted tracking-wider block">Highest Click Yield</span>
          {qAndA.highestOpen ? (
            <>
              <div className="text-xs font-semibold text-ink truncate capitalize">{qAndA.highestOpen.campaign.replace(/_/g, " ")}</div>
              <div className="text-[0.6875rem] text-ink-muted mt-1">
                Average conversion rate: <span className="font-bold text-ink">{qAndA.highestOpen.rate}</span>
              </div>
              <Badge variant="outline" className="mt-2 border-primary-400 text-primary-600">Top Performer</Badge>
            </>
          ) : (
            <div className="text-xs text-ink-muted">Insufficient metadata.</div>
          )}
        </div>
      </div>

      {/* Weekly AI summary panel */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 relative overflow-hidden space-y-4">
        {/* Glow */}
        
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-600" />
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Weekly Email Intelligence Report</h2>
        </div>
        <div className="prose prose-invert max-w-none text-xs text-ink-muted leading-relaxed space-y-4 font-normal whitespace-pre-wrap">
          {aiSummary}
        </div>
      </div>

      {/* Users engagement analysis tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highly Engaged Users */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border-DEFAULT flex items-center gap-2">
            <UserCheck size={16} className="text-success" />
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Highly Engaged Cohort</h2>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="bg-surface-muted text-[0.6875rem] uppercase font-bold text-ink-muted border-b border-border-DEFAULT sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">User Email</th>
                  <th className="px-4 py-2.5 text-center">Score</th>
                  <th className="px-4 py-2.5 text-center">Opens</th>
                  <th className="px-4 py-2.5 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-DEFAULT">
                {highlyEngaged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                      No active users matching threshold yet.
                    </td>
                  </tr>
                ) : (
                  highlyEngaged.map((user: EngagedUser) => (
                    <tr key={user.userId} className="hover:bg-surface-muted transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink truncate max-w-[180px]">{user.email}</div>
                        <div className="text-[0.6875rem] text-ink-muted font-mono">{user.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-success">{user.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-ink">{user.opens}</td>
                      <td className="px-4 py-3 text-right text-ink font-medium">{user.clicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Churn Risks */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border-DEFAULT flex items-center gap-2">
            <UserMinus size={16} className="text-warning" />
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">High Churn Risk Cohort</h2>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="bg-surface-muted text-[0.6875rem] uppercase font-bold text-ink-muted border-b border-border-DEFAULT sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">User Email</th>
                  <th className="px-4 py-2.5 text-center">Score</th>
                  <th className="px-4 py-2.5 text-center">Opens</th>
                  <th className="px-4 py-2.5 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-DEFAULT">
                {likelyToChurn.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                      No low-engagement users detected yet.
                    </td>
                  </tr>
                ) : (
                  likelyToChurn.map((user: EngagedUser) => (
                    <tr key={user.userId} className="hover:bg-surface-muted transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink truncate max-w-[180px]">{user.email}</div>
                        <div className="text-[0.6875rem] text-ink-muted font-mono">{user.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-warning">{user.score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-ink">{user.opens}</td>
                      <td className="px-4 py-3 text-right text-ink font-medium">{user.clicks}</td>
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
