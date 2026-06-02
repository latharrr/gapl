"use client";

import { motion } from "framer-motion";
import { PRICING_PLANS } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-ink tracking-tight"
          >
            Straightforward pricing.
            <br />
            No surprises.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm text-ink-muted"
          >
            Start free. Upgrade when you need depth.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative rounded-2xl p-6 flex flex-col",
                plan.highlighted
                  ? "bg-[#111111] text-white border border-[#111111] shadow-lg"
                  : "bg-white border border-border-DEFAULT"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={cn("text-sm font-semibold mb-1", plan.highlighted ? "text-white" : "text-ink")}>
                  {plan.name}
                </h3>
                <p className={cn("text-xs mb-4", plan.highlighted ? "text-zinc-400" : "text-ink-muted")}>
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className={cn("text-3xl font-bold tracking-tight", plan.highlighted ? "text-white" : "text-ink")}>
                    {plan.price === 0 ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className={cn("text-xs mb-1", plan.highlighted ? "text-zinc-400" : "text-ink-muted")}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className={cn("mt-0.5 flex-shrink-0", plan.highlighted ? "text-primary-400" : "text-success")}
                    />
                    <span className={cn("text-xs leading-relaxed", plan.highlighted ? "text-zinc-300" : "text-ink-secondary")}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.price === 0 ? "/auth/signup" : "/pricing"}>
                <Button
                  variant={plan.highlighted ? "secondary" : "outline"}
                  size="md"
                  className={cn("w-full", !plan.highlighted && "border-border-DEFAULT")}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
