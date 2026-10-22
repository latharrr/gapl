import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadingLine } from "@/components/ui/Sheet";

/* Long-running work (analysis, CV build, tailoring): a page on the desk, each stage a line
   that gets highlighted as it is read. Done lines carry a tick, the current line sweeps. */
export function ReadingScreen({
  kicker,
  title,
  detail,
  stages,
  current,
  footnote,
}: {
  kicker?: string;
  title: string;
  detail?: string;
  stages: string[];
  current: number;
  footnote?: string;
}) {
  return (
    <div className="min-h-screen on-desk flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <h1 className="display text-[clamp(2rem,6vw,2.75rem)]">{title}</h1>
        {kicker && <p className="mt-2 text-desk-muted">{kicker}</p>}

        <div className="page mt-8 rounded-[4px] px-5 sm:px-7 py-6">
          <ol className="space-y-1">
            {stages.map((label, i) => {
              const done = i < current;
              const now = i === current;
              return (
                <li key={label} className="flex items-center gap-3 py-2">
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300",
                      done ? "border-ink bg-ink text-highlight" : now ? "border-ink" : "border-border-strong"
                    )}
                  >
                    {done && <Check size={11} strokeWidth={3.5} />}
                    {now && <span className="h-1.5 w-1.5 rounded-full bg-ink animate-blink" />}
                  </span>
                  <span
                    className={cn(
                      "text-[0.9375rem] transition-colors duration-300",
                      done ? "mark-hl font-medium text-ink" : now ? "font-semibold text-ink" : "text-ink-faint"
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          {detail && (
            <div className="mt-5 pt-4 border-t border-border-DEFAULT">
              <ReadingLine className="w-full" />
              <p className="mt-3 text-sm text-ink-muted" aria-live="polite">
                {detail}
              </p>
            </div>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          Current stage: {stages[Math.min(current, stages.length - 1)]}
        </p>
        {footnote && <p className="mt-4 text-sm text-desk-muted">{footnote}</p>}
      </div>
    </div>
  );
}
