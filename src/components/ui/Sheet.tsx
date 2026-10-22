import { cn } from "@/lib/utils";

/* A sheet of paper: the house container for any grouped content. */
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
    <section id={id} className={cn("sheet rounded-[10px] overflow-hidden scroll-mt-32", className)}>
      {title && (
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 sm:px-6 pt-4 pb-3 border-b border-border-DEFAULT">
          <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{title}</h2>
          {aside && <div className="tabular text-xs text-ink-muted">{aside}</div>}
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
    <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
      <div className="min-w-0">
        <h1 className="display text-[clamp(1.875rem,4vw,2.5rem)]">{title}</h1>
        {description && <p className="mt-2 text-ink-secondary max-w-2xl">{description}</p>}
        {meta && <p className="tabular mt-1.5 text-xs text-ink-muted">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* A row of figures across a sheet: label, number, optional note. */
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
          <dt className="text-[0.8125rem] font-medium text-ink-muted">{it.label}</dt>
          <dd className={cn("figure mt-1 text-2xl sm:text-[2rem] font-semibold leading-none truncate", it.tone)}>{it.value}</dd>
          {it.note && <dd className="mt-1.5 text-xs text-ink-muted">{it.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* Empty state: a blank page waiting for its marks, a title, a sentence, the next action. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 sm:px-8 py-10 sm:py-12 grid gap-8 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
      <BlankPage />
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold tracking-[-0.015em]">{title}</h2>
        {children && <div className="mt-2 text-[0.9375rem] leading-relaxed text-ink-secondary">{children}</div>}
        {action && <div className="mt-6 flex flex-wrap gap-3">{action}</div>}
      </div>
    </div>
  );
}

/* A miniature resume page with nothing marked on it yet. */
function BlankPage() {
  return (
    <div aria-hidden className="w-24 sm:w-28 aspect-[1/1.3] rounded-[3px] bg-surface-DEFAULT ring-1 ring-border-DEFAULT shadow-sm p-3 flex flex-col gap-[7%]">
      <span className="h-[7%] w-1/2 rounded-[1px] bg-ink/80" />
      <span className="h-[3.5%] w-full rounded-[1px] bg-surface-subtle" />
      <span className="h-[3.5%] w-5/6 rounded-[1px] bg-surface-subtle" />
      <span className="h-[3.5%] w-2/3 rounded-[1px] bg-highlight-soft" />
      <span className="h-[3.5%] w-full rounded-[1px] bg-surface-subtle" />
      <span className="h-[3.5%] w-3/4 rounded-[1px] bg-surface-subtle" />
    </div>
  );
}

/* Loading: a highlighter sweeping a line while the data arrives. */
export function Loading({ text = "Loading", className }: { text?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-20", className)} role="status">
      <ReadingLine />
      <p className="text-sm text-ink-muted">{text}…</p>
    </div>
  );
}

export function ReadingLine({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative block h-2.5 w-36 overflow-hidden rounded-[2px] bg-surface-subtle", className)}>
      <span className="absolute inset-y-0 left-0 w-full origin-left bg-highlight animate-[sweep_1.6s_var(--ease-out-expo)_infinite]" />
    </span>
  );
}

/* Shared page frame for signed-in app screens (room for the mobile menu bar). */
export const APP_PAGE = "px-4 sm:px-6 md:px-8 pt-[5.25rem] md:pt-10 pb-12 max-w-5xl mx-auto space-y-5";
