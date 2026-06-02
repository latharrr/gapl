"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/mock-data";
import { Quote } from "lucide-react";

export function Testimonials() {
  return (
    <section className="py-24 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3"
          >
            Results
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-ink tracking-tight"
          >
            From rejected to shortlisted.
            <br />
            Real stories.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-white rounded-xl border border-border-DEFAULT p-6 hover:shadow-md transition-shadow duration-200"
            >
              <Quote size={20} className="text-primary-600/30 mb-4" />
              <p className="text-sm text-ink-secondary leading-relaxed mb-6">{t.text}</p>

              <div className="pt-4 border-t border-border-DEFAULT flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: ["#4F46E5", "#16A34A", "#F59E0B"][i] }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.role}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-success bg-success-bg px-2 py-1 rounded-full border border-success-border">
                  {t.result}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
