import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VerdictBadge } from "@/components/ui/Badge";
import { SAMPLE, waitlistCount } from "@/lib/sample-report";
import { cn } from "@/lib/utils";

const WL = waitlistCount(SAMPLE.gaps);

// Every number on the chart carries a leader line to the reason behind it.
export function ReportRemarks() {
  const weakest = Math.min(...SAMPLE.breakdown.map((b) => b.score));

  return (
    <section className="bg-surface-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <h2 className="display text-[clamp(2rem,4.2vw,3.5rem)]">Every status comes with a remark.</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
            A score on its own tells you nothing. Gapl prints the reason next to every number, so you know exactly
            which part of your resume is holding you back.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
          {/* The one big number */}
          <div className="lg:border-r lg:border-border-strong lg:pr-12">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-muted">Readiness · sample</p>
            <p className="chart-data mt-1 text-[clamp(6rem,14vw,10rem)] font-bold leading-[0.9] tracking-[-0.04em]">
              {SAMPLE.readiness}
            </p>
            <div className="mt-5">
              <VerdictBadge verdict={SAMPLE.verdict} waitlist={WL} size="lg" />
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              {SAMPLE.role} · {SAMPLE.companyTier} · recruiter confidence {SAMPLE.confidence}%
            </p>
          </div>

          {/* Components with leader lines */}
          <div>
            <ul className="divide-y divide-border-DEFAULT border-y border-border-DEFAULT">
              {SAMPLE.breakdown.map((b) => {
                const weak = b.score === weakest;
                return (
                  <li key={b.key} className="grid gap-x-4 gap-y-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
                    <div className="flex items-baseline justify-between sm:block">
                      <p className="font-bold">{b.label}</p>
                      <p className={cn("chart-data text-sm font-bold sm:mt-0.5", weak ? "text-danger" : "text-ink-muted")}>
                        {b.score}/100
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
                      <div className="relative h-2.5 w-full sm:w-40 shrink-0 bg-surface-subtle rounded-[2px] overflow-hidden">
                        <div
                          className={cn("absolute inset-y-0 left-0 rounded-[2px]", weak ? "bg-danger" : "bg-primary-600")}
                          style={{ width: `${b.score}%` }}
                        />
                      </div>
                      <span aria-hidden className="hidden sm:block h-px flex-1 min-w-4 border-t border-dashed border-ink-faint" />
                      <p className={cn("text-sm sm:max-w-[22rem] sm:text-right", weak ? "font-semibold text-danger" : "text-ink-secondary")}>
                        {b.pulledBy}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-danger">Why the recruiter said no</dt>
                <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">{SAMPLE.reason}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-success">What would change it</dt>
                <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">{SAMPLE.whatWouldChangeDecision}</dd>
              </div>
            </dl>

            <Link
              href="/demo"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary-600 underline hover:text-primary-700"
            >
              Read the full sample report <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
