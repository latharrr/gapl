import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReportFace, Breakdown } from "@/components/report/ReportParts";
import { SAMPLE } from "@/lib/sample-report";

// What comes back: the face of the sample report, exactly as the product prints it.
export function ReadSection() {
  return (
    <section id="how-it-reads" className="on-desk scroll-mt-16 border-t border-desk-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 className="display lg:col-span-6 text-[clamp(2.25rem,4.6vw,3.75rem)]">Then it tells you why, in plain words.</h2>
          <p className="lg:col-span-5 lg:col-start-8 text-lg leading-relaxed text-desk-muted">
            Every report opens with the verdict a recruiter at that tier would give, the reason, and the one thing that
            would change their mind. The numbers come second, and each one shows its working.
          </p>
        </div>

        <div className="page mt-12 rounded-[6px] overflow-hidden">
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
            meta="Sample report · not a real candidate"
          />
          <div className="border-t border-border-DEFAULT">
            <h3 className="px-4 sm:px-6 pt-5 text-[0.9375rem] font-semibold">Where the {SAMPLE.readiness} comes from</h3>
            <Breakdown items={SAMPLE.breakdown.map((b) => ({ label: b.label, score: b.score, note: b.pulledBy }))} />
          </div>
        </div>

        <Link
          href="/demo"
          className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-desk-ink underline decoration-desk-faint underline-offset-4 hover:decoration-highlight"
        >
          Read the full sample report <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
