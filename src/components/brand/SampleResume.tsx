"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE } from "@/lib/sample-report";

/*
  The sample resume, set like the one-page LaTeX template most CS students use,
  with a recruiter's six-second read marked on it. The read plays once the page is
  40% in view; without JS or under reduced motion the page arrives already marked.
  Every mark is mirrored in the screen-reader summary.
*/

type Props = {
  /** Draw the marks over six seconds. Off = the page arrives fully marked. */
  animate?: boolean;
  /** Show the "Read it again" control under the page. */
  replay?: boolean;
  /** Below lg, crop the page to Education → Projects so the marked line fits a phone's first screen. */
  crop?: boolean;
  className?: string;
};

export function SampleResume({ animate = true, replay = false, crop = false, className }: Props) {
  const [run, setRun] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState<"pending" | "play" | "static">(animate ? "pending" : "static");

  useEffect(() => {
    if (!animate) return;
    const el = pageRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlay("static");
      return;
    }
    setPlay("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlay("play");
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate, run]);

  return (
    <figure className={cn("relative", className)}>
      <figcaption className="sr-only">
        Sample resume (not a real candidate), marked the way a recruiter reads it in six seconds. Seen:{" "}
        {SAMPLE.strongestSignal}; React and 450+ LeetCode problems. Marked in red: the only projects are coursework
        with no deployment, and there is no backend framework. Verdict for {SAMPLE.role} at a {SAMPLE.companyTier}:{" "}
        {SAMPLE.verdict}.
      </figcaption>

      <div
        key={run}
        ref={pageRef}
        aria-hidden
        data-play={play}
        className={cn("read page rounded-[3px] [container-type:inline-size]", crop && "max-lg:max-h-[118cqw] max-lg:overflow-hidden")}
      >
        <ReadStrip />
        <ResumeBody compact={crop} />
      </div>

      {replay && animate && (
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-desk-muted hover:text-desk-ink"
        >
          <RotateCcw size={13} strokeWidth={2.25} /> Read it again
        </button>
      )}
    </figure>
  );
}

/* Top strip: the six seconds running out, then the verdict. */
function ReadStrip() {
  return (
    <div className="flex items-center gap-[2cqw] px-[5cqw] pt-[3.2cqw] pb-[2.4cqw] border-b border-border-DEFAULT font-sans">
      <span className="text-[max(10px,2.1cqw)] font-semibold text-ink-muted whitespace-nowrap">Recruiter&apos;s read</span>
      <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-surface-subtle">
        <span className="read-clock absolute inset-0 origin-left rounded-full bg-ink" />
      </span>
      <span className="tabular text-[max(10px,2.1cqw)] font-semibold text-ink whitespace-nowrap">6 sec</span>
    </div>
  );
}

function ResumeBody({ compact }: { compact?: boolean }) {
  return (
    <div className="resume-text text-ink text-[max(8px,1.82cqw)] leading-[1.38] pb-[5cqw]">
      {/* Heading, with the verdict in the margin */}
      <Row
        margin={
          <div className="read-verdict pt-[0.6cqw]" style={{ "--d": "5.5s" } as React.CSSProperties}>
            <span className="verdict text-danger text-[max(10px,2.5cqw)] border-[max(1.5px,0.35cqw)] -rotate-3">Reject</span>
            <span className="mt-[1.2cqw] block text-[max(8px,1.5cqw)] font-medium leading-snug text-ink-muted">
              {SAMPLE.role} · {SAMPLE.companyTier}
            </span>
          </div>
        }
        className="pt-[4cqw]"
      >
        <div className="text-center">
          <p className="text-[5.2cqw] font-bold leading-none tracking-[0.01em] [font-variant:small-caps]">Aarav Mehta</p>
          <p className="mt-[1.4cqw] text-[max(7px,1.5cqw)] max-sm:hidden">+91 98xxx xxxxx &nbsp;|&nbsp; aarav.mehta@example.com &nbsp;|&nbsp; github.com/aarav-sample</p>
        </div>
      </Row>

      <Row margin={<Note delay="1.1s" tone="seen">Good college. Noticed.</Note>} marginClassName="pt-[6.8cqw]">
        <Section title="Education">
          <Entry
            left={<Hl d="0.5s">National Institute of Technology</Hl>}
            right="2022 – 2026"
            subLeft={<>B.Tech, Computer Science · <Hl d="0.9s">CGPA 8.4</Hl></>}
            subRight="India"
          />
        </Section>
      </Row>

      <Row className={cn(compact && "max-lg:hidden")}>
        <Section title="Experience">
          <Entry left="Smart India Hackathon 2025" right="Sep 2025" subLeft="Team member, team of four" subRight="Campus round">
            <li>Built an attendance prototype in React with a Firebase backend</li>
          </Entry>
        </Section>
      </Row>

      <Row margin={<Note delay="2.7s">No deployed project. No link, no users.</Note>} marginClassName="pt-[6.8cqw]">
        <Section title="Projects">
          <div className="relative">
            <Entry left={<>Expense Tracker <span className="font-normal">| React, Firebase</span></>} right="Mar 2025">
              <li>CRUD app to add, edit and categorise expenses</li>
              <li>Coursework project; runs locally</li>
            </Entry>
            <Ring delay="2.1s" />
          </div>
          <Entry left={<>Library Management System <span className="font-normal">| Java, MySQL</span></>} right="Nov 2024">
            <li>Console app for issuing and returning books</li>
          </Entry>
        </Section>
      </Row>

      <Row margin={<Note delay="4.1s">No backend framework.</Note>} marginClassName="pt-[9.6cqw]">
        <Section title="Technical Skills">
          <ul className="space-y-[0.4cqw]">
            <li><b>Languages:</b> C++, Java, JavaScript, Python</li>
            <li>
              <span className="read-under" style={{ "--d": "3.9s" } as React.CSSProperties}>
                <b>Frameworks:</b> <Hl d="3.4s">React</Hl>
              </span>
            </li>
            <li><b>Developer tools:</b> Git, VS Code</li>
            <li><b>Problem solving:</b> <Hl d="4.6s">450+ problems on LeetCode</Hl></li>
          </ul>
        </Section>
      </Row>

      <Row>
        <p className="mt-[3cqw] font-sans text-[max(8px,1.45cqw)] text-ink-faint">Sample resume · not a real candidate</p>
      </Row>
    </div>
  );
}

/* One band of the page: the resume on the left, the reviewer's margin on the right. */
function Row({
  children,
  margin,
  className,
  marginClassName,
}: {
  children: React.ReactNode;
  margin?: React.ReactNode;
  className?: string;
  marginClassName?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_24%]", className)}>
      <div className="min-w-0 pl-[5cqw] pr-[3cqw]">{children}</div>
      <div className={cn("border-l border-border-DEFAULT pl-[2.4cqw] pr-[2cqw] font-sans", marginClassName)}>{margin}</div>
    </div>
  );
}

function Hl({ d, children }: { d: string; children: React.ReactNode }) {
  return (
    <span className="read-hl" style={{ "--d": d } as React.CSSProperties}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-[3cqw]">
      <h3 className="text-[2.3cqw] font-normal [font-variant:small-caps] tracking-[0.02em] border-b border-ink pb-[0.3cqw]">{title}</h3>
      <div className="mt-[1cqw] space-y-[1.4cqw]">{children}</div>
    </section>
  );
}

function Entry({
  left,
  right,
  subLeft,
  subRight,
  children,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  subLeft?: React.ReactNode;
  subRight?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between gap-[2cqw]">
        <span className="font-bold">{left}</span>
        <span className="whitespace-nowrap">{right}</span>
      </div>
      {subLeft && (
        <div className="flex justify-between gap-[2cqw] italic">
          <span>{subLeft}</span>
          <span className="whitespace-nowrap">{subRight}</span>
        </div>
      )}
      {children && <ul className="mt-[0.4cqw] list-disc pl-[3cqw] space-y-[0.2cqw]">{children}</ul>}
    </div>
  );
}

/* A red-pen ring drawn around an entry: a rounded box revealed left to right. */
function Ring({ delay }: { delay: string }) {
  return (
    <span
      className="read-ring pointer-events-none absolute -left-[1.8cqw] -top-[1cqw] h-[calc(100%+2cqw)] w-[calc(100%+3.6cqw)]"
      style={{ "--d": delay } as React.CSSProperties}
    />
  );
}

/* A note in the margin, joined to its line by a short rule. */
function Note({ delay, tone = "pen", children }: { delay: string; tone?: "pen" | "seen"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "read-note flex gap-[1cqw] text-[max(9px,1.75cqw)] font-semibold leading-[1.25]",
        tone === "pen" ? "text-danger" : "text-ink-muted"
      )}
      style={{ "--d": delay } as React.CSSProperties}
    >
      <span className={cn("mt-[0.8cqw] h-px w-[2cqw] shrink-0 -ml-[2.4cqw]", tone === "pen" ? "bg-danger" : "bg-ink-faint")} />
      <span>{children}</span>
    </p>
  );
}
