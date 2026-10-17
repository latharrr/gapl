import { cn } from "@/lib/utils";

/* Full-width radio rows on a chart sheet: label plus optional hint. */
export function OptionList({
  name,
  value,
  onChange,
  options,
  className,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={cn("chart-sheet rounded-[6px] overflow-hidden divide-y divide-border-DEFAULT", className)}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn("w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors", selected ? "bg-board/30" : "hover:bg-surface-muted")}
          >
            <span className={cn("h-5 w-5 shrink-0 rounded-full border-[2px] grid place-items-center", selected ? "border-ink bg-ink" : "border-border-strong")}>
              {selected && <span className="h-2 w-2 rounded-full bg-board" />}
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{o.label}</span>
              {o.hint && <span className="block text-sm text-ink-muted">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* Compact single-choice chips for short option sets. */
export function ChipGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 px-3.5 rounded-[5px] border-[1.5px] text-sm font-semibold transition-colors",
              selected ? "bg-ink border-ink text-board" : "bg-surface-DEFAULT border-border-strong text-ink hover:border-ink"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Field label used above raw inputs, choice groups and textareas. */
export function FieldLabel({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block mb-2 text-[0.8125rem] font-bold text-ink-secondary">
      {children}
      {optional && <span className="ml-1.5 font-normal text-ink-muted">(optional)</span>}
    </label>
  );
}

export const fieldClass =
  "w-full px-3 rounded-[5px] border-[1.5px] border-border-strong bg-surface-DEFAULT text-[0.9375rem] text-ink hover:border-ink-muted focus:outline-none focus:ring-[3px] focus:ring-primary-600/15 focus:border-primary-600";
