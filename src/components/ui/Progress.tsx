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
    sm: "h-2",
    md: "h-3",
  };

  const colors = {
    primary: "bg-primary-600",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div
      className={cn("w-full bg-surface-subtle rounded-[2px] overflow-hidden", sizes[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-[2px]",
          colors[color],
          animated && "transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          barClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
