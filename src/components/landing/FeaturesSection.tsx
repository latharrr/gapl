"use client";

import { motion } from "framer-motion";
import { FileText, Search, User2, Map, TrendingUp, Download } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "ATS Optimization",
    description:
      "Parse your resume against the exact keyword patterns ATS systems are trained on. Identify format issues, keyword density, and section problems.",
  },
  {
    icon: User2,
    title: "Recruiter Simulation",
    description:
      "6-second first-impression simulation. Our engine reads your resume the way a recruiter does — skimming for signals, not reading every word.",
  },
  {
    icon: Search,
    title: "Career Gap Analysis",
    description:
      "Identify exactly which skills you're missing for your target role and company tier. Prioritized by impact, not alphabetical.",
  },
  {
    icon: Map,
    title: "Roadmap Generation",
    description:
      "Week-by-week project roadmap that closes your specific gaps. Not generic tutorials — projects that produce recruiter-visible signals.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Re-analyze over time. See your readiness score grow. Track which gaps you've closed and which remain critical.",
  },
  {
    icon: Download,
    title: "Actionable Reports",
    description:
      "Print your tailored CV, share a concise report summary, and keep a clear record of the gaps you are working to close.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3"
          >
            Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-ink tracking-tight"
          >
            Everything you need
            <br />
            to get shortlisted.
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-xl border border-border-DEFAULT hover:border-primary-600/20 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border-DEFAULT flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors duration-200">
                  <Icon size={16} className="text-ink-muted group-hover:text-primary-600 transition-colors duration-200" />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-2">{feature.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
