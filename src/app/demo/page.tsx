import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { Sheet, ReportFace, Breakdown, GapsTable } from "@/components/report/ReportParts";
import { SampleResume } from "@/components/brand/SampleResume";
import { SAMPLE } from "@/lib/sample-report";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample report",
  description: "An illustrative Gapl report: the recruiter's verdict, readiness breakdown, career gaps and what to build to close them.",
};

// Static illustrative data — clearly labelled as a sample, not real AI output.
export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main className="on-desk pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-5 pb-4">
            <div>
              <h1 className="display text-[clamp(2.4rem,5.5vw,3.75rem)]">The sample report</h1>
              <p className="mt-3 text-desk-muted max-w-xl">
                What Gapl writes back for one resume, read for one role at one tier. A sample, not a real candidate;
                yours will be about your resume.
              </p>
            </div>
            <Link href="/analyze" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
              Read my resume <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="page rounded-[6px] overflow-hidden">
            <ReportFace
              role={SAMPLE.role}
              tier={SAMPLE.companyTier}
              ats={SAMPLE.atsScore}
              readiness={SAMPLE.readiness}
              verdict={SAMPLE.verdict}
              confidence={SAMPLE.confidence}
              reason={SAMPLE.reason}
              strongestSignal={SAMPLE.strongestSignal}
              topGap={SAMPLE.topGap}
              whatWouldChange={SAMPLE.whatWouldChangeDecision}
              tag="Sample"
            />
          </div>

          <Sheet title="Where the readiness comes from" aside={`${SAMPLE.readiness}/100 overall`}>
            <Breakdown items={SAMPLE.breakdown.map((b) => ({ label: b.label, score: b.score, note: b.pulledBy }))} />
          </Sheet>

          <Sheet title="Career gaps" aside="Ranked by impact on shortlisting">
            <GapsTable gaps={[...SAMPLE.gaps]} readiness={SAMPLE.readiness} />
          </Sheet>

          <Sheet title="What to build, in order" aside="Readiness values are illustrative">
            <ol className="divide-y divide-border-DEFAULT">
              {SAMPLE.route.map((stop) => (
                <li
                  key={stop.build}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[6rem_minmax(0,1fr)_7rem] gap-x-4 gap-y-1 px-4 sm:px-6 py-4 sm:items-baseline"
                >
                  <span className="tabular text-sm text-ink-muted">{stop.when}</span>
                  <div>
                    <p className="font-semibold text-primary-700">{stop.build}</p>
                    <p className="text-sm text-ink-muted">Closes the {stop.closes} gap</p>
                  </div>
                  <span className="figure col-start-2 sm:col-start-auto text-sm sm:text-right">
                    Readiness <span className="font-semibold text-primary-700">{stop.readiness}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Sheet>

          <section className="pt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
            <div>
              <h2 className="display text-[clamp(2rem,4.5vw,3rem)]">Get this for your own resume.</h2>
              <p className="mt-4 text-desk-muted max-w-xl">
                Your first read is free. Upload a PDF or paste the text, pick a role and tier, and get the verdict with
                its reasons.
              </p>
              <Link href="/analyze" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "mt-8")}>
                Read my resume <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
            </div>
            <div className="hidden lg:block rotate-[1.5deg]">
              <SampleResume animate={false} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
