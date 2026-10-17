import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { PRICING_PLANS } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Pricing set as a fare chart: one row per plan, fares in rupees, the recommended row marked.
export function PricingSection({ heading = true }: { heading?: boolean }) {
  return (
    <section id="pricing" className="bg-surface-muted scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {heading && (
          <div className="max-w-2xl">
            <h2 className="display text-[clamp(2rem,4.2vw,3.5rem)]">Fare chart.</h2>
            <p className="mt-4 text-lg text-ink-secondary">
              Every plan gets the full report, roadmap and CV tools. Plans differ only in how many analyses you get each month. Pay once; no subscriptions.
            </p>
          </div>
        )}

        <div className={cn("chart-sheet rounded-[6px] overflow-hidden", heading && "mt-10")}>
          <div
            aria-hidden
            className="hidden lg:grid grid-cols-[12rem_minmax(0,1fr)_9rem_11rem] gap-6 px-6 py-2.5 border-b-[1.5px] border-ink text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted"
          >
            <span>Plan</span>
            <span>Includes</span>
            <span className="text-right">Fare</span>
            <span />
          </div>

          <ul className="chart-rows">
            {PRICING_PLANS.map((plan) => (
              <li
                key={plan.name}
                className={cn(
                  "relative grid gap-x-6 gap-y-4 px-5 sm:px-6 py-6 lg:grid-cols-[12rem_minmax(0,1fr)_9rem_11rem] lg:items-center",
                  plan.highlighted && "!bg-board/25 outline-2 outline-ink -outline-offset-2"
                )}
              >
                <div>
                  <h3 className="text-xl font-[800] tracking-[-0.015em]">{plan.name}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>
                  {plan.highlighted && (
                    <span className="stamp mt-2 text-[0.625rem] text-ink bg-board">Recommended</span>
                  )}
                </div>

                <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {plan.features.map((feature) => {
                    const negative = feature.toLowerCase().startsWith("no ");
                    return (
                      <li key={feature} className="flex items-start gap-2 text-[0.9375rem] text-ink-secondary">
                        {negative ? (
                          <Minus size={16} className="mt-0.5 shrink-0 text-ink-faint" />
                        ) : (
                          <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
                        )}
                        <span className={cn(negative && "text-ink-muted")}>{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                <p className="lg:text-right">
                  <span className="chart-data text-3xl font-bold">{plan.price === 0 ? "₹0" : `₹${plan.price}`}</span>
                  <span className="block text-xs text-ink-muted">{plan.price === 0 ? "no card needed" : "one-time"}</span>
                </p>

                <Link href={plan.price === 0 ? "/auth/signup" : "/dashboard/billing"} className="lg:justify-self-end w-full lg:w-auto">
                  <Button variant={plan.highlighted ? "primary" : "outline"} size="lg" className="w-full lg:w-40">
                    {plan.cta}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-sm text-ink-muted">Prices in INR. One-time payment through Razorpay. Credits reset on the 1st of each month; an analysis, a CV build and a tailoring each use one.</p>
      </div>
    </section>
  );
}
