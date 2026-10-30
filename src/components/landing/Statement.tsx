"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const TEXT = "A recruiter gives your resume six seconds. Most students never find out what happened in them.";
const WORDS = TEXT.split(" ");
const HI = new Set([3, 4, 5, 6]); // "your resume six seconds."

// Gem's giant serif statement, lit word by word as you scroll through it.
export function Statement() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.14 },
          { opacity: 1, ease: "none", stagger: 1, scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.4 } }
        );
      });
    },
    { scope: ref }
  );
  return (
    <section ref={ref} className="landing relative h-[170vh]">
      <div className="sticky top-0 h-[100svh] flex items-center">
        <p className="max-w-6xl mx-auto px-4 sm:px-6 serif-display text-[clamp(2.5rem,6.6vw,6.25rem)] leading-[1]">
          {WORDS.map((w, i) => (
            <span key={i} data-word className={HI.has(i) ? "text-ink" : "text-ink-secondary"}>
              {HI.has(i) ? <span className="mark-hl">{w}</span> : w}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
