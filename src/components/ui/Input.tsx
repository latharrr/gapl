"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[0.8125rem] font-semibold text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-11 px-3 text-[0.9375rem] bg-surface-DEFAULT border border-border-strong rounded-[8px] text-ink placeholder:text-ink-faint",
            "transition-all duration-150",
            "hover:border-ink-muted focus:outline-none focus:ring-[3px] focus:ring-primary-600/20 focus:border-primary-600",
            "disabled:opacity-50 disabled:bg-surface-subtle",
            error && "border-danger focus:ring-danger/20 focus:border-danger",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-ink-muted">{hint}</p>
        )}
        {error && (
          <p role="alert" className="text-xs font-medium text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
