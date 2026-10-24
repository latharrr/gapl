"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How is Gapl different from an ATS checker?",
    a: "Gapl isn't just an ATS scanner. It simulates how a recruiter at your target company reads your resume — evaluating your projects, tech stack relevance, and career signals — and gives you a specific verdict with reasons.",
  },
  {
    q: "How accurate is the recruiter simulation?",
    a: "Treat it as an evidence-based AI estimate, not a hiring guarantee. Gapl explains the signals behind each verdict so you can decide which improvements are worth acting on.",
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
    a: "Your resume is sent to the configured AI provider for processing. Gapl stores the resulting report for your account, while raw prompt logging is disabled by default. Do not upload information you would not want processed by an AI service.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-surface-DEFAULT text-ink scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <h2 className="display text-[clamp(2.25rem,4.2vw,3.5rem)]">Questions.</h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Something else?{" "}
            <a href="mailto:deepanshulathar@gmail.com" className="font-semibold text-primary-700 underline hover:text-primary-900">
              deepanshulathar@gmail.com
            </a>
          </p>
        </div>

        <div className="lg:col-span-7 lg:col-start-6 border-t border-ink">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-border-DEFAULT">
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group w-full text-left py-5 flex items-start gap-4"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                  >
                    <span className="flex-1 text-[1.0625rem] font-semibold tracking-[-0.01em] group-hover:text-primary-700">
                      {item.q}
                    </span>
                    <Plus
                      size={20}
                      strokeWidth={2.25}
                      className={`mt-0.5 shrink-0 text-ink-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-8 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-secondary">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
