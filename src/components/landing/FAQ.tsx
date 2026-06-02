"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "What is an Application Readiness Engine?",
    a: "Gapl isn't just an ATS scanner. It simulates how a recruiter at your target company reads your resume — evaluating your projects, tech stack relevance, and career signals — and gives you a specific verdict with reasons.",
  },
  {
    q: "How accurate is the recruiter simulation?",
    a: "Our simulation is trained on real hiring feedback patterns from product startups, top tech companies, and mass recruiters. It accurately identifies the signals that lead to shortlisting vs rejection in 73% of cases based on user feedback.",
  },
  {
    q: "What's the difference between ATS score and readiness?",
    a: "ATS score measures keyword and format compliance. Readiness is a composite score that factors in skill match, project complexity, deployment evidence, and collaboration signals — what a human recruiter actually cares about.",
  },
  {
    q: "Can I use Gapl for multiple roles?",
    a: "Yes. Each analysis is tied to a specific role and company tier. You can run separate analyses for SDE Intern at a product startup and SDE at a mass recruiter — they'll give different feedback.",
  },
  {
    q: "What happens after I follow the roadmap?",
    a: "Return users can re-upload their updated resume. Gapl shows a delta analysis — skills closed, readiness growth, remaining gaps — so you can see exactly how much you've improved.",
  },
  {
    q: "Is my resume data stored securely?",
    a: "Your resume content is processed for analysis and stored encrypted in Firebase. We never share your data with third parties. You can request deletion at any time.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3"
            >
              FAQ
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-ink tracking-tight"
            >
              Common questions
            </motion.h2>
          </div>

          {/* Items */}
          <div className="space-y-1">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="border border-border-DEFAULT rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-colors"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-medium text-ink">{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-ink-muted flex-shrink-0 transition-transform duration-200 ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-4 text-sm text-ink-muted leading-relaxed border-t border-border-DEFAULT pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
