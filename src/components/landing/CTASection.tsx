import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LedBoard } from "@/components/brand/LedBoard";

export function CTASection() {
  return (
    <section className="led-ground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="display max-w-4xl text-[clamp(2.4rem,5.6vw,4.75rem)] text-surface-muted">
          Stop guessing why you&apos;re not getting called back.
        </h2>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link href="/analyze">
            <Button size="lg" className="w-full sm:w-auto">
              Check my status
              <ArrowRight size={17} strokeWidth={2.5} />
            </Button>
          </Link>
          <Link
            href="/demo"
            className="h-12 px-6 inline-flex items-center justify-center rounded-[6px] border-[1.5px] border-surface-muted/30 text-[0.9375rem] font-semibold text-surface-muted hover:border-surface-muted/70"
          >
            View the sample report
          </Link>
        </div>
        <LedBoard
          tag="GAPL"
          messages={["FIRST ANALYSIS FREE", "NO CARD NEEDED", "EVERY SCORE COMES WITH ITS REASONS"]}
          interval={2800}
          className="mt-12 h-12 px-4 text-lg bg-black/30 border border-led-dim max-w-xl"
        />
      </div>
    </section>
  );
}
