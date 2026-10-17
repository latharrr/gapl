"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/Badge";
import { LedBoard } from "@/components/brand/LedBoard";
import { trackEvent } from "@/lib/analytics";
import { SAMPLE, waitlistCount } from "@/lib/sample-report";
import { ROLES, TIERS, analyzeHref } from "@/lib/targets";
import { cn } from "@/lib/utils";

const WL = waitlistCount(SAMPLE.gaps);

const LED_MESSAGES = [
  `SAMPLE · ${SAMPLE.role.toUpperCase()} · ${SAMPLE.companyTier.toUpperCase()} · STATUS WL ${WL}`,
  `NEXT BUILD › ${SAMPLE.route[1].build.toUpperCase()} · 1 WEEK`,
  `ROUTE › ${SAMPLE.route.length - 1} STOPS · READINESS ${SAMPLE.route[0].readiness} → ${SAMPLE.route[SAMPLE.route.length - 1].readiness}`,
];

export function HeroSection() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [tier, setTier] = useState("");

  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("landing_enquiry", { role: role || null, tier: tier || null });
    router.push(analyzeHref(role, tier));
  };

  return (
    <section className="relative bg-surface-muted pt-[59px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-14">
        {/* Station nameboard */}
        <div className="signboard px-5 pt-6 pb-5 sm:px-10 sm:pt-8 sm:pb-6">
          <h1 className="display text-[clamp(2.4rem,6.4vw,5.6rem)]">
            Know why you&apos;re not
            <br className="hidden sm:block" /> getting shortlisted.
          </h1>
          <p className="mt-4 sm:mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] sm:text-sm font-bold uppercase tracking-[0.06em]">
            <span>Recruiter verdict</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>Skill gaps</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>What to build next</span>
          </p>
        </div>

        {/* PNR enquiry: the working start of an analysis */}
        <form
          onSubmit={submit}
          className="mt-3 rounded-[6px] bg-primary-600 p-3 sm:p-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
          aria-label="Check your status"
        >
          <EnquirySelect
            id="enq-role"
            label="Applying for"
            value={role}
            onChange={setRole}
            placeholder="Choose a role"
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />
          <EnquirySelect
            id="enq-tier"
            label="Company tier"
            value={tier}
            onChange={setTier}
            placeholder="Choose a tier"
            options={TIERS.map((t) => ({ value: t.label, label: `${t.label} — ${t.description}` }))}
          />
          <Button type="submit" size="lg" className="w-full md:w-auto">
            Check my status
            <ArrowRight size={17} strokeWidth={2.5} />
          </Button>
        </form>
        <p className="mt-2.5 px-1 text-[0.8125rem] text-ink-muted">
          First analysis free · PDF or pasted text · Scores are AI estimates, and every one comes with its reasons.
        </p>

        {/* Reservation chart */}
        <ReservationChart role={role} tier={tier} />

        <LedBoard
          tag="GAPL"
          messages={LED_MESSAGES}
          className="mt-3 h-11 px-4 text-[0.95rem] sm:text-[1.05rem]"
        />
      </div>
    </section>
  );
}

function EnquirySelect({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-xs font-bold uppercase tracking-[0.07em] text-board">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-12 appearance-none rounded-[5px] border-2 border-transparent bg-surface-DEFAULT pl-3 pr-10 text-[0.9375rem] font-medium",
            "focus:outline-none focus:border-board",
            value ? "text-ink" : "text-ink-muted"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      </div>
    </div>
  );
}

const COLS = "md:grid-cols-[3rem_1.2fr_1.1fr_4rem_5.5rem_9.5rem_2.4fr]";

function ReservationChart({ role, tier }: { role: string; tier: string }) {
  const ready = Boolean(role && tier);

  return (
    <div className="chart-sheet mt-6 rounded-[6px] overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 sm:px-5 py-3 border-b-[1.5px] border-ink">
        <h2 className="text-sm font-[800] uppercase tracking-[0.06em]">Reservation chart</h2>
        <p className="chart-data text-[0.6875rem] text-ink-muted">
          Row 1 is a sample report · Row 2 is yours, once you upload
        </p>
      </div>

      <div
        aria-hidden
        className={cn(
          "hidden md:grid gap-4 px-5 py-2 border-b border-border-DEFAULT text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted",
          COLS
        )}
      >
        <span>No.</span>
        <span>Applying for</span>
        <span>Tier</span>
        <span className="text-right">ATS</span>
        <span className="text-right">Readiness</span>
        <span>Status</span>
        <span>Remarks</span>
      </div>

      <div className="chart-rows">
        {/* Sample row */}
        <div className="px-4 sm:px-5 py-3.5">
          <div className={cn("grid gap-x-4 gap-y-2 grid-cols-2 md:items-center", COLS)}>
            <span className="chart-data hidden md:block text-sm text-ink-muted">01</span>
            <span className="col-span-2 md:col-span-1 font-bold">
              {SAMPLE.role}
              <span className="ml-2 align-middle chart-data text-[0.625rem] font-semibold uppercase text-ink-muted border border-border-strong rounded-[2px] px-1 py-px">
                Sample
              </span>
            </span>
            <span className="col-span-2 md:col-span-1 text-sm text-ink-secondary">{SAMPLE.companyTier}</span>
            <Num label="ATS" value={SAMPLE.atsScore} />
            <Num label="Readiness" value={SAMPLE.readiness} />
            <span className="col-span-2 md:col-span-1">
              <VerdictBadge verdict={SAMPLE.verdict} waitlist={WL} />
            </span>
            <span className="col-span-2 md:col-span-1 text-sm font-medium text-ink">{SAMPLE.topGap}.</span>
          </div>
          <dl className={cn("mt-2 grid gap-1 md:grid-cols-[3rem_1fr] md:gap-x-4 chart-data text-[0.75rem] text-ink-secondary")}>
            <dt className="sr-only">Strongest signal</dt>
            <dd className="md:col-start-2">
              <span className="text-ink-muted">+ Strongest signal:</span> {SAMPLE.strongestSignal}
            </dd>
            <dt className="sr-only">What would change the decision</dt>
            <dd className="md:col-start-2">
              <span className="text-ink-muted">→ Would change it:</span> {SAMPLE.whatWouldChangeDecision}
            </dd>
          </dl>
        </div>

        {/* Your row */}
        <div className="px-4 sm:px-5 py-3.5">
          <div className={cn("grid gap-x-4 gap-y-2 grid-cols-2 md:items-center", COLS)}>
            <span className="chart-data hidden md:block text-sm text-ink-muted">02</span>
            <span className={cn("col-span-2 md:col-span-1 font-bold", !role && "text-ink-faint")}>
              {role || "Your role"}
              <span className="ml-2 align-middle chart-data text-[0.625rem] font-semibold uppercase text-primary-600 border border-primary-400 rounded-[2px] px-1 py-px">
                You
              </span>
            </span>
            <span className={cn("col-span-2 md:col-span-1 text-sm", tier ? "text-ink-secondary" : "text-ink-faint")}>
              {tier || "Your tier"}
            </span>
            <Num label="ATS" value={null} />
            <Num label="Readiness" value={null} />
            <span className="col-span-2 md:col-span-1">
              <span className="stamp text-xs text-ink-muted border-dashed">Not charted</span>
            </span>
            <span className="col-span-2 md:col-span-1 text-sm text-ink-secondary">
              {ready ? (
                <Link href={analyzeHref(role, tier)} className="font-semibold text-primary-600 underline hover:text-primary-700">
                  Ready to chart. Upload your resume →
                </Link>
              ) : (
                "Pick a role and tier above, then upload your resume to chart this row."
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Num({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="flex items-baseline gap-2 md:block md:text-right">
      <span className="md:sr-only text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-ink-muted">{label}</span>
      <span className={cn("chart-data text-lg font-bold", value === null && "text-ink-faint")}>
        {value === null ? "—" : value}
      </span>
    </span>
  );
}
