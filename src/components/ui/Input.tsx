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
            className="block text-sm font-medium text-ink-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-9 px-3 text-sm bg-white border border-border-DEFAULT rounded-lg text-ink placeholder:text-ink-faint",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600",
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
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
