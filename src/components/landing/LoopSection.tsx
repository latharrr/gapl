"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const INK = "#16171b";
const EDGE = "#e1e1db";

// Level 3, drawn in code: the resume rides into a six-second read, the red pen circles the line that sank it,
// the blue pen sends the fix back, the line is rewritten, readiness climbs, and the next read says Shortlist.
// The markup is the finished still (reduced motion, no JS); GSAP rewinds it and plays the story on a loop.
export function LoopSection() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(ref);
        const ride = (path: string, d = 0.8) =>
          gsap.timeline()
            .set("#pk", { opacity: 1 })
            .to("#pk", { duration: d, ease: "power2.inOut", motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } })
            .set("#pk", { opacity: 0 });
        const pulse = (el: string) => gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 50%" });
        const score = { v: 78 };
        const setScore = () => q("#score").forEach((n) => (n.textContent = String(Math.round(score.v))));

        // the start of every round: the bad line back, no marks, Reject waiting
        const reset = () =>
          gsap.timeline()
            .set(["#circle", "#fixlines path", "#tick", "#newline"], { drawSVG: "0%" })
            .set("#oldline", { opacity: 1 })
            .set(["#v-short", "#v-reject"], { opacity: 0 })
            .set("#v-wait", { opacity: 1 })
            .set("#arc", { drawSVG: "0%" })
            .add(() => { score.v = 65; setScore(); });

        const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.4 })
          .add(reset())
          .add(ride("#w1"))
          .add(pulse("#read"))
          .to("#arc", { drawSVG: "100%", duration: 1.4, ease: "none" }, "<")
          .add(ride("#w2"), ">-0.1")
          .add(pulse("#verdict"))
          .to("#v-reject", { opacity: 1, duration: 0.35 }, "<")
          .to("#v-wait", { opacity: 0, duration: 0.2 }, "<")
          .to("#circle", { drawSVG: "100%", duration: 0.7, ease: "power2.inOut" }, "<0.2")
          .add(ride("#w3"), ">0.2")
          .add(pulse("#fix"))
          .to("#fixlines path", { drawSVG: "100%", duration: 0.5, stagger: 0.18, ease: "power2.out" }, "<")
          .to("#tick", { drawSVG: "100%", duration: 0.4, ease: "back.out(2)" }, ">-0.1")
          .add(ride("#w4", 1.1), ">0.1")
          .add(pulse("#resume"))
          .to("#oldline", { opacity: 0, duration: 0.3 }, "<")
          .to("#circle", { opacity: 0, duration: 0.3 }, "<")
          .to("#newline", { drawSVG: "100%", duration: 0.6, ease: "power2.out" }, "<0.1")
          .to(score, { v: 78, duration: 1, ease: "power3.out", onUpdate: setScore }, "<")
          .set("#arc", { drawSVG: "0%" })
          .add(ride("#w1"), ">0.2")
          .to("#arc", { drawSVG: "100%", duration: 1.4, ease: "none" })
          .to("#v-reject", { opacity: 0, duration: 0.2 }, ">-0.2")
          .add(ride("#w2"), "<")
          .add(pulse("#verdict"))
          .to("#v-short", { opacity: 1, duration: 0.35 }, "<")
          .to({}, { duration: 2 })
          .set("#circle", { opacity: 1 });

        // build in once at about 30% visible, then loop; pause whenever it leaves the screen
        gsap.timeline({ scrollTrigger: { trigger: "#loop-art", start: "top 70%", toggleActions: "play pause resume pause" } })
          .from(["#resume", "#read", "#verdict", "#fix"], { y: 18, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 })
          .from(".wire", { drawSVG: "0%", duration: 0.8, ease: "power2.inOut", stagger: 0.1 }, "<0.2")
          .add(loop);
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="landing bg-surface-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <h2 data-rise className="serif-display text-[clamp(2.5rem,4.6vw,4rem)]">Fix it. Then check again.</h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">
            Every re-check reads the new version and shows which gaps closed.
          </p>
        </div>
        <div className="lg:col-span-8"><div className="rounded-[12px] border border-border-DEFAULT bg-white bg-[radial-gradient(#e2e2e8_1.2px,transparent_1.2px)] [background-size:38px_38px]">
          <svg id="loop-art" viewBox="0 0 720 430" className="loop-art w-full h-auto font-sans" role="img"
            aria-label="A resume goes through a six-second read, gets a red circle on its weakest line and a Reject, receives a fix in blue, is rewritten, and the next read says Shortlist with readiness up from 65 to 78.">
            <g fill="none" stroke={EDGE} strokeWidth="2" strokeLinecap="round">
              <path id="w1" className="wire" d="M192 215 L276 215" />
              <path id="w2" className="wire" d="M372 185 C420 150 450 124 498 124" />
              <path id="w3" className="wire" d="M372 245 C420 290 450 312 498 312" />
              <path id="w4" className="wire" d="M590 368 C590 412 116 412 116 334" />
            </g>

            <g id="resume">
              <rect x="40" y="96" width="152" height="236" rx="10" fill="#fff" stroke={EDGE} strokeWidth="1.5" />
              <text x="58" y="126" fontSize="13" fontWeight="600" fill={INK}>Resume</text>
              <g stroke="#d6d6cf" strokeWidth="5" strokeLinecap="round">
                <path d="M58 150 H170" /><path d="M58 166 H150" />
                <path d="M58 194 H166" /><path d="M58 210 H138" />
                <path d="M58 264 H160" /><path d="M58 280 H128" />
              </g>
              <path d="M58 150 H170" stroke="#ffe14d" strokeWidth="9" strokeLinecap="round" opacity="0.85" />
              <path id="oldline" d="M58 238 H164" stroke="#d6d6cf" strokeWidth="5" strokeLinecap="round" opacity="0" />
              <ellipse id="circle" cx="111" cy="238" rx="64" ry="13" fill="none" stroke="#c8302a" strokeWidth="2.5" strokeLinecap="round" />
              <path id="newline" d="M58 238 H164" stroke="#2856d4" strokeWidth="5" strokeLinecap="round" />
              <text x="58" y="314" fontSize="11" fill="#5e616a">Readiness</text>
              <text id="score" x="174" y="315" fontSize="20" fontWeight="650" textAnchor="end" fill={INK}>78</text>
            </g>

            <g id="read">
              <circle cx="324" cy="215" r="52" fill="#fff" stroke={EDGE} strokeWidth="1.5" />
              <circle cx="324" cy="215" r="40" fill="none" stroke="#efefea" strokeWidth="6" />
              <circle id="arc" cx="324" cy="215" r="40" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" transform="rotate(-90 324 215)" />
              <text x="324" y="222" fontSize="19" fontWeight="650" textAnchor="middle" fill={INK}>6 s</text>
              <text x="324" y="292" fontSize="13" fontWeight="600" textAnchor="middle" fill={INK}>Read</text>
            </g>

            <g id="verdict">
              <rect x="498" y="58" width="182" height="120" rx="10" fill="#fffbea" stroke={EDGE} strokeWidth="1.5" />
              <text x="516" y="84" fontSize="13" fontWeight="600" fill={INK}>Verdict</text>
              <g id="v-wait" opacity="0">
                <rect x="516" y="104" width="122" height="38" rx="4" fill="#f2f2ee" stroke="#c3c3bb" strokeWidth="2" />
                <text x="577" y="129" fontSize="15" fontWeight="750" letterSpacing="1.2" textAnchor="middle" fill="#75787f">READING</text>
              </g>
              <g id="v-reject" opacity="0">
                <rect x="516" y="104" width="114" height="38" rx="4" fill="#fbeae8" stroke="#c8302a" strokeWidth="2.5" />
                <text x="573" y="129" fontSize="15" fontWeight="750" letterSpacing="1.2" textAnchor="middle" fill="#c8302a">REJECT</text>
              </g>
              <g id="v-short">
                <rect x="516" y="104" width="134" height="38" rx="4" fill="#e3f2e9" stroke="#17784a" strokeWidth="2.5" />
                <text x="583" y="129" fontSize="15" fontWeight="750" letterSpacing="1.2" textAnchor="middle" fill="#17784a">SHORTLIST</text>
              </g>
            </g>

            <g id="fix">
              <rect x="498" y="262" width="182" height="106" rx="10" fill="#f5f8fe" stroke={EDGE} strokeWidth="1.5" />
              <text x="516" y="290" fontSize="13" fontWeight="600" fill="#1f44a8">Fix</text>
              <g stroke="#ecece6" strokeWidth="4" strokeLinecap="round">
                <path d="M516 314 H622" /><path d="M516 332 H600" /><path d="M516 350 H578" />
              </g>
              <g id="fixlines" stroke="#2856d4" strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M516 314 H622" /><path d="M516 332 H600" /><path d="M516 350 H578" />
              </g>
              <circle cx="648" cy="332" r="14" fill="#eef2fd" />
              <path id="tick" d="M641 332 L646 337 L655 326" fill="none" stroke="#2856d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            <g id="pk" opacity="0">
              <circle r="11" fill={INK} opacity="0.12" />
              <circle r="5.5" fill={INK} />
            </g>
          </svg>
        </div></div>
      </div>
    </section>
  );
}
