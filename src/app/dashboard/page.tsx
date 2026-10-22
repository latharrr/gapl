"use client";

import { useEffect, useState } from "react";
import { type AnalysisResult } from "@/types/analysis";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Sheet, ReportFace, Breakdown, GapsTable } from "@/components/report/ReportParts";
import { EmptyState as EmptyNote, Loading, PageHeader, APP_PAGE } from "@/components/ui/Sheet";

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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getUserReports(user.uid);
        if (!cancelled) setReports(data as unknown as AnalysisResult[]);
      } catch (err) {
        console.error("Error loading dashboard reports:", err);
        if (!cancelled) setLoadError(true);
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
      <Loading text="Loading your reports" />
    );
  }

  if (reports.length === 0) {
    return <EmptyState loadError={loadError} />;
  }

  // Most recent report is the primary one displayed
  const latestReport = reports[0];

  return <DashboardWithData result={latestReport} allReports={reports} />;
}

function EmptyState({ loadError = false }: { loadError?: boolean }) {
  return (
    <div className={APP_PAGE}>
      <PageHeader title="Dashboard" description="Your reports, roadmaps and CVs live here." />
      <Sheet>
        {loadError ? (
          <EmptyNote
            title="Your reports didn't load"
            action={<Button size="lg" onClick={() => window.location.reload()}>Try again</Button>}
          >
            This is on our side, not yours. Your reports are safe; reload to try again.
          </EmptyNote>
        ) : (
          <EmptyNote
            title="Get your first read"
            action={
              <>
                <Link href="/analyze">
                  <Button size="lg">
                    <Plus size={17} strokeWidth={2.5} /> Read my resume
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" size="lg">See a sample report</Button>
                </Link>
              </>
            }
          >
            Upload your resume, pick a role and tier, and Gapl tells you why it isn&apos;t getting shortlisted and what to
            build to change that.
          </EmptyNote>
        )}
      </Sheet>
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
    <div className={APP_PAGE}>
      <PageHeader
        title="Dashboard"
        meta={`Last read ${created} · ${allReports.length} ${allReports.length === 1 ? "analysis" : "analyses"} so far`}
        actions={
          <Link href="/analyze">
            <Button size="md">
              <Plus size={16} strokeWidth={2.5} /> New analysis
            </Button>
          </Link>
        }
      />

      <Sheet
        title="Latest read"
        aside={
          <Link href={`/report/${r.id}`} className="font-sans text-sm font-semibold text-primary-700 hover:underline inline-flex items-center gap-1">
            Full report <ArrowRight size={14} />
          </Link>
        }
      >
        <ReportFace
          role={r.role}
          tier={r.companyTier}
          ats={r.atsScore}
          readiness={r.readiness}
          verdict={r.recruiterVerdict.verdict}
          confidence={r.recruiterVerdict.confidence}
          reason={r.recruiterVerdict.reason}
          strongestSignal={r.recruiterVerdict.strongestSignal}
          topGap={r.recruiterVerdict.topGap}
          whatWouldChange={r.recruiterVerdict.whatWouldChangeDecision}
        />
      </Sheet>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Sheet title="Where the readiness comes from" aside={`${r.readiness}/100`}>
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
                  <CartesianGrid stroke="#e8e8e3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5e616a" }} tickLine={false} axisLine={{ stroke: "#c3c3bb" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5e616a" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e1e1db", color: "#16171b", fontSize: 12, boxShadow: "0 8px 20px -6px rgb(22 23 27 / 0.14)" }}
                    labelStyle={{ color: "#5e616a", fontSize: 11 }}
                    itemStyle={{ color: "#16171b" }}
                  />
                  <Line type="linear" dataKey="readiness" name="Readiness" stroke="#16171b" strokeWidth={2} dot={{ r: 4, fill: "#ffe14d", stroke: "#16171b", strokeWidth: 1.5 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <p className="figure text-6xl font-semibold leading-none">{r.readiness}</p>
                <p className="mt-3 text-sm text-ink-secondary max-w-[30ch]">
                  One read so far. Re-analyze your updated resume to start a trend line.
                </p>
              </div>
            )}
          </div>
        </Sheet>
      </div>

      <Sheet title="Build next" aside="Top gaps by impact">
        <GapsTable gaps={r.careerGaps.slice(0, 3)} readiness={r.readiness} />
      </Sheet>
    </div>
  );
}
