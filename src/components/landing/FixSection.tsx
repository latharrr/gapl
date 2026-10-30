"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { SAMPLE } from "@/lib/sample-report";
import { usePlayOnView } from "@/hooks/usePlayOnView";

const START = SAMPLE.readiness;
const END = SAMPLE.route[SAMPLE.route.length - 1].readiness;

// The fix, written back in blue: the coursework line is struck, the builds that replace it
// arrive one by one, and readiness counts up to where the sample route lands.
export function FixSection() {
  const { ref, state } = usePlayOnView<HTMLDivElement>();
  const [shown, setShown] = useState<number>(END);

  useEffect(() => {
    if (state === "armed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(START);
      return;
    }
    if (state !== "play") return;
    const n = { v: START };
    const tween = gsap.to(n, { v: END, duration: 1.6, delay: 1.3, ease: "power4.out", onUpdate: () => setShown(Math.round(n.v)) });
    return () => {
      tween.kill();
    };
  }, [state]);

  return (
    <section className="landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <h2 data-rise className="serif-display text-[clamp(2.5rem,4.6vw,4rem)]">Then it writes the fix back.</h2>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-ink-muted">
            Every gap ends in something to build: a project a recruiter can open, how long it takes, and roughly where
            your readiness lands after it. Not a course. Not keyword stuffing.
          </p>
          <div className="mt-10" aria-live="off">
            <p className="text-sm text-ink-muted">Sample readiness after three builds</p>
            <p className="figure mt-1 text-[clamp(4rem,9vw,6rem)] font-semibold leading-none">
              <span className="text-ink-faint">{START}</span>
              <span className="mx-3 text-ink-faint">→</span>
              <span className="text-primary-700">{shown}</span>
            </p>
            <p className="mt-2 text-xs text-ink-faint">Illustrative. Your report gives your own numbers, and a re-check confirms them.</p>
          </div>
        </div>

        <div ref={ref} data-play={state} className="fix lg:col-span-7">
          <div className="rounded-[12px] bg-white border border-border-DEFAULT [container-type:inline-size] px-[6cqw] py-[6cqw]">
            <h3 className="resume-text text-[max(15px,3.2cqw)] [font-variant:small-caps] tracking-[0.02em] border-b border-ink pb-1">
              Projects
            </h3>

            <div className="mt-4 resume-text text-[max(14px,2.6cqw)] leading-snug">
              <p className="flex justify-between gap-4">
                <span className="fix-strike font-bold">
                  Expense Tracker <span className="font-normal">| React, Firebase</span>
                </span>
                <span className="fix-strike whitespace-nowrap">Mar 2025</span>
              </p>
              <ul className="mt-1 list-disc pl-6">
                <li><span className="fix-strike">CRUD app to add, edit and categorise expenses</span></li>
                <li><span className="fix-strike">Coursework project; runs locally</span></li>
              </ul>
            </div>
            <p className="fix-in mt-3 text-sm font-semibold text-danger" style={{ "--d": "0.7s" } as React.CSSProperties}>
              Coursework with no link. A recruiter can&apos;t check it, so it doesn&apos;t count.
            </p>

            <div className="mt-8 border-t border-dashed border-border-strong pt-6">
              <p className="fix-in field-label text-primary-700" style={{ "--d": "1s" } as React.CSSProperties}>
                Build instead
              </p>
              <ol className="mt-3 divide-y divide-border-DEFAULT">
                {SAMPLE.route.map((stop, i) => (
                  <li
                    key={stop.build}
                    className="fix-in grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 py-3.5"
                    style={{ "--d": `${1.25 + i * 0.35}s` } as React.CSSProperties}
                  >
                    <span className="tabular col-span-2 sm:col-span-1 text-sm text-ink-muted">{stop.when}</span>
                    <span>
                      <span className="block font-semibold text-primary-700">{stop.build}</span>
                      <span className="block text-sm text-ink-muted">Closes {stop.closes}</span>
                    </span>
                    <span className="figure text-sm font-semibold text-primary-700">→ {stop.readiness}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
