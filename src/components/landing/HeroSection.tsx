"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, FileUp } from "lucide-react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { buttonBase, buttonVariants } from "@/components/ui/Button";
import { SAMPLE } from "@/lib/sample-report";
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
  const heroRef = useRef<HTMLElement>(null);

  // As the page scrolls, the photo eases closer and the copy lifts away.
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const st = { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-media]", { scale: 1.12, ease: "none", scrollTrigger: st });
        gsap.to("[data-hero-copy]", { y: -90, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
        gsap.from("[data-hero-in]", { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, delay: 0.15 });
      });
    },
    { scope: heroRef }
  );

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
    <section ref={heroRef} className="relative h-[100svh] min-h-[640px] max-h-[960px] overflow-hidden bg-ink">
      {/* Gem: one full-bleed warm photo. On scroll it settles back like a print being set down. */}
      <div data-hero-media className="absolute inset-0 origin-[50%_70%] will-change-transform">
        <Image
          src="/living/img/hero.jpg"
          alt="A printed resume with yellow highlights on a sunlit wooden table, beside a blue pen, a red pen and a glass of chai"
          fill
          preload
          sizes="100vw"
          className="object-cover object-[70%_50%]"
        />
      </div>
      {/* Phones: the copy sits low over a deep warm scrim. Desktop: a side scrim keeps the paper clear. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#24160a]/90 via-[#24160a]/55 to-[#24160a]/10 lg:bg-gradient-to-r lg:from-[#24160a]/70 lg:via-[#24160a]/25 lg:to-transparent" aria-hidden />

      <div
        data-hero-copy
        className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 pt-16 pb-10 lg:pb-0 grid items-end lg:items-center lg:grid-cols-12 lg:gap-10"
      >
        <div className="lg:col-span-6 text-white">
          <h1 data-hero-in className="serif-display text-[clamp(3rem,6.6vw,6rem)]">
            Six seconds.
            <br />
            Here&apos;s what they saw.
          </h1>
          <p data-hero-in className="mt-6 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/80">
            Gapl reads your resume the way a recruiter does, shows the line that sank it, and tells you what to build
            next.
          </p>

          <form
            data-hero-in
            className={cn(
              "mt-9 max-w-[34rem] grid gap-2 sm:grid-cols-[1fr_1fr_auto] rounded-[4px] p-2 bg-white/12 backdrop-blur-xl border transition-colors",
              dragging ? "border-highlight" : "border-white/20"
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
            <GlassSelect id="hero-role" label="Role" value={role} onChange={setRole} placeholder="Any role"
              options={ROLES.map((r) => ({ value: r, label: r }))} />
            <GlassSelect id="hero-tier" label="Companies" value={tier} onChange={setTier} placeholder="Any tier"
              options={TIERS.map((t) => ({ value: t.label, label: t.label }))} />
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
            <button type="submit" className={cn(buttonBase, buttonVariants.primary, "btn-sq h-14 px-6 text-[0.9375rem]")}>
              <FileUp size={18} strokeWidth={2.25} />
              {dragging ? "Drop it" : "Read my resume"}
            </button>
          </form>
          {error ? (
            <p role="alert" className="mt-3 max-w-[34rem] text-sm text-danger-on-desk">
              {error}
            </p>
          ) : (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-white/70">
              <span>PDF or TXT, or drag it here. First read is free.</span>
              <Link href={analyzeHref(role, tier)} className="font-medium text-white underline decoration-white/40 hover:decoration-white">
                Paste text instead
              </Link>
            </p>
          )}
        </div>

        <div data-hero-in className="hidden lg:block lg:col-span-5 lg:col-start-8 self-end mb-20">
          <LiveReadCard />
        </div>
      </div>
    </section>
  );
}

// Gem's floating candidate card, as Gapl's six-second read: the marks land one by one, then it reads again.
// The text is always there; only the marks come and go, so the card never reads as empty.
function LiveReadCard() {
  const [step, setStep] = useState(6);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((s) => (s + 1) % 9), 900);
    return () => clearInterval(id);
  }, []);
  const marked = (n: number) => step >= n;
  return (
    <div className="ml-auto max-w-[25rem] overflow-hidden rounded-[12px] bg-white text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
      <div className="flex items-center justify-between gap-3 border-b border-border-DEFAULT px-5 py-3.5">
        <p className="text-[0.8125rem] font-semibold">
          {SAMPLE.role} <span className="font-normal text-ink-muted">· {SAMPLE.companyTier}</span>{" "}
          <span className="tag ml-1 align-middle">Sample</span>
        </p>
        <span className="text-[0.75rem] text-ink-muted">{Math.min(6, step)} of 6 s</span>
      </div>
      <div className="h-0.5 bg-surface-subtle">
        <div className="h-full bg-ink origin-left transition-transform duration-[900ms] ease-linear" style={{ transform: `scaleX(${Math.min(6, step) / 6})` }} />
      </div>
      <div className="space-y-4 px-5 py-5 text-[0.9375rem]">
        <div>
          <p className="field-label">What caught the eye</p>
          <p className="mt-1">
            <span className={cn("bg-no-repeat [background-image:linear-gradient(var(--color-highlight),var(--color-highlight))] transition-[background-size] duration-500 ease-[cubic-bezier(.16,1,.3,1)]", marked(2) ? "[background-size:100%_100%]" : "[background-size:0%_100%]")}>
              {SAMPLE.strongestSignal.split(" — ")[0]}
            </span>
          </p>
        </div>
        <div>
          <p className="field-label">What sank it</p>
          <p className={cn("mt-1 underline decoration-2 underline-offset-4 transition-colors duration-500", marked(4) ? "text-danger decoration-danger" : "text-ink decoration-transparent")}>{SAMPLE.topGap}</p>
        </div>
        <div className="flex items-end justify-between">
          <span className={cn("verdict text-danger border-danger transition-all duration-300", marked(6) ? "opacity-100 scale-100" : "opacity-40 scale-105")}>{SAMPLE.verdict}</span>
          <span className="serif-display text-[2.75rem] leading-none">
            {SAMPLE.readiness}
            <span className="font-sans text-sm tracking-normal text-ink-muted"> readiness</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function GlassSelect({
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
      <label htmlFor={id} className="absolute left-3 top-2 text-[0.6875rem] font-medium text-white/70">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-14 appearance-none rounded-[2px] border border-white/15 bg-black/25 pl-3 pr-9 pt-4 text-[0.9375rem] font-medium [color-scheme:dark]",
          "hover:border-white/40 focus:outline-none focus:border-highlight",
          value ? "text-white" : "text-white/70"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70" />
    </div>
  );
}

