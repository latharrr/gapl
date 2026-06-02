"use client";

import { motion } from "framer-motion";
import { VerdictBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight } from "lucide-react";

// Static illustrative data — clearly labeled as example, not real AI output
const DEMO_RESULT = {
  role: "SDE Intern",
  companyTier: "Product Startup",
  atsScore: 68,
  readiness: 65,
  recruiterVerdict: {
    verdict: "Reject" as const,
    confidence: 72,
    reason:
      "Strong academics but missing deployed projects. Resume lacks evidence of real-world impact — no production systems, no GitHub contributions with meaningful stars, no backend depth.",
    strongestSignal: "IIT/NIT academic foundation — recognized tier",
    topGap: "Zero deployed projects visible in resume",
    whatWouldChangeDecision:
      "One end-to-end deployed SaaS or API with documented impact (users, requests, uptime) would flip this to a shortlist.",
  },
  careerGaps: [
    { skill: "Backend Development", priority: "Critical", recommendedProject: "Expense Tracking SaaS", estimatedWeeks: 3 },
    { skill: "Deployment & DevOps", priority: "High", recommendedProject: "Deploy any project on Railway/Render", estimatedWeeks: 1 },
    { skill: "System Design", priority: "High", recommendedProject: "Design a URL Shortener", estimatedWeeks: 1 },
  ],
};

export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-14 bg-[#FAFAFA]">
        {/* Banner */}
        <div className="bg-[#111111] text-center py-3 px-4">
          <p className="text-xs text-[#71717a]">
            This is a sample report illustrating what Gapl outputs.{" "}
            <Link href="/analyze" className="text-white underline underline-offset-2 hover:text-zinc-300">
              Analyze your own resume →
            </Link>
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[#71717a] mb-1">{DEMO_RESULT.role} · {DEMO_RESULT.companyTier} · Sample</p>
              <h1 className="text-2xl font-bold text-[#111111]">Sample Analysis Report</h1>
            </div>
            <Link href="/analyze">
              <Button size="sm" className="gap-1.5">
                Analyze Mine <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Shareable card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] rounded-2xl p-8"
          >
            <p className="text-xs text-[#52525b] uppercase tracking-widest font-medium mb-6">Report Card</p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Role</p>
                <p className="text-xl font-bold text-white mb-4">{DEMO_RESULT.role}</p>
                <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Target</p>
                <p className="text-sm font-medium text-[#a1a1aa] mb-4">{DEMO_RESULT.companyTier}</p>
                <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1.5">Verdict</p>
                <VerdictBadge verdict={DEMO_RESULT.recruiterVerdict.verdict} />
              </div>
              <div className="space-y-4">
                {[
                  { label: "Readiness", value: DEMO_RESULT.readiness, color: "#4F46E5" },
                  { label: "ATS Score", value: DEMO_RESULT.atsScore, color: "#f59e0b" },
                  { label: "Confidence", value: DEMO_RESULT.recruiterVerdict.confidence, color: "#dc2626" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-[#71717a]">{label}</span>
                      <span className="text-xs font-semibold text-white">{value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Top Gap</p>
              <p className="text-sm font-semibold text-white mb-3">{DEMO_RESULT.recruiterVerdict.topGap}</p>
              <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Build Next</p>
              <p className="text-sm font-semibold text-white">{DEMO_RESULT.careerGaps[0].recommendedProject}</p>
            </div>
          </motion.div>

          {/* Rejection reason */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 bg-[#fef2f2] rounded-xl border border-[#fecaca]"
          >
            <p className="text-xs font-semibold text-[#dc2626] uppercase tracking-wider mb-2">Why this resume was rejected</p>
            <p className="text-sm text-[#3f3f46] leading-relaxed">{DEMO_RESULT.recruiterVerdict.reason}</p>
          </motion.div>

          {/* Fix */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0]"
          >
            <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-wider mb-2">What would flip this to Shortlist</p>
            <p className="text-sm text-[#3f3f46] leading-relaxed">{DEMO_RESULT.recruiterVerdict.whatWouldChangeDecision}</p>
          </motion.div>

          {/* Gaps */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-base font-semibold text-[#111111] mb-4">Top Gaps Identified</h2>
            <div className="space-y-3">
              {DEMO_RESULT.careerGaps.map((gap) => (
                <div key={gap.skill} className="p-4 bg-white rounded-xl border border-[#e4e4e7]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#111111]">{gap.skill}</p>
                      <Badge variant={gap.priority === "Critical" ? "danger" : "warning"}>{gap.priority}</Badge>
                    </div>
                    <span className="text-xs text-[#71717a]">{gap.estimatedWeeks}w to fix</span>
                  </div>
                  <p className="text-xs text-[#71717a]">Build: <span className="text-[#111111]">{gap.recommendedProject}</span></p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-center py-10"
          >
            <h2 className="text-xl font-bold text-[#111111] mb-2">See your own report</h2>
            <p className="text-sm text-[#71717a] mb-6">
              GPT-OSS-120B analyzes your actual resume — results will be specific to your profile.
            </p>
            <Link href="/analyze">
              <Button size="lg" variant="primary" className="gap-2">
                Analyze My Resume <ArrowRight size={16} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
