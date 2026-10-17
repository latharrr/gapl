"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LedBoardProps {
  messages: string[];
  interval?: number;
  className?: string;
  /** Leading tag that stays lit while messages roll, like a platform number. */
  tag?: string;
}

// Amber dot-matrix departure board. Messages roll up one at a time.
export function LedBoard({ messages, interval = 4200, className, tag }: LedBoardProps) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), interval);
    return () => clearInterval(id);
  }, [messages.length, interval]);

  return (
    <div className={cn("led-board flex items-center gap-4 overflow-hidden rounded-[4px]", className)}>
      <span className="sr-only">{messages.join(". ")}</span>
      {tag && (
        <span aria-hidden className="shrink-0 border-r border-led-dim pr-4 text-led">
          {tag}
        </span>
      )}
      <span aria-hidden className="relative block min-w-0 flex-1 overflow-hidden whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={i}
            className="block truncate"
            initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {messages[i]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
