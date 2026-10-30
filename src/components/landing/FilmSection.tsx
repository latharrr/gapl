"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SAMPLE } from "@/lib/sample-report";
import { isLite } from "@/lib/lite";

const FRAMES = 172; // of 241 rendered: the film stops before the paper is close enough to show its (generated) text
// frames: 1280x720 for wide screens; frames-m: a 540x960 portrait crop on the paper for phones
const frameSrc = (i: number, dir = "frames") => `/living/${dir}/f_${String(i + 1).padStart(4, "0")}.jpg`;

// Mercor's full-bleed film with figures left and a list right. One overhead push-in, scrubbed by scroll.
export function FilmSection() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: true };
        gsap.fromTo("[data-film-frame]", { clipPath: "inset(4% 4% 4% 4% round 12px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { ...st, end: "15% top" } });
        gsap.to("[data-film-intro]", { opacity: 0, y: -20, ease: "none", scrollTrigger: { ...st, start: "30% bottom", end: "50% bottom" } });
        gsap.fromTo("[data-film-copy]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { ...st, start: "55% bottom", end: "80% bottom" } });
      });

      let api: ScrubApi | undefined;
      let step: (() => void) | undefined;
      import("@/lib/scrub-engine.js").then(() => {
        const ME = window.MotionEngine;
        if (!ME || !canvasRef.current || !ref.current || !FRAMES) return;
        const narrow = window.matchMedia("(max-width: 768px)").matches, lite = isLite();
        api = ME.Scrub({
          canvas: canvasRef.current, driver: ref.current, count: FRAMES,
          src: (i) => frameSrc(i, narrow ? "frames-m" : "frames"),
          fps: 24, blend: true, lerp: 0.2, cover: true, prefetch: true, dpr: 1,
          // decoded frames are the memory cost (w*h*4 each): ~16 on lite devices (~33 MB), ~22 elsewhere (~80 MB)
          aheadSec: lite ? 0.4 : 0.6, behindSec: lite ? 0.2 : 0.3,
        });
        (window as Window & { filmScrub?: ScrubApi }).filmScrub = api; // console check: filmScrub.stats()
        step = () => ME.step();
        gsap.ticker.add(step);
      });
      return () => {
        if (step) gsap.ticker.remove(step);
        api?.dispose();
        mm.revert();
      };
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="landing relative h-[240vh]">
      <div data-film-frame className="sticky top-0 h-[100svh] overflow-hidden bg-[#c9a477]">
        {/* The first frame paints instantly; the canvas takes over once frames arrive. */}
        <picture>
          <source media="(max-width: 768px)" srcSet={frameSrc(0, "frames-m")} />
          <img src={frameSrc(0)} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="A slow push-in from a sunlit study table onto one highlighted line of a printed resume" role="img" />
        <div data-film-copy className="absolute inset-0 bg-gradient-to-t from-[#1c1208]/90 via-[#1c1208]/55 via-45% to-transparent to-75%" aria-hidden />
        <div data-film-intro className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#1c1208]/80 via-[#1c1208]/40 to-transparent" aria-hidden />
        <p data-film-intro className="absolute left-4 sm:left-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] top-24 max-w-md serif-display text-[clamp(2rem,3.6vw,3.25rem)] text-white [text-shadow:0_2px_24px_rgb(28_18_8/0.55)]">
          A recruiter picks up your resume.
        </p>
        <div data-film-copy className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-16 text-white">
          <div className="grid w-full gap-8 md:grid-cols-2 md:items-end">
            <div className="max-w-md">
              <p className="serif-display text-[clamp(4.5rem,9vw,8rem)] leading-[0.85]">6 s</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/90">
                The average first look a recruiter gives a resume before deciding.
              </p>
              <p className="mt-2 text-[0.8125rem] text-white/65">TheLadders eye-tracking study, 2012</p>
            </div>
            <div className="md:justify-self-end w-full max-w-md rounded-[12px] bg-[#1c1208]/55 border border-white/15 p-5 sm:p-6">
              <div className="flex items-center justify-between text-[0.8125rem]">
                <span className="font-semibold">A sample read, not a real candidate</span>
                <span className="text-white/60">Illustrative</span>
              </div>
              <ul className="mt-4 space-y-3.5">
                {SAMPLE.breakdown.map((b) => (
                  <li key={b.key}>
                    <div className="flex items-baseline justify-between text-[0.875rem]">
                      <span>{b.label}</span>
                      <span className="font-semibold">{b.score}</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-white/15">
                      <div className={`h-full rounded-full ${b.score < 50 ? "bg-danger-on-desk" : "bg-highlight"}`} style={{ width: `${b.score}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
