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
    outline: "bg-transparent text-ink-secondary border border-border-DEFAULT",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

interface VerdictBadgeProps {
  verdict: "Shortlist" | "Maybe" | "Reject";
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const config = {
    Shortlist: { variant: "success" as const, dot: "bg-success" },
    Maybe: { variant: "warning" as const, dot: "bg-warning" },
    Reject: { variant: "danger" as const, dot: "bg-danger" },
  };

  const { variant, dot } = config[verdict];

  return (
    <Badge variant={variant} size="md">
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {verdict}
    </Badge>
  );
}
