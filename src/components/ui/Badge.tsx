import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  const variants = {
    default: "bg-surface-subtle text-ink-secondary",
    primary: "bg-primary-50 text-primary-700",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    danger: "bg-danger-bg text-danger",
    outline: "bg-transparent text-ink-secondary ring-1 ring-inset ring-border-strong",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-2xs",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[5px] font-semibold",
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

export const VERDICT_TONE: Record<Verdict, { text: string; fill: string; bar: string }> = {
  Shortlist: { text: "text-success", fill: "bg-success-bg", bar: "bg-success" },
  Maybe: { text: "text-warning", fill: "bg-warning-bg", bar: "bg-warning" },
  Reject: { text: "text-danger", fill: "bg-danger-bg", bar: "bg-danger" },
};

interface VerdictBadgeProps {
  verdict: Verdict;
  size?: "sm" | "md" | "lg" | "xl";
  /** Prints "6 sec" after the word, the way the recruiter's mark reads on the sample page. */
  note?: string;
  className?: string;
}

// The verdict is always a written word in a ruled box, coloured by the pen that wrote it.
export function VerdictBadge({ verdict, size = "md", note, className }: VerdictBadgeProps) {
  const tone = VERDICT_TONE[verdict] ?? VERDICT_TONE.Maybe;
  const sizes = {
    sm: "text-[0.6875rem] border-[1.5px]",
    md: "text-xs",
    lg: "text-base",
    xl: "text-[clamp(1.5rem,4vw,2.25rem)] border-[3px] rounded-[6px]",
  };

  return (
    <span className={cn("verdict", tone.text, sizes[size], className)}>
      {verdict}
      {note && (
        <>
          <span aria-hidden className="opacity-40">·</span>
          <span className="font-semibold">{note}</span>
        </>
      )}
    </span>
  );
}

/* A small ruled tag: priorities (Critical, High), "Sample", "Next". */
export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success" | "fix" | "highlight" | "muted";
  className?: string;
}) {
  const tones = {
    neutral: "text-ink-secondary ring-border-strong",
    muted: "text-ink-muted ring-border-DEFAULT",
    danger: "text-danger ring-danger-border bg-danger-bg",
    warning: "text-warning ring-warning-border bg-warning-bg",
    success: "text-success ring-success-border bg-success-bg",
    fix: "text-primary-700 ring-primary-100 bg-primary-50",
    highlight: "text-ink ring-highlight-deep bg-highlight",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] px-1.5 py-[3px] text-[0.6875rem] font-bold uppercase leading-none tracking-[0.06em] ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
