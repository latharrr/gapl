import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CTASection() {
  return (
    <section className="on-desk">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <h2 className="display max-w-5xl text-[clamp(2.6rem,6vw,5rem)] leading-[1.04]">
          Your next application gets six seconds too. <span className="hero-hl [animation:none]">Spend them well.</span>
        </h2>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link href="/analyze" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "sm:px-7")}>
            Read my resume <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
          <Link href="/demo" className={cn(buttonBase, buttonVariants.desk, buttonSizes.lg)}>
            See the sample report
          </Link>
        </div>
        <p className="mt-5 text-sm text-desk-muted">First read is free. No card needed.</p>
      </div>
    </section>
  );
}
