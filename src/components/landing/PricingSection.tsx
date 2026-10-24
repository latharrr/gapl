import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "@/lib/mock-data";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Free plus the one-time credit packs, side by side. They differ only in how many credits you get.
export function PricingSection({ heading = true }: { heading?: boolean }) {
  return (
    <section id="pricing" className="on-desk scroll-mt-16">
      <div className={cn("max-w-7xl mx-auto px-4 sm:px-6", heading ? "py-20 sm:py-28" : "pt-2 pb-20 sm:pb-28")}>
        {heading && (
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <h2 className="display lg:col-span-6 text-[clamp(2.25rem,4.2vw,3.5rem)]">Start free. Pay when you&apos;re re-checking.</h2>
            <p className="lg:col-span-5 lg:col-start-8 text-lg leading-relaxed text-desk-muted">
              Every pack gets the full report, roadmap and CV tools. Pay once, no subscription, and your credits never
              expire.
            </p>
          </div>
        )}

        <ul className={cn("page rounded-[6px] grid md:grid-cols-2 xl:grid-cols-4 overflow-hidden", heading && "mt-12")}>
          {PRICING_PLANS.map((plan, i) => (
            <li
              key={plan.name}
              className={cn(
                "relative flex flex-col p-6 sm:p-7 border-border-DEFAULT",
                i > 0 && "border-t md:border-t-0",
                i % 2 === 1 && "md:border-l",
                i >= 2 && "md:border-t xl:border-t-0",
                i === 2 && "xl:border-l",
                plan.highlighted && "bg-highlight-soft/40"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold tracking-[-0.015em]">{plan.name}</h3>
                {plan.highlighted && <span className="mark-hl text-sm font-semibold">Recommended</span>}
              </div>
              <p className="mt-1 text-sm text-ink-muted xl:min-h-[2.5rem]">{plan.description}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="figure text-[2.75rem] font-semibold leading-none">₹{plan.price}</span>
                <span className="text-sm text-ink-muted">{plan.price === 0 ? "no card needed" : "one-time"}</span>
              </p>

              <Link
                href={plan.price === 0 ? "/auth/signup" : "/dashboard/billing"}
                className={cn(buttonBase, buttonSizes.lg, plan.highlighted ? buttonVariants.primary : buttonVariants.outline, "mt-6 w-full")}
              >
                {plan.cta}
              </Link>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[0.9375rem] text-ink-secondary">
                    <Check size={16} strokeWidth={2.5} className="mt-[3px] shrink-0 text-ink" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-desk-muted">
          Prices in INR, paid once through Razorpay. No subscription and no auto-renewal. An analysis, a CV build and a
          tailoring each use one credit.
        </p>
      </div>
    </section>
  );
}
