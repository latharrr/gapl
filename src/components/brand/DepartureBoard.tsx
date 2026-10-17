import { cn } from "@/lib/utils";

/* Long-running work as a departure board: each stage is a row that goes WAIT → NOW → DONE. */
export function DepartureBoard({
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
    <div className="min-h-screen led-ground text-surface-muted flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        {kicker && <p className="chart-data text-xs text-surface-muted/60">{kicker}</p>}
        <h1 className="display mt-2 text-[clamp(1.9rem,5vw,2.6rem)]">{title}</h1>
        {detail && (
          <p className="mt-2 text-surface-muted/70" aria-live="polite">
            {detail}
          </p>
        )}

        <div className="mt-8 rounded-[6px] border border-led-dim bg-black/40 font-[family-name:var(--font-led)] font-black text-led">
          <div className="flex justify-between px-4 py-2 border-b border-led-dim text-sm tracking-[0.06em]">
            <span>STAGE</span>
            <span>STATUS</span>
          </div>
          <ol>
            {stages.map((label, i) => {
              const done = i < current;
              const now = i === current;
              return (
                <li
                  key={label}
                  className={cn(
                    "flex items-center justify-between gap-4 px-4 py-3 text-[1.05rem] tracking-[0.04em] border-b border-led-dim/50 last:border-0",
                    !done && !now && "opacity-35"
                  )}
                >
                  <span className="truncate">{label.toUpperCase()}</span>
                  <span className={cn("shrink-0", now && "animate-led-blink")}>{done ? "DONE" : now ? "NOW" : "WAIT"}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="sr-only" aria-live="polite">
          Current stage: {stages[Math.min(current, stages.length - 1)]}
        </p>
        {footnote && <p className="mt-4 text-sm text-surface-muted/60">{footnote}</p>}
      </div>
    </div>
  );
}
