"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, FileUp } from "lucide-react";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { SampleResume } from "@/components/brand/SampleResume";
import { trackEvent } from "@/lib/analytics";
import { handOffResume } from "@/lib/resume-handoff";
import { ROLES, TIERS, analyzeHref } from "@/lib/targets";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.txt,application/pdf,text/plain";
const MAX_BYTES = 5 * 1024 * 1024;

export function HeroSection() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [tier, setTier] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  const start = (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".pdf" && ext !== ".txt") {
      setError(`"${file.name}" isn't a PDF or TXT. Export your resume as PDF, or paste the text on the next step.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over 5 MB. Export a lighter PDF, or paste the text on the next step.");
      return;
    }
    setError("");
    handOffResume(file);
    trackEvent("landing_enquiry", { role: role || null, tier: tier || null, file: true });
    router.push(analyzeHref(role, tier));
  };

  return (
    <section className="on-desk relative overflow-hidden pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 grid gap-8 sm:gap-12 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-0">
        <div className="lg:col-span-6 lg:pt-4 xl:pr-6">
          <h1 className="display text-[clamp(2.6rem,5.6vw,4.75rem)] leading-[1.02]">
            Six seconds.{" "}
            <span className="hero-hl">Here&apos;s what they saw.</span>
          </h1>
          <p className="mt-5 sm:mt-6 max-w-[34rem] text-lg leading-relaxed text-desk-muted">
            <span className="lg:hidden">Gapl reads your resume like a recruiter, then shows the line that sank it.</span>
            <span className="hidden lg:inline">
              A recruiter skims your resume for one role and decides. Gapl reads it the same way, shows you the line
              that sank it, and tells you what to build so it doesn&apos;t happen again.
            </span>
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7 lg:row-span-2">
          <SampleResume replay crop className="mx-auto max-w-[38rem] lg:ml-auto lg:mr-0" />
        </div>

        <div className="lg:col-span-6 lg:row-start-2 xl:pr-6">
          <form
            className={cn(
              "lg:mt-9 rounded-[12px] border bg-desk-raised p-3 sm:p-4 transition-colors",
              dragging ? "border-highlight" : "border-desk-line"
            )}
            aria-label="Check your resume"
            onSubmit={(e) => {
              e.preventDefault();
              inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) start(file);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DeskSelect
                id="hero-role"
                label="Role"
                value={role}
                onChange={setRole}
                placeholder="Any role"
                options={ROLES.map((r) => ({ value: r, label: r }))}
              />
              <DeskSelect
                id="hero-tier"
                label="Companies"
                value={tier}
                onChange={setTier}
                placeholder="Any tier"
                options={TIERS.map((t) => ({ value: t.label, label: t.label }))}
              />
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) start(file);
                e.target.value = "";
              }}
            />
            <button type="submit" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "mt-3 w-full")}>
              <FileUp size={18} strokeWidth={2.25} />
              {dragging ? "Drop it to start" : "Read my resume"}
            </button>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger-on-desk">
                {error}
              </p>
            ) : (
              <p className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.8125rem] text-desk-muted">
                <span>PDF or TXT, or drag it here. First read is free.</span>
                <Link href={analyzeHref(role, tier)} className="font-medium text-desk-ink underline decoration-desk-faint hover:decoration-desk-ink">
                  Paste text instead
                </Link>
              </p>
            )}
          </form>
        </div>

      </div>
    </section>
  );
}

function DeskSelect({
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
    <div className="relative">
      <label htmlFor={id} className="absolute left-3 top-2 text-[0.6875rem] font-medium text-desk-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-14 appearance-none rounded-[9px] border border-desk-line bg-desk pl-3 pr-9 pt-4 text-[0.9375rem] font-medium",
          "hover:border-desk-muted focus:outline-none focus:border-highlight",
          value ? "text-desk-ink" : "text-desk-muted"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-desk-muted" />
    </div>
  );
}

