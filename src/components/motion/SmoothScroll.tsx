"use client";

import { useEffect, useRef, useState } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, useGSAP);

// Lenis scroll events drive ScrollTrigger. Lives inside ReactLenis so it subscribes once the instance exists.
function ScrollTriggerSync() {
  useLenis(() => ScrollTrigger.update());
  return null;
}

// One RAF for the landing: GSAP's ticker drives Lenis and every ScrollTrigger.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  // Options never reach the DOM, so reading the media query on first render cannot cause a hydration mismatch.
  const [reduce] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    // Look the instance up every frame: ReactLenis creates it after this effect first runs.
    const update = (t: number) => lenisRef.current?.lenis?.raf(t * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    // Fonts and images change heights after first paint.
    document.fonts?.ready.then(() => {
      ScrollTrigger.refresh();
      window.__ready = true; // dev contract for headless screenshots
    });
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    return () => gsap.ticker.remove(update);
  }, []);

  // Soft arrival for every [data-rise]: up 18px into place, once, expo-out.
  useGSAP(() => {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.batch("[data-rise]", {
        start: "top 85%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.08 }),
      });
    });
  });

  return (
    <ReactLenis root options={{ autoRaf: false, anchors: true, lerp: 0.12, smoothWheel: !reduce }} ref={lenisRef}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
