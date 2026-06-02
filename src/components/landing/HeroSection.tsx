"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#FAFAFA] overflow-hidden pt-14">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(17,17,17,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(17,17,17,1) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Soft ambient blobs */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-[#4F46E5]/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#4F46E5]/[0.03] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: text content */}
          <div>
            {/* Announcement badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e4e4e7] bg-white shadow-sm mb-8"
            >
              <Sparkles size={12} className="text-[#4F46E5]" />
              <span className="text-xs text-[#3f3f46] font-medium">
                Recruiter simulation powered by real hiring patterns
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-[4rem] xl:text-[4.5rem] font-bold text-[#111111] tracking-tight leading-[1.1]"
            >
              Know Why You&apos;re Not
              <br />
              <span className="text-[#71717a]">Getting Shortlisted.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-6 text-lg text-[#71717a] max-w-xl leading-relaxed"
            >
              Gapl analyzes your resume, simulates recruiter review, identifies skill gaps,
              and tells you exactly what to build next.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-start gap-3"
            >
              <Link href="/analyze">
                <Button size="lg" variant="primary" className="group gap-2">
                  Analyze My Resume
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="text-[#71717a]">
                  View Sample Report
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {["#4F46E5", "#16A34A", "#F59E0B", "#DC2626"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {["A", "P", "K", "R"][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-[#111111]">2,400+ students analyzed</p>
                <p className="text-xs text-[#71717a]">68% got shortlisted within 30 days</p>
              </div>
            </motion.div>
          </div>

          {/* Right: result card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex justify-center lg:justify-end"
          >
            <HeroCard />
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[#e4e4e7] p-6 space-y-5 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#71717a] font-medium">SDE Intern · Product Startup</p>
          <h3 className="text-sm font-semibold text-[#111111] mt-0.5">Analysis Report</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#fef2f2] text-[#dc2626] text-xs font-semibold border border-[#fecaca]">
          Reject
        </span>
      </div>

      {/* Score row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ATS Score", value: "68", suffix: "%" },
          { label: "Readiness", value: "65", suffix: "%" },
          { label: "Confidence", value: "72", suffix: "%" },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="text-center p-3 bg-[#f4f4f5] rounded-xl">
            <p className="text-xl font-bold text-[#111111]">
              {value}<span className="text-xs font-normal text-[#71717a]">{suffix}</span>
            </p>
            <p className="text-[0.625rem] text-[#71717a] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="p-3 bg-[#fef2f2] rounded-xl border border-[#fecaca]">
        <p className="text-xs font-medium text-[#dc2626] mb-1">Why you were rejected</p>
        <p className="text-xs text-[#3f3f46] leading-relaxed">
          Zero deployed projects. Recruiters need evidence of real-world impact, not just coursework.
        </p>
      </div>

      {/* Top gaps */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#111111]">Critical gaps to close</p>
        {[
          { skill: "Backend APIs", pct: "20%" },
          { skill: "Deployment Evidence", pct: "10%" },
          { skill: "System Design", pct: "15%" },
        ].map(({ skill, pct }) => (
          <div key={skill} className="flex items-center justify-between">
            <span className="text-xs text-[#3f3f46]">{skill}</span>
            <div className="w-24 h-1.5 bg-[#e4e4e7] rounded-full overflow-hidden">
              <div className="h-full bg-[#dc2626] rounded-full" style={{ width: pct }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recommended project */}
      <div className="pt-3 border-t border-[#e4e4e7]">
        <p className="text-[0.625rem] text-[#a1a1aa] uppercase tracking-wider font-medium mb-1.5">Build Next</p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#eef2ff] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-[#4F46E5] text-xs">↗</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#111111]">Expense Tracking SaaS</p>
            <p className="text-[0.625rem] text-[#71717a]">3 weeks · Readiness: 65% → 78%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
