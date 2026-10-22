import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* A multi-step flow as a short ruled line: done steps ticked, the current one highlighted. */
export function StepRoute({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Steps" className="border-b border-border-DEFAULT bg-surface-DEFAULT">
      <ol
        className="max-w-3xl mx-auto px-4 sm:px-6 py-4 grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="relative flex flex-col items-start" aria-current={active ? "step" : undefined}>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn("absolute left-6 right-1 top-[0.6875rem] h-[2px] rounded-full", done ? "bg-ink" : "bg-border-DEFAULT")}
                />
              )}
              <span
                className={cn(
                  "relative z-10 h-6 w-6 rounded-full border-2 grid place-items-center text-[0.6875rem] font-bold tabular",
                  done ? "border-ink bg-ink text-highlight" : active ? "border-ink bg-highlight text-ink" : "border-border-strong bg-surface-DEFAULT text-ink-faint"
                )}
              >
                {done ? <Check size={12} strokeWidth={3.5} /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-xs sm:text-sm pr-2",
                  active ? "font-semibold text-ink" : done ? "font-medium text-ink-secondary" : "text-ink-muted"
                )}
              >
                <span className={cn(active && "mark-hl")}>{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
