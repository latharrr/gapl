"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:translate-y-px disabled:opacity-45 disabled:pointer-events-none select-none";

    // primary = station-board yellow (the action); secondary = rail navy (structure)
    const variants = {
      primary:
        "bg-board text-board-ink border-2 border-board-ink hover:bg-board-deep hover:shadow-md shadow-sm",
      secondary:
        "bg-primary-600 text-primary-foreground border-2 border-primary-600 hover:bg-primary-700 hover:border-primary-700",
      outline:
        "border-[1.5px] border-border-strong bg-surface-DEFAULT text-ink hover:border-ink hover:bg-surface-DEFAULT",
      ghost:
        "text-ink-secondary hover:bg-surface-subtle hover:text-ink",
      danger:
        "bg-danger text-white border-2 border-danger hover:bg-danger-deep hover:border-danger-deep",
    };

    const sizes = {
      sm: "h-8 px-3 text-[0.8125rem] rounded-[4px]",
      md: "h-10 px-4 text-sm rounded-[5px]",
      lg: "h-12 px-6 text-[0.9375rem] rounded-[6px]",
      icon: "h-10 w-10 rounded-[5px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
