"use client";

import { useEffect, useState } from "react";
import { type AnalysisResult } from "@/types/analysis";
import { Button } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/Badge";
import { Sheet, PageHeader, EmptyState, Loading, FigureStrip, APP_PAGE } from "@/components/ui/Sheet";
import { Breakdown, SkillsLedger } from "@/components/report/ReportParts";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";

export default function ProgressPage() {
  const { user } = useAuth();

  // Logged-out result comes straight from sessionStorage — derived during render, no effect.
  const [result, setResult] = useState<AnalysisResult | null>(() => {
    if (user) return null;
    try {
      const stored = sessionStorage.getItem("gapl_last_report");
      return stored ? (JSON.parse(stored) as AnalysisResult) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !!user);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const reports = await getUserReports(user.uid);
        if (!cancelled && reports.length > 0) {
          setResult(reports[0] as unknown as AnalysisResult);
        }
      } catch (err) {
        console.error("Error loading progress:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <Loading text="Loading progress" />;

  if (!result) {
    return (
      <div className={APP_PAGE}>
        <PageHeader title="Progress" />
        <Sheet>
          <EmptyState
            title="Nothing to track yet"
            action={
              <Link href="/analyze">
                <Button size="lg"><Plus size={17} strokeWidth={2.5} /> Run an analysis</Button>
              </Link>
            }
          >
            Run your first analysis to start tracking your readiness.
          </EmptyState>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={APP_PAGE}>
      <PageHeader
        title="Progress"
        description="Where your latest read stands, and what moves it."
        meta={`${result.role} · ${result.companyTier}`}
      />

      <Sheet title="Latest read" aside={<VerdictBadge verdict={result.recruiterVerdict.verdict} size="sm" />}>
        <FigureStrip
          items={[
            { label: "Readiness", value: result.readiness },
            { label: "ATS", value: result.atsScore, tone: result.atsScore >= 70 ? "text-success" : "text-warning" },
            { label: "Gaps", value: result.careerGaps.length, note: `${result.careerGaps.filter((g) => g.priority === "Critical").length} critical` },
          ]}
        />
      </Sheet>

      <Sheet title="Readiness components" aside="Weighted into readiness">
        <Breakdown
          pulledBy={result.recruiterVerdict.topGap}
          items={[
            { label: "Skill match", score: result.readinessBreakdown.skillMatch.score, weight: "40%" },
            { label: "Project complexity", score: result.readinessBreakdown.projectComplexity.score, weight: "30%" },
            { label: "Deployment evidence", score: result.readinessBreakdown.deploymentEvidence.score, weight: "20%" },
            { label: "Team collaboration", score: result.readinessBreakdown.teamCollaboration.score, weight: "10%" },
          ]}
        />
      </Sheet>

      <Sheet title="Skills">
        <SkillsLedger strong={result.strongSkills} missing={result.missingSkills} />
      </Sheet>

      <div className="on-desk rounded-[12px] px-5 sm:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.015em]">Built something since?</h2>
          <p className="mt-1 text-desk-muted">Re-analyze your updated resume and watch the readiness move.</p>
        </div>
        <Link href="/analyze" className="shrink-0">
          <Button size="lg"><Plus size={17} strokeWidth={2.5} /> Re-analyze</Button>
        </Link>
      </div>
    </div>
  );
}
