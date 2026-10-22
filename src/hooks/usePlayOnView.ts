"use client";

import { useEffect, useRef, useState } from "react";

/*
  "static" until hydrated (the final state, so nothing is hidden without JS),
  "armed" once mounted below the fold (marks hidden, waiting), "play" when it scrolls in.
  Under reduced motion it stays static.
*/
export function usePlayOnView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"static" | "armed" | "play">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) return;
    // Arming hides the marks before the reader reaches them; the observer then plays them once.
    setState("armed");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("play");
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, state };
}
