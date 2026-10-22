import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "desk";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

/*
  primary   — highlighter yellow: the one action per view
  secondary — ink: a firm second action on paper
  outline   — paper with a ruled edge
  ghost     — text only
  danger    — red pen, destructive acts only
  desk      — outlined in light ink, for second actions on the charcoal desk
*/
export const buttonVariants = {
  primary:
    "bg-highlight text-ink hover:bg-highlight-deep shadow-[0_1px_0_0_rgb(22_23_27/0.18),inset_0_-1px_0_0_rgb(22_23_27/0.12)] disabled:bg-surface-subtle disabled:text-ink-faint disabled:shadow-none disabled:opacity-100",
  secondary: "bg-ink text-white hover:bg-ink-secondary",
  outline: "bg-surface-DEFAULT text-ink border border-border-strong hover:border-ink",
  ghost: "text-ink-secondary hover:bg-surface-subtle hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-deep",
  desk: "text-desk-ink border border-desk-line hover:border-desk-muted hover:bg-desk-raised",
};

export const buttonSizes = {
  sm: "h-9 px-3.5 text-[0.8125rem] rounded-[7px]",
  md: "h-10 px-4 text-sm rounded-[8px]",
  lg: "h-12 px-5 text-[0.9375rem] rounded-[9px]",
  icon: "h-10 w-10 rounded-[8px]",
};

export const buttonBase =
  "inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.005em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:opacity-45 disabled:pointer-events-none select-none";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
        {...props}
      >
        {loading && (
          <span aria-hidden className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
