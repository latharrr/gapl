import { Tag, VerdictBadge, type Verdict } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export { Sheet } from "@/components/ui/Sheet";

/*
  The face of a report: the verdict the recruiter wrote, the two numbers, the reason,
  and the three marks — what caught the eye (highlighter), what sank it (red pen),
  and what would change it (blue ballpoint).
*/
export function ReportFace({
  role,
  tier,
  ats,
  readiness,
  verdict,
  confidence,
  reason,
  strongestSignal,
  topGap,
  whatWouldChange,
  tag,
  meta,
}: {
  role: string;
  tier: string;
  ats: number;
  readiness: number;
  verdict: Verdict;
  confidence: number;
  reason: string;
  strongestSignal: string;
  topGap: string;
  whatWouldChange: string;
  tag?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 sm:px-8 pt-5 pb-4 border-b border-border-DEFAULT">
        <p className="text-[0.9375rem] font-semibold">
          {role} <span className="font-normal text-ink-muted">· {tier}</span>
          {tag && <Tag tone="muted" className="ml-2 align-[0.1em]">{tag}</Tag>}
        </p>
        {meta && <p className="tabular text-xs text-ink-muted">{meta}</p>}
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="px-5 sm:px-8 py-7 sm:py-8">
          <VerdictBadge verdict={verdict} size="xl" className="-rotate-2" />
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-ink max-w-[58ch]">{reason}</p>

          <dl className="mt-7 grid gap-5">
            <Remark label="What caught the eye">
              <span className="mark-hl">{strongestSignal}</span>
            </Remark>
            <Remark label="What sank it" tone="text-danger">
              <span className="mark-under">{topGap}</span>
            </Remark>
            <Remark label="What would change it" tone="text-primary-700">
              <span className="mark-fix font-medium">{whatWouldChange}</span>
            </Remark>
          </dl>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-1 md:content-start border-t md:border-t-0 md:border-l border-border-DEFAULT">
          <Figure label="Readiness" value={readiness} big note="out of 100" />
          <Figure label="ATS score" value={ats} note="keywords and format" />
          <div className="col-span-2 md:col-span-1 px-5 sm:px-6 py-5 border-t border-border-DEFAULT">
            <div className="flex items-baseline justify-between text-sm">
              <dt className="text-ink-muted">Recruiter confidence</dt>
              <dd className="figure font-semibold">{confidence}%</dd>
            </div>
            <div aria-hidden className="mt-2 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
              <div className="h-full rounded-full bg-ink" style={{ width: `${confidence}%` }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">An AI estimate. The reasons above are what it rests on.</p>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Remark({ label, tone = "text-ink-muted", children }: { label: string; tone?: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className={cn("field-label", tone)}>{label}</dt>
      <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

function Figure({ label, value, big, note }: { label: string; value: number; big?: boolean; note?: string }) {
  return (
    <div className="px-5 sm:px-6 py-5 [&+&]:border-l md:[&+&]:border-l-0 md:[&+&]:border-t border-border-DEFAULT">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={cn("figure mt-1 font-semibold leading-none", big ? "text-[clamp(3.25rem,8vw,4.5rem)]" : "text-[2rem]")}>{value}</dd>
      {note && <dd className="mt-1.5 text-xs text-ink-muted">{note}</dd>}
    </div>
  );
}

export type BreakdownItem = { label: string; score: number; weight?: string; note?: string };

/* Readiness components; the weakest is marked in red with what is pulling it down. */
export function Breakdown({ items, pulledBy }: { items: BreakdownItem[]; pulledBy?: string }) {
  const weakest = Math.min(...items.map((i) => i.score));
  return (
    <ul className="@container divide-y divide-border-DEFAULT">
      {items.map((b) => {
        const weak = b.score === weakest;
        const note = b.note ?? (weak ? pulledBy : undefined);
        return (
          <li key={b.label} className="grid gap-x-6 gap-y-2 px-4 sm:px-6 py-4 @xl:grid-cols-[13rem_minmax(0,1fr)] @xl:items-center">
            <div className="flex items-baseline justify-between @xl:block">
              <p className="font-semibold">{b.label}</p>
              <p className="text-xs text-ink-muted @xl:mt-0.5">
                <span className={cn("figure text-sm font-semibold", weak ? "text-danger" : "text-ink")}>{b.score}</span>/100
                {b.weight && <span> · weighs {b.weight}</span>}
              </p>
            </div>
            <div className="flex flex-col gap-2 @xl:flex-row @xl:items-center @xl:gap-4 min-w-0">
              <div aria-hidden className="relative h-2 w-full @xl:w-44 shrink-0 bg-surface-subtle rounded-full overflow-hidden">
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full", weak ? "bg-danger" : "bg-ink")}
                  style={{ width: `${b.score}%` }}
                />
              </div>
              {note && (
                <p className={cn("text-sm", weak ? "text-danger" : "text-ink-secondary")}>
                  {weak && !b.note ? <span className="font-semibold">Pulled down most by: </span> : null}
                  <span className={cn(weak && "mark-under font-medium")}>{note}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const PRIORITY_TONE: Record<string, "danger" | "warning" | "neutral" | "muted"> = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
  Low: "muted",
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

/* Career gaps: the gap in red-pen terms, the build that closes it in blue, the weeks and the gain. */
export function GapsTable({ gaps, readiness }: { gaps: GapRow[]; readiness: number }) {
  const cols = "md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1.25fr)_4rem_6.5rem]";
  return (
    <div>
      <div
        aria-hidden
        className={cn(
          "hidden md:grid gap-4 px-6 py-2.5 border-b border-border-DEFAULT text-xs font-medium text-ink-muted",
          cols
        )}
      >
        <span>Priority</span>
        <span>Gap</span>
        <span>Build next</span>
        <span className="text-right">Weeks</span>
        <span className="text-right">Readiness</span>
      </div>
      <ol className="divide-y divide-border-DEFAULT">
        {gaps.map((gap) => (
          <li key={gap.skill} className={cn("grid gap-x-4 gap-y-2 px-4 sm:px-6 py-4 md:items-baseline", cols)}>
            <span>
              <Tag tone={PRIORITY_TONE[gap.priority] ?? "neutral"}>{gap.priority}</Tag>
            </span>
            <div>
              <p className="font-semibold">{gap.skill}</p>
              {gap.currentLevel && <p className="text-sm text-ink-muted">Now: {gap.currentLevel}</p>}
            </div>
            <div>
              <p className="font-semibold text-primary-700">{gap.recommendedProject}</p>
              {gap.difficulty && <p className="text-sm text-ink-muted">{gap.difficulty} build</p>}
            </div>
            <p className="figure text-sm md:text-right">
              <span className="md:hidden text-ink-muted">Takes </span>
              {gap.estimatedWeeks} {gap.estimatedWeeks === 1 ? "wk" : "wks"}
            </p>
            <p className="figure text-sm md:text-right">
              {typeof gap.expectedReadinessAfter === "number" ? (
                <>
                  <span className="text-ink-muted">{readiness} → </span>
                  <span className="font-semibold text-primary-700">{gap.expectedReadinessAfter}</span>
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
      <SkillList title="Strong on your resume" kind="seen" skills={strong} />
      <SkillList title="Missing for this tier" kind="missing" skills={missing} />
    </div>
  );
}

function SkillList({ title, kind, skills }: { title: string; kind: "seen" | "missing"; skills: string[] }) {
  return (
    <div className="px-4 sm:px-6 py-5">
      <h3 className={cn("field-label", kind === "seen" ? "text-ink-muted" : "text-danger")}>{title}</h3>
      {skills.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <li
              key={s}
              className={cn(
                "inline-flex items-center rounded-[6px] px-2 py-1 text-[0.8125rem] font-medium",
                kind === "seen" ? "bg-highlight-soft text-ink" : "text-danger ring-1 ring-inset ring-danger-border"
              )}
            >
              {kind === "missing" && <span className="sr-only">Missing: </span>}
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
