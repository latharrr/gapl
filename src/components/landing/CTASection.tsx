import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Gem's close: a full-bleed photo with one paper card on it.
export function CTASection() {
  return (
    <section className="landing">
      <div className="relative min-h-[640px] overflow-hidden">
        <Image src="/living/img/close.jpg" alt="The same sunlit table in late afternoon, the resume now marked in yellow and blue beside an open laptop" fill sizes="100vw" className="object-cover object-[65%_50%]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-desk" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#24160a]/70 via-[#24160a]/30 to-transparent" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28 sm:py-40 text-white">
          <h2 data-rise className="max-w-2xl serif-display text-[clamp(2.75rem,5.6vw,5rem)]">
            Your next application gets six seconds too.
          </h2>
          <div data-rise className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link href="/analyze" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "btn-sq sm:px-7")}>
              Read my resume <ArrowRight size={17} strokeWidth={2.5} />
            </Link>
            <Link href="/demo" className={cn(buttonBase, buttonSizes.lg, "btn-sq border border-white/40 text-white hover:border-white")}>
              See the sample report
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/75">First read is free. No card needed.</p>
        </div>
      </div>
    </section>
  );
}
