import { cn } from "@/lib/utils";

/* A ruled sheet of chart paper: the house container for any grouped content. */
export function Sheet({
  title,
  aside,
  children,
  className,
  id,
}: {
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("chart-sheet rounded-[6px] overflow-hidden scroll-mt-32", className)}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 sm:px-6 py-3 border-b-[1.5px] border-ink">
          <h2 className="text-sm font-[800] uppercase tracking-[0.06em]">{title}</h2>
          {aside && <div className="chart-data text-[0.6875rem] text-ink-muted">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* Page title block shared by app and admin screens. */
export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">{title}</h1>
        {description && <p className="mt-2 text-ink-secondary max-w-2xl">{description}</p>}
        {meta && <p className="chart-data mt-1.5 text-xs text-ink-muted">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* A row of figures printed across a sheet: label, number, optional note. */
export function FigureStrip({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: string }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 divide-border-DEFAULT sm:divide-x [&>div]:border-b [&>div]:border-border-DEFAULT sm:[&>div]:border-b-0",
        items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        className
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="px-4 sm:px-6 py-4 min-w-0">
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted">{it.label}</dt>
          <dd className={cn("chart-data mt-1 text-2xl sm:text-3xl font-bold leading-none truncate", it.tone)}>{it.value}</dd>
          {it.note && <dd className="mt-1.5 text-xs text-ink-muted">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* Empty state: an unlit LED line, a title, a sentence, and the next action. */
export function EmptyChart({
  led,
  title,
  children,
  action,
}: {
  led: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="led-board px-4 py-2.5 text-[1rem]">{led}</div>
      <div className="px-5 sm:px-8 py-10 sm:py-12 max-w-2xl">
        <h2 className="text-xl font-[800] tracking-[-0.015em]">{title}</h2>
        {children && <div className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">{children}</div>}
        {action && <div className="mt-6 flex flex-wrap gap-3">{action}</div>}
      </div>
    </div>
  );
}

/* Loading line: the LED board blinking a status while data arrives. */
export function LoadingChart({ text = "LOADING", className }: { text?: string; className?: string }) {
  return (
    <div className={cn("flex justify-center py-20", className)} role="status">
      <div className="led-board h-11 px-4 inline-flex items-center rounded-[4px] text-[1.05rem]">
        <span className="animate-led-blink">{text}</span>
      </div>
    </div>
  );
}

/* Shared page frame for signed-in app screens (room for the mobile menu button). */
export const APP_PAGE = "px-4 sm:px-6 md:px-8 pt-[5.25rem] md:pt-10 pb-12 max-w-5xl mx-auto space-y-5";
