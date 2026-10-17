import { Plus, Minus, ArrowRight, type LucideIcon } from "lucide-react";
import { VerdictBadge, type Verdict } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export { Sheet } from "@/components/ui/Sheet";

const ROW = "md:grid-cols-[1.3fr_1.1fr_4.5rem_6rem_6.5rem_minmax(0,1.6fr)]";

/* The candidate's row on the reservation chart: the whole report in one line. */
export function ChartRow({
  role,
  tier,
  ats,
  readiness,
  verdict,
  waitlist,
  topGap,
  tag,
}: {
  role: string;
  tier: string;
  ats: number;
  readiness: number;
  verdict: Verdict;
  waitlist: number;
  topGap: string;
  tag?: string;
}) {
  return (
    <div>
      <div
        aria-hidden
        className={cn(
          "hidden md:grid gap-4 px-6 py-2 border-b border-border-DEFAULT text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted",
          ROW
        )}
      >
        <span>Applying for</span>
        <span>Tier</span>
        <span className="text-right">ATS</span>
        <span className="text-right">Readiness</span>
        <span>Status</span>
        <span>Top gap</span>
      </div>
      <div className={cn("grid grid-cols-2 gap-x-4 gap-y-3 px-4 sm:px-6 py-5 md:items-center", ROW)}>
        <p className="col-span-2 md:col-span-1 text-xl sm:text-2xl font-[800] tracking-[-0.02em] leading-tight">
          {role}
          {tag && (
            <span className="ml-2 align-middle chart-data text-[0.625rem] font-semibold uppercase text-ink-muted border border-border-strong rounded-[2px] px-1 py-px">
              {tag}
            </span>
          )}
        </p>
        <p className="col-span-2 md:col-span-1 text-[0.9375rem] text-ink-secondary">{tier}</p>
        <Figure label="ATS" value={ats} />
        <Figure label="Readiness" value={readiness} big />
        <div className="col-span-2 md:col-span-1">
          <VerdictBadge verdict={verdict} waitlist={waitlist} />
        </div>
        <p className="col-span-2 md:col-span-1 text-[0.9375rem] font-semibold">{topGap}</p>
      </div>
    </div>
  );
}

function Figure({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <p className="flex items-baseline gap-2 md:block md:text-right">
      <span className="md:sr-only text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted">{label}</span>
      <span className={cn("chart-data font-bold leading-none", big ? "text-4xl" : "text-2xl")}>{value}</span>
    </p>
  );
}

/* The recruiter's remark: reason, then the three printed continuation lines. */
export function RecruiterRemark({
  reason,
  strongestSignal,
  topGap,
  whatWouldChange,
  confidence,
  verdict,
}: {
  reason: string;
  strongestSignal: string;
  topGap: string;
  whatWouldChange: string;
  confidence: number;
  verdict: Verdict;
}) {
  const tone = verdict === "Reject" ? "bg-danger" : verdict === "Shortlist" ? "bg-success" : "bg-warning";
  return (
    <div className="px-4 sm:px-6 py-6 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-muted">Why this estimate</p>
        <p className="mt-2 text-lg sm:text-xl leading-relaxed text-ink max-w-[62ch]">{reason}</p>
        <div className="mt-6 max-w-sm">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-muted">Recruiter confidence</span>
            <span className="chart-data font-bold">{confidence}%</span>
          </div>
          <div className="mt-1.5 h-2 bg-surface-subtle rounded-[2px] overflow-hidden">
            <div className={cn("h-full rounded-[2px]", tone)} style={{ width: `${confidence}%` }} />
          </div>
        </div>
      </div>
      <dl className="grid gap-4 content-start lg:border-l lg:border-border-DEFAULT lg:pl-8">
        <Remark icon={Plus} label="Strongest signal" tone="text-success">{strongestSignal}</Remark>
        <Remark icon={Minus} label="Top gap" tone="text-danger">{topGap}</Remark>
        <Remark icon={ArrowRight} label="What would change it" tone="text-primary-600">{whatWouldChange}</Remark>
      </dl>
    </div>
  );
}

function Remark({ icon: Icon, label, tone, children }: { icon: LucideIcon; label: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
      <Icon aria-hidden size={16} strokeWidth={2.75} className={cn("mt-px", tone)} />
      <div>
        <dt className={cn("text-xs font-bold uppercase tracking-[0.07em]", tone)}>{label}</dt>
        <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-secondary">{children}</dd>
      </div>
    </div>
  );
}

export type BreakdownItem = { label: string; score: number; weight?: string; note?: string };

/* Readiness components; the weakest carries a leader line to what is pulling it down. */
export function Breakdown({ items, pulledBy }: { items: BreakdownItem[]; pulledBy?: string }) {
  const weakest = Math.min(...items.map((i) => i.score));
  return (
    <ul className="divide-y divide-border-DEFAULT">
      {items.map((b) => {
        const weak = b.score === weakest;
        const note = b.note ?? (weak ? pulledBy : undefined);
        return (
          <li key={b.label} className="grid gap-x-5 gap-y-2 px-4 sm:px-6 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
            <div className="flex items-baseline justify-between sm:block">
              <p className="font-bold">{b.label}</p>
              <p className="text-xs text-ink-muted sm:mt-0.5">
                <span className={cn("chart-data font-bold", weak ? "text-danger" : "text-ink")}>{b.score}</span>/100
                {b.weight && <span> · {b.weight} weight</span>}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
              <div className="relative h-2.5 w-full sm:w-48 shrink-0 bg-surface-subtle rounded-[2px] overflow-hidden">
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-[2px]", weak ? "bg-danger" : "bg-primary-600")}
                  style={{ width: `${b.score}%` }}
                />
              </div>
              {note && (
                <>
                  <span aria-hidden className="hidden sm:block h-px flex-1 min-w-4 border-t border-dashed border-ink-faint" />
                  <p className={cn("text-sm sm:max-w-[24rem] sm:text-right", weak ? "font-semibold text-danger" : "text-ink-secondary")}>
                    {weak && !b.note ? "Pulled down most by: " : ""}
                    {note}
                  </p>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  Critical: "text-danger bg-danger-bg",
  High: "text-warning bg-warning-bg",
  Medium: "text-ink-secondary bg-surface-subtle",
  Low: "text-ink-muted bg-surface-DEFAULT",
};

export type GapRow = {
  skill: string;
  priority: string;
  recommendedProject: string;
  estimatedWeeks: number;
  currentLevel?: string;
  difficulty?: string;
  expectedReadinessAfter?: number;
};

/* Career gaps as chart rows: priority, the gap, the build that closes it, the halt. */
export function GapsTable({ gaps, readiness }: { gaps: GapRow[]; readiness: number }) {
  const cols = "md:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1.2fr)_4.5rem_6.5rem]";
  return (
    <div>
      <div
        aria-hidden
        className={cn(
          "hidden md:grid gap-4 px-6 py-2 border-b border-border-DEFAULT text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted",
          cols
        )}
      >
        <span>Priority</span>
        <span>Gap</span>
        <span>Build next</span>
        <span className="text-right">Weeks</span>
        <span className="text-right">Readiness</span>
      </div>
      <ol className="chart-rows">
        {gaps.map((gap) => (
          <li key={gap.skill} className={cn("grid gap-x-4 gap-y-2 px-4 sm:px-6 py-4 md:items-baseline", cols)}>
            <span>
              <span className={cn("stamp text-[0.6875rem]", PRIORITY_TONE[gap.priority] ?? PRIORITY_TONE.Medium)}>
                {gap.priority}
              </span>
            </span>
            <div>
              <p className="font-bold">{gap.skill}</p>
              {gap.currentLevel && <p className="text-sm text-ink-muted">Current level: {gap.currentLevel}</p>}
            </div>
            <div>
              <p className="font-semibold text-primary-600">{gap.recommendedProject}</p>
              {gap.difficulty && <p className="text-sm text-ink-muted">{gap.difficulty} build</p>}
            </div>
            <p className="chart-data text-sm md:text-right">
              <span className="md:hidden text-ink-muted">Halt </span>
              {gap.estimatedWeeks}w
            </p>
            <p className="chart-data text-sm md:text-right">
              {typeof gap.expectedReadinessAfter === "number" ? (
                <>
                  <span className="text-ink-muted">{readiness} → </span>
                  <span className="font-bold text-success">{gap.expectedReadinessAfter}</span>
                </>
              ) : (
                <span className="text-ink-faint">—</span>
              )}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SkillsLedger({ strong, missing }: { strong: string[]; missing: string[] }) {
  return (
    <div className="grid md:grid-cols-2 md:divide-x divide-border-DEFAULT">
      <SkillList title="Strong on your resume" mark="+" tone="text-success" skills={strong} />
      <SkillList title="Missing for this tier" mark="−" tone="text-danger" skills={missing} />
    </div>
  );
}

function SkillList({ title, mark, tone, skills }: { title: string; mark: string; tone: string; skills: string[] }) {
  return (
    <div className="px-4 sm:px-6 py-5">
      <h3 className={cn("text-xs font-bold uppercase tracking-[0.08em]", tone)}>{title}</h3>
      {skills.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <li key={s} className="chart-data inline-flex items-center gap-1.5 rounded-[3px] border border-border-strong bg-surface-DEFAULT px-2 py-1 text-xs">
              <span aria-hidden className={cn("font-bold", tone)}>{mark}</span>
              {s}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">None listed.</p>
      )}
    </div>
  );
}
