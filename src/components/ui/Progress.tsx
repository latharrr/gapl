"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: "xs" | "sm" | "md";
  color?: "primary" | "success" | "warning" | "danger";
  animated?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  size = "sm",
  color = "primary",
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    xs: "h-1",
    sm: "h-1.5",
    md: "h-2.5",
  };

  const colors = {
    primary: "bg-primary-600",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div
      className={cn("w-full bg-border-DEFAULT rounded-full overflow-hidden", sizes[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full",
          colors[color],
          animated && "transition-all duration-700 ease-out",
          barClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
