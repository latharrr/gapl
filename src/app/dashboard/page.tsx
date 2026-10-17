"use client";

import { useEffect, useState } from "react";
import { type AnalysisResult } from "@/types/analysis";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Sheet, ChartRow, RecruiterRemark, Breakdown, GapsTable } from "@/components/report/ReportParts";
import { waitlistCount } from "@/lib/sample-report";

export default function DashboardPage() {
  const { user } = useAuth();

  // Logged-out reports come straight from sessionStorage — derived during render, no effect.
  const [reports, setReports] = useState<AnalysisResult[]>(() => {
    if (user) return [];
    try {
      const stored = sessionStorage.getItem("gapl_last_report");
      return stored ? [JSON.parse(stored)] : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => !!user);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await getUserReports(user.uid);
        if (!cancelled) setReports(data as unknown as AnalysisResult[]);
      } catch (err) {
        console.error("Error loading dashboard reports:", err);
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
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-label="Loading" />
      </div>
    );
  }

  if (reports.length === 0) {
    return <EmptyState />;
  }

  // Most recent report is the primary one displayed
  const latestReport = reports[0];

  return <DashboardWithData result={latestReport} allReports={reports} />;
}

function EmptyState() {
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 md:pt-10 pb-12 max-w-5xl mx-auto">
      <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Your status</h1>
      <p className="mt-1 text-ink-muted">Your application readiness hub</p>

      <div className="mt-8 chart-sheet rounded-[6px] overflow-hidden">
        <div className="led-board px-4 py-2.5 text-[1rem]">NO CHART PREPARED YET</div>
        <div className="px-5 sm:px-8 py-10 sm:py-14 max-w-2xl">
          <h2 className="text-2xl font-[800] tracking-[-0.015em]">Run your first analysis</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">
            Upload your resume, pick a role and tier, and Gapl tells you exactly why you&apos;re not getting
            shortlisted, and what to build to fix it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/analyze">
              <Button size="lg">
                <Plus size={17} strokeWidth={2.5} /> Check my status
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg">See a sample report</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardWithData({
  result: r,
  allReports,
}: {
  result: AnalysisResult;
  allReports: AnalysisResult[];
}) {
  // Readiness over time from all user reports (oldest to newest)
  const progressData = [...allReports].reverse().map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    readiness: item.readiness,
    ats: item.atsScore,
  }));
  const created = new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-16 md:pt-10 pb-12 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Your status</h1>
          <p className="chart-data mt-1 text-xs text-ink-muted">
            Latest chart {created} · {allReports.length} {allReports.length === 1 ? "analysis" : "analyses"} so far
          </p>
        </div>
        <Link href="/analyze">
          <Button size="md">
            <Plus size={16} strokeWidth={2.5} /> New analysis
          </Button>
        </Link>
      </div>

      <Sheet
        title="Latest chart"
        aside={
          <Link href={`/report/${r.id}`} className="font-sans text-xs font-bold text-primary-600 hover:underline inline-flex items-center gap-1">
            Full report <ArrowRight size={13} />
          </Link>
        }
      >
        <ChartRow
          role={r.role}
          tier={r.companyTier}
          ats={r.atsScore}
          readiness={r.readiness}
          verdict={r.recruiterVerdict.verdict}
          waitlist={waitlistCount(r.careerGaps)}
          topGap={r.recruiterVerdict.topGap}
        />
      </Sheet>

      <Sheet title="Recruiter's remark">
        <RecruiterRemark
          reason={r.recruiterVerdict.reason}
          strongestSignal={r.recruiterVerdict.strongestSignal}
          topGap={r.recruiterVerdict.topGap}
          whatWouldChange={r.recruiterVerdict.whatWouldChangeDecision}
          confidence={r.recruiterVerdict.confidence}
          verdict={r.recruiterVerdict.verdict}
        />
      </Sheet>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Sheet title="Readiness breakdown" aside={`${r.readiness}/100`}>
          <Breakdown
            pulledBy={r.recruiterVerdict.topGap}
            items={[
              { label: "Skill match", score: r.readinessBreakdown.skillMatch.score, weight: "40%" },
              { label: "Project complexity", score: r.readinessBreakdown.projectComplexity.score, weight: "30%" },
              { label: "Deployment evidence", score: r.readinessBreakdown.deploymentEvidence.score, weight: "20%" },
              { label: "Team collaboration", score: r.readinessBreakdown.teamCollaboration.score, weight: "10%" },
            ]}
          />
        </Sheet>

        <Sheet title="Readiness over time">
          <div className="px-4 sm:px-6 py-5 h-[15.5rem]">
            {progressData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="#e6e6dc" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#595c69", fontFamily: "var(--font-martian)" }} tickLine={false} axisLine={{ stroke: "#a9a89a" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#595c69", fontFamily: "var(--font-martian)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1d2b6b", borderRadius: 4, border: "none", color: "#fcfcf7", fontSize: 12 }}
                    labelStyle={{ color: "#f5c518", fontSize: 11 }}
                    itemStyle={{ color: "#fcfcf7" }}
                  />
                  <Line type="linear" dataKey="readiness" name="Readiness" stroke="#1d2b6b" strokeWidth={2.5} dot={{ r: 4, fill: "#f5c518", stroke: "#14140f", strokeWidth: 1.5 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <p className="chart-data text-6xl font-bold leading-none">{r.readiness}</p>
                <p className="mt-3 text-sm text-ink-secondary max-w-[30ch]">
                  One chart so far. Re-analyze your updated resume to start a trend line.
                </p>
              </div>
            )}
          </div>
        </Sheet>
      </div>

      <Sheet title="Next builds" aside="Top gaps by impact">
        <GapsTable gaps={r.careerGaps.slice(0, 3)} readiness={r.readiness} />
      </Sheet>
    </div>
  );
}
