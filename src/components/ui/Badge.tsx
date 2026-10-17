"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  const variants = {
    default: "bg-surface-subtle text-ink-secondary border border-border-DEFAULT",
    primary: "bg-primary-50 text-primary-600 border border-primary-100",
    success: "bg-success-bg text-success border border-success-border",
    warning: "bg-warning-bg text-warning border border-warning-border",
    danger: "bg-danger-bg text-danger border border-danger-border",
    outline: "bg-transparent text-ink-secondary border border-border-strong",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-2xs",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] font-semibold",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export type Verdict = "Shortlist" | "Maybe" | "Reject";

// Reservation status: Shortlist = confirmed, Maybe = RAC, Reject = waitlisted.
export const VERDICT_STATUS: Record<Verdict, { code: string; tone: string; fill: string }> = {
  Shortlist: { code: "CNF", tone: "text-success", fill: "bg-success-bg" },
  Maybe: { code: "RAC", tone: "text-warning", fill: "bg-warning-bg" },
  Reject: { code: "WL", tone: "text-danger", fill: "bg-danger-bg" },
};

interface VerdictBadgeProps {
  verdict: Verdict;
  /** Gaps standing between this resume and a shortlist; printed after WL. */
  waitlist?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerdictBadge({ verdict, waitlist, size = "md", className }: VerdictBadgeProps) {
  const { code, tone, fill } = VERDICT_STATUS[verdict] ?? VERDICT_STATUS.Maybe;
  const sizes = {
    sm: "text-[0.6875rem]",
    md: "text-xs",
    lg: "text-base",
  };

  return (
    <span className={cn("stamp", tone, fill, sizes[size], className)}>
      <span>
        {code}
        {verdict === "Reject" && typeof waitlist === "number" && waitlist > 0 ? ` ${waitlist}` : ""}
      </span>
      <span aria-hidden className="opacity-50">/</span>
      <span>{verdict}</span>
    </span>
  );
}
