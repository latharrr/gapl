"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { SAMPLE } from "@/lib/sample-report";
import { cn } from "@/lib/utils";

const END = SAMPLE.route[SAMPLE.route.length - 1].readiness;

const STEPS = [
  { title: "The read", line: "Six seconds against one role at one kind of company." },
  { title: "The verdict", line: "Shortlist, Maybe or Reject, with the reason written out." },
  { title: "The fix", line: "Projects a recruiter can open, ranked by what they cost you." },
  { title: "The re-check", line: "Upload the new version and see which gaps closed." },
];

// Mercor's split: a big statement and a stacked list that steps through on its own,
// with each step's picture beside it (Mercury-style accordion).
export function HowSection() {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 2600);
    return () => clearInterval(id);
  }, [held]);

  return (
    <section id="how-it-reads" className="landing scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <h2 data-rise className="max-w-4xl serif-display text-[clamp(2.75rem,5.4vw,4.75rem)]">
          Gapl reads your resume the way a recruiter does.
        </h2>
        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-center">
          <ol className="lg:col-span-5" onMouseLeave={() => setHeld(false)}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-b border-border-DEFAULT">
                <button
                  type="button"
                  onMouseEnter={() => { setHeld(true); setActive(i); }}
                  onFocus={() => { setHeld(true); setActive(i); }}
                  className="relative w-full py-6 text-left"
                >
                  <span className={cn("flex items-center gap-1.5 text-[1.625rem] tracking-[-0.02em] transition-colors", i === active ? "text-ink" : "text-ink-faint")}>
                    {s.title} <ChevronRight size={18} className="text-ink-faint" />
                  </span>
                  <span className="mt-1 block text-[0.9375rem] text-ink-muted">{s.line}</span>
                  <span
                    aria-hidden
                    key={i === active ? `on-${active}` : "off"}
                    className={cn("absolute -bottom-px left-0 h-px bg-ink origin-left", i === active ? "w-full how-bar" : "w-0")}
                  />
                </button>
              </li>
            ))}
          </ol>

          <div className="lg:col-span-7 relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-[12px] bg-[#c9a477]">
            <Panel on={active === 0}>
              <Image src="/living/img/hero.jpg" alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover object-[72%_50%]" />
              <Chip>
                <p className="field-label">What caught the eye</p>
                <p className="mt-1"><span className="mark-hl">{SAMPLE.strongestSignal.split(" — ")[0]}</span></p>
              </Chip>
            </Panel>
            <Panel on={active === 1}>
              <Image src="/living/img/close.jpg" alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover object-[70%_50%]" />
              <Chip>
                <div className="flex items-center justify-between gap-4">
                  <span className="verdict text-danger border-danger">{SAMPLE.verdict}</span>
                  <span className="text-[0.8125rem] text-ink-muted">{SAMPLE.role} · {SAMPLE.companyTier}</span>
                </div>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-secondary">{SAMPLE.reason.split(". ")[0]}.</p>
              </Chip>
            </Panel>
            <Panel on={active === 2}>
              <Image src="/living/img/mark-bluepen.jpg" alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              <Chip>
                <p className="field-label text-primary-700">Build instead</p>
                {SAMPLE.route.slice(0, 2).map((r) => (
                  <p key={r.build} className="mt-2 flex items-baseline justify-between gap-4 text-[0.9375rem]">
                    <span className="font-semibold text-primary-700">{r.build}</span>
                    <span className="shrink-0 text-ink-muted">{r.when}</span>
                  </p>
                ))}
              </Chip>
            </Panel>
            <Panel on={active === 3}>
              <Image src="/living/img/mark-highlighter.jpg" alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              <Chip>
                <p className="text-[0.8125rem] text-ink-muted">Readiness after three builds, sample</p>
                <p className="serif-display mt-1 text-[3rem]">
                  <span className="text-ink-faint">{SAMPLE.readiness}</span> <span className="text-ink-faint">→</span> <span className="text-primary-700">{END}</span>
                </p>
              </Chip>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-auto sm:bottom-6 sm:w-[24rem] rounded-[12px] bg-white p-5 shadow-[0_24px_60px_-30px_rgb(40_22_6/0.6)]">
      {children}
    </div>
  );
}

function Panel({ on, className, children }: { on: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)]",
        on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  );
}
