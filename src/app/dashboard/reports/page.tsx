"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type AnalysisResult } from "@/types/analysis";
import { Button } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/Badge";
import { Sheet, PageHeader, EmptyChart, LoadingChart, APP_PAGE } from "@/components/ui/Sheet";
import { waitlistCount } from "@/lib/sample-report";
import { Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";

export default function ReportsPage() {
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
        console.error("Failed to load user reports:", err);
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

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const cols = "md:grid-cols-[6.5rem_minmax(0,1.3fr)_minmax(0,1fr)_3.5rem_5.5rem_8.5rem_1rem]";

  return (
    <div className={APP_PAGE}>
      <PageHeader
        title="Reports"
        description="Every chart Gapl has prepared from your resume, newest first."
        actions={
          <Link href="/analyze">
            <Button size="md">
              <Plus size={16} strokeWidth={2.5} /> New analysis
            </Button>
          </Link>
        }
      />

      {loading ? (
        <LoadingChart text="LOADING REPORTS" />
      ) : loadError ? (
        <Sheet>
          <EmptyChart
            led="COULD NOT LOAD"
            title="Your reports didn't load"
            action={<Button size="lg" onClick={() => window.location.reload()}>Try again</Button>}
          >
            This is on our side, not yours. Your reports are safe; reload to try again.
          </EmptyChart>
        </Sheet>
      ) : reports.length === 0 ? (
        <Sheet>
          <EmptyChart
            led="NO REPORTS YET"
            title="Run your first analysis"
            action={
              <Link href="/analyze">
                <Button size="lg"><Plus size={17} strokeWidth={2.5} /> Check my status</Button>
              </Link>
            }
          >
            Upload your resume, pick a role and tier, and your first chart appears here.
          </EmptyChart>
        </Sheet>
      ) : (
        <Sheet title="Chart history" aside={`${reports.length} ${reports.length === 1 ? "report" : "reports"}`}>
          <div
            aria-hidden
            className={`hidden md:grid gap-4 px-6 py-2 border-b border-border-DEFAULT text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted ${cols}`}
          >
            <span>Date</span>
            <span>Applying for</span>
            <span>Tier</span>
            <span className="text-right">ATS</span>
            <span className="text-right">Readiness</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="chart-rows">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/report/${r.id}`}
                  className={`group grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 sm:px-6 py-4 md:items-center hover:bg-board/20 ${cols}`}
                >
                  <span className="chart-data col-span-2 md:col-span-1 text-xs text-ink-muted">{fmt(r.createdAt)}</span>
                  <span className="col-span-2 md:col-span-1 font-bold group-hover:text-primary-600">{r.role}</span>
                  <span className="col-span-2 md:col-span-1 text-sm text-ink-secondary">{r.companyTier}</span>
                  <span className="chart-data text-sm md:text-right"><span className="md:hidden text-ink-muted">ATS </span>{r.atsScore}</span>
                  <span className="chart-data text-sm font-bold md:text-right"><span className="md:hidden font-normal text-ink-muted">Readiness </span>{r.readiness}</span>
                  <span className="col-span-2 md:col-span-1">
                    <VerdictBadge verdict={r.recruiterVerdict.verdict} waitlist={waitlistCount(r.careerGaps ?? [])} size="sm" />
                  </span>
                  <ArrowRight size={15} className="hidden md:block text-ink-faint group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {!loading && reports.length > 0 && (
        <p className="text-sm text-ink-muted">
          Worked on your gaps?{" "}
          <Link href="/analyze" className="font-semibold text-primary-600 underline hover:text-primary-700">
            Re-analyze your updated resume
          </Link>{" "}
          to see what moved.
        </p>
      )}
    </div>
  );
}
