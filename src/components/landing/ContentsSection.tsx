import { ROLES, TIERS } from "@/lib/targets";

const CONTENTS: { term: string; means: string }[] = [
  { term: "The six-second read", means: "The verdict a recruiter at your tier would give, Shortlist, Maybe or Reject, with the reason written out." },
  { term: "ATS score", means: "Keyword patterns, format and section problems, read the way applicant tracking systems read them." },
  { term: "Readiness, with its working", means: "Skill match, project complexity, deployment evidence and team signals, each with what is pulling it down." },
  { term: "Gaps, ranked", means: "The skills you are missing for this role and tier, Critical to Low, ordered by how much they cost you a shortlist." },
  { term: "A week-by-week roadmap", means: "Projects that leave recruiter-visible proof, not tutorials. Tick tasks off as you build." },
  { term: "Tailoring and a CV builder", means: "Rewrite your CV against a job description, or build a clean one-page CV and save it as a PDF." },
  { term: "Re-checks", means: "Upload the updated resume after a build and see which gaps closed and which are still open." },
];

// What a report contains, set as a plain index on paper.
export function ContentsSection() {
  return (
    <section className="bg-surface-DEFAULT text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <h2 className="display text-[clamp(2.25rem,4.2vw,3.5rem)]">Everything they&apos;d tell you, if they had the time.</h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-secondary">
            Read against one role at one kind of company, because an SDE intern at a startup is judged on different
            things than one at a mass recruiter.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <div>
              <p className="font-semibold">Roles</p>
              <p className="mt-1 text-ink-muted">{ROLES.join(" · ")}</p>
            </div>
            <div>
              <p className="font-semibold">Company tiers</p>
              <ul className="mt-1 space-y-1 text-ink-muted">
                {TIERS.map((t) => (
                  <li key={t.label}>
                    <span className="text-ink-secondary">{t.label}</span> — {t.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <dl className="lg:col-span-7 lg:col-start-6 border-t border-ink">
          {CONTENTS.map((row) => (
            <div key={row.term} className="grid gap-x-8 gap-y-1 py-5 border-b border-border-DEFAULT sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-baseline">
              <dt className="text-lg font-semibold tracking-[-0.01em]">{row.term}</dt>
              <dd className="text-[0.9375rem] leading-relaxed text-ink-secondary">{row.means}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
