import { VerdictBadge } from "@/components/ui/Badge";

// What Gapl does, set as the legend printed at the foot of a reservation chart.
const LEGEND: { code: React.ReactNode; name: string; means: string }[] = [
  {
    code: <VerdictBadge verdict="Shortlist" size="sm" />,
    name: "Confirmed",
    means: "A recruiter at this tier would likely shortlist the resume for this role.",
  },
  {
    code: <VerdictBadge verdict="Maybe" size="sm" />,
    name: "Borderline",
    means: "It could go either way. One or two gaps decide it, and the report names them.",
  },
  {
    code: <VerdictBadge verdict="Reject" waitlist={3} size="sm" />,
    name: "Waitlisted",
    means: "Filtered out. The number is how many Critical and High gaps stand between you and a shortlist.",
  },
  {
    code: <span className="stamp text-[0.6875rem] text-ink">ATS</span>,
    name: "ATS score",
    means: "Keyword patterns, format issues and section problems, read the way applicant tracking systems read them.",
  },
  {
    code: <span className="stamp text-[0.6875rem] text-ink">6 SEC</span>,
    name: "Recruiter simulation",
    means: "A first-impression read that skims for signals the way a recruiter does, not word by word.",
  },
  {
    code: <span className="stamp text-[0.6875rem] text-ink">GAP</span>,
    name: "Career gap analysis",
    means: "The skills you are missing for this role and tier, ranked Critical to Low by impact, not alphabetically.",
  },
  {
    code: <span className="stamp text-[0.6875rem] text-ink">ROUTE</span>,
    name: "Roadmap",
    means: "Week-by-week projects that produce recruiter-visible signals. Not generic tutorials.",
  },
  {
    code: <span className="stamp text-[0.6875rem] text-ink">RE</span>,
    name: "Progress tracking",
    means: "Re-analyze over time and see which gaps you closed and which are still critical.",
  },
  {
    code: <span className="stamp text-[0.6875rem] text-ink">PRINT</span>,
    name: "Reports and CV",
    means: "Print a tailored CV, share a concise report summary, and keep a record of the gaps you are closing.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-surface-muted scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <div>
          <h2 className="display text-[clamp(2rem,4.2vw,3.5rem)]">Codes on your chart.</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
            Everything in a Gapl report, and what each mark means. The words Shortlist, Maybe and Reject always sit
            next to their codes.
          </p>
        </div>

        <div className="chart-sheet rounded-[6px] overflow-hidden self-start">
          <div className="flex items-baseline justify-between px-4 sm:px-5 py-3 border-b-[1.5px] border-ink">
            <h3 className="text-sm font-[800] uppercase tracking-[0.06em]">Legend</h3>
            <span className="chart-data text-[0.6875rem] text-ink-muted">{LEGEND.length} entries</span>
          </div>
          <dl className="chart-rows">
            {LEGEND.map((row) => (
              <div
                key={row.name}
                className="grid gap-x-5 gap-y-1.5 px-4 sm:px-5 py-3.5 sm:grid-cols-[9.5rem_11rem_minmax(0,1fr)] sm:items-baseline"
              >
                <dt className="contents">
                  <span>{row.code}</span>
                  <span className="font-bold">{row.name}</span>
                </dt>
                <dd className="text-[0.9375rem] leading-relaxed text-ink-secondary">{row.means}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
