"use client";

import { motion } from "framer-motion";
import { HOW_IT_WORKS_STEPS } from "@/lib/mock-data";
import { Upload, Target, Brain, Map } from "lucide-react";

const icons = [Upload, Target, Brain, Map];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-ink tracking-tight"
          >
            Four steps from confusion
            <br />
            to clarity.
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="relative p-6 rounded-xl border border-border-DEFAULT hover:border-primary-600/30 hover:shadow-sm transition-all duration-200 bg-white h-full">
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border-DEFAULT flex items-center justify-center group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors duration-200">
                      <Icon size={16} className="text-ink-muted group-hover:text-primary-600 transition-colors duration-200" />
                    </div>
                    <span className="text-2xl font-bold text-border-strong">{step.step}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-ink mb-2">{step.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{step.description}</p>

                  {/* Connector line (desktop) */}
                  {i < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-border-DEFAULT z-10" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
