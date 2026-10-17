import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/Badge";
import { Sheet, ChartRow, RecruiterRemark, Breakdown, GapsTable } from "@/components/report/ReportParts";
import { SAMPLE, waitlistCount } from "@/lib/sample-report";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample report",
  description: "An illustrative Gapl report: recruiter verdict, readiness breakdown, career gaps and the route to close them.",
};

const WL = waitlistCount(SAMPLE.gaps);

// Static illustrative data — clearly labeled as a sample, not real AI output.
export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[59px] bg-surface-muted">
        <div className="led-board">
          <p className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 text-[0.95rem] leading-snug">
            SAMPLE · NOT A REAL CANDIDATE
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Sample report</h1>
              <p className="mt-2 text-ink-secondary max-w-xl">
                This is what Gapl prints for one resume, checked for one role at one tier. Yours will be specific to
                your resume.
              </p>
            </div>
            <Link href="/analyze">
              <Button size="md">
                Check my status <ArrowRight size={16} strokeWidth={2.5} />
              </Button>
            </Link>
          </div>

          <Sheet title="Reservation chart" aside={`${SAMPLE.gaps.length} gaps found`}>
            <ChartRow
              role={SAMPLE.role}
              tier={SAMPLE.companyTier}
              ats={SAMPLE.atsScore}
              readiness={SAMPLE.readiness}
              verdict={SAMPLE.verdict}
              waitlist={WL}
              topGap={SAMPLE.topGap}
              tag="Sample"
            />
          </Sheet>

          <Sheet title="Recruiter's remark" aside={<VerdictBadge verdict={SAMPLE.verdict} waitlist={WL} size="sm" />}>
            <RecruiterRemark
              reason={SAMPLE.reason}
              strongestSignal={SAMPLE.strongestSignal}
              topGap={SAMPLE.topGap}
              whatWouldChange={SAMPLE.whatWouldChangeDecision}
              confidence={SAMPLE.confidence}
              verdict={SAMPLE.verdict}
            />
          </Sheet>

          <Sheet title="Readiness breakdown" aside={`${SAMPLE.readiness}/100 overall`}>
            <Breakdown items={SAMPLE.breakdown.map((b) => ({ label: b.label, score: b.score, note: b.pulledBy }))} />
          </Sheet>

          <Sheet title="Career gaps" aside="Ranked by impact on shortlisting">
            <GapsTable gaps={[...SAMPLE.gaps]} readiness={SAMPLE.readiness} />
          </Sheet>

          <Sheet title="Route" aside="Readiness values are illustrative">
            <ol className="chart-rows">
              {SAMPLE.route.map((stop) => (
                <li
                  key={stop.code}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] sm:grid-cols-[5rem_minmax(0,1fr)_8.5rem_5rem] gap-x-4 gap-y-1 px-4 sm:px-6 py-3.5 sm:items-baseline"
                >
                  <span className="chart-data text-sm font-bold text-primary-600">{stop.code}</span>
                  <div>
                    <p className="font-bold">{stop.build}</p>
                    {"closes" in stop && <p className="text-sm text-ink-muted">Closes the {stop.closes} gap</p>}
                  </div>
                  <span className="chart-data col-start-2 sm:col-start-auto text-sm sm:text-right whitespace-nowrap">Readiness {stop.readiness}</span>
                  <span className="col-start-2 sm:col-start-auto sm:text-right">
                    <span
                      className={cn(
                        "stamp text-[0.6875rem]",
                        stop.status.startsWith("WL") ? "text-danger bg-danger-bg" : "text-warning bg-warning-bg"
                      )}
                    >
                      {stop.status}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Sheet>

          <div className="led-ground rounded-[6px] px-5 sm:px-8 py-10 sm:py-12">
            <h2 className="display text-[clamp(1.9rem,4vw,2.75rem)] text-surface-muted max-w-2xl">
              Get the chart for your own resume.
            </h2>
            <p className="mt-3 text-surface-muted/70 max-w-xl">
              Your first analysis is free. Upload a PDF or paste the text, pick a role and tier, and get your status
              with its reasons.
            </p>
            <Link href="/analyze" className="inline-block mt-7">
              <Button size="lg">
                Check my status <ArrowRight size={17} strokeWidth={2.5} />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
