import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* A multi-step flow drawn as a short route: done stops filled, the current stop lit yellow. */
export function StepRoute({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Steps" className="border-b border-border-strong bg-surface-DEFAULT">
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
                  className={cn("absolute left-5 right-0 top-[0.6875rem] h-[3px]", done ? "bg-ink" : "bg-border-DEFAULT")}
                />
              )}
              <span
                className={cn(
                  "relative z-10 h-6 w-6 rounded-full border-[3px] grid place-items-center",
                  done ? "border-ink bg-ink text-white" : active ? "border-ink bg-board" : "border-border-strong bg-surface-DEFAULT"
                )}
              >
                {done && <Check size={12} strokeWidth={3.5} />}
              </span>
              <span
                className={cn(
                  "mt-2 text-xs sm:text-sm pr-2",
                  active ? "font-bold text-ink" : done ? "font-medium text-ink-secondary" : "text-ink-muted"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
