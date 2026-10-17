"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useReducedMotion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { SAMPLE } from "@/lib/sample-report";
import { cn } from "@/lib/utils";

type Stop = {
  code: string;
  label: string;
  build: string;
  closes?: string;
  weeks: number;
  readiness: number | null;
  status: string;
  final: boolean;
};

const STOPS: Stop[] = [
  ...SAMPLE.route.map((s) => ({ ...s, final: false })),
  {
    code: "RE",
    label: "Re-check",
    build: "Re-analyze your updated resume",
    weeks: 0,
    readiness: null,
    status: "NEW CHART",
    final: true,
  },
];

function statusTone(status: string) {
  if (status.startsWith("WL")) return "text-danger bg-danger-bg";
  if (status === "RAC") return "text-warning bg-warning-bg";
  if (status === "CNF") return "text-success bg-success-bg";
  return "text-ink bg-surface-DEFAULT";
}

// The roadmap set as a train schedule. Scrolling moves the marker down the route,
// and the departure board on the left reads out the status at the current stop.
export function RouteSection() {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 62%", "end 62%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  // One track value, 0 on server and client alike; after mount it follows the scroll,
  // or sits fully lit when reduced motion is on.
  const track = useMotionValue(0);
  useMotionValueEvent(fill, "change", (v) => {
    if (!reduce) track.set(v);
  });
  useEffect(() => {
    if (reduce) track.set(1);
  }, [reduce, track]);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLLIElement>("[data-stop]");
    if (!items) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.stop));
        });
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = STOPS[active];
  const lastReadiness = [...STOPS.slice(0, active + 1)].reverse().find((s) => s.readiness !== null)?.readiness;
  const totalWeeks = SAMPLE.route.reduce((n, s) => n + s.weeks, 0);

  return (
    <section className="led-ground text-surface-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="display text-[clamp(2rem,4.2vw,3.5rem)] text-surface-muted">
            Your route from waitlist to the next chart.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-surface-muted/70 max-w-md">
            Every gap ends in something to build. The roadmap tells you which project closes which gap, how long it
            takes, and roughly where your readiness lands when you get there.
          </p>

          {/* Departure board readout */}
          <div
            className="mt-8 rounded-[6px] border border-led-dim bg-black/40 p-5 font-[family-name:var(--font-led)] font-black text-led"
            aria-live="polite"
          >
            <div className="flex items-baseline justify-between gap-4 text-sm tracking-[0.06em]">
              <span>NOW AT</span>
              <span>{current.label.toUpperCase()}</span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-[clamp(3rem,7vw,4.75rem)] leading-none tracking-[0.02em]">{current.status}</span>
              <span className="text-right text-sm tracking-[0.06em]">
                READINESS
                <span className="block text-[2rem] leading-none">{lastReadiness ?? "—"}</span>
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm text-surface-muted/60">
            Sample route: {totalWeeks} weeks, {SAMPLE.route.length - 1} builds. Your stops, weeks and readiness come from
            your own report.
          </p>
        </div>

        <ol ref={listRef} className="relative">
          {/* Track */}
          <span aria-hidden className="absolute left-[0.6875rem] top-3 bottom-3 w-[3px] bg-led-dim rounded-full" />
          <motion.span
            aria-hidden
            className="absolute left-[0.6875rem] top-3 bottom-3 w-[3px] origin-top bg-led rounded-full"
            style={{ scaleY: track }}
          />

          {STOPS.map((s, i) => {
            const passed = i <= active;
            return (
              <li key={s.code} data-stop={i} className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-5 pb-12 last:pb-0">
                <span
                  aria-hidden
                  className={cn(
                    "relative z-10 mt-1.5 h-[1.375rem] w-[1.375rem] rounded-full border-[3px] transition-colors duration-300",
                    passed ? "border-led bg-led" : "border-led-dim bg-led-ground"
                  )}
                />
                <div className="min-w-0">
                  <p className="chart-data text-xs text-led">
                    {s.code} · {s.label}
                    {s.weeks > 0 && ` · halt ${s.weeks} ${s.weeks === 1 ? "week" : "weeks"}`}
                  </p>
                  <h3 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-[-0.015em] text-surface-muted">{s.build}</h3>
                  {s.closes && <p className="mt-1 text-[0.9375rem] text-surface-muted/70">Closes the {s.closes} gap</p>}
                  {s.final && (
                    <p className="mt-1 text-[0.9375rem] text-surface-muted/70 max-w-lg">
                      A fresh chart is prepared from your updated resume. Gapl shows what moved and what is still open.
                      No status is promised; the chart is prepared again.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className={cn("stamp text-xs", statusTone(s.status))}>{s.status}</span>
                    {s.readiness !== null && (
                      <span className="chart-data text-sm text-surface-muted/80">Readiness {s.readiness}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
