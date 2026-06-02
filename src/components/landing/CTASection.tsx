"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-[#111111]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-bold text-white tracking-tight text-balance"
        >
          Stop guessing why you&apos;re
          <br />
          not getting called back.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mt-5 text-lg text-zinc-400"
        >
          Get your readiness score in minutes. Free to start.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/analyze">
            <Button
              size="lg"
              className="bg-white text-[#111111] hover:bg-zinc-100 gap-2 group"
            >
              Analyze My Resume
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button
              size="lg"
              variant="ghost"
              className="text-zinc-400 hover:text-white hover:bg-white/10"
            >
              View Sample Report
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-xs text-zinc-600"
        >
          No credit card required · Free tier available · Scores are explained
        </motion.p>
      </div>
    </section>
  );
}
