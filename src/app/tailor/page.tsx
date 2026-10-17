"use client";

import { useEffect, useRef, useState } from "react";
import { type AnalysisResult } from "@/types/analysis";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { DepartureBoard } from "@/components/brand/DepartureBoard";
import { Sheet, FigureStrip } from "@/components/ui/Sheet";
import { fieldClass } from "@/components/ui/Choice";
import { cn } from "@/lib/utils";
import {
  Download,
  ArrowLeft,
  PenLine,
  TrendingUp,
  AlertCircle,
  Check,
  Plus,
  Minus,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TailoredResume {
  name: string;
  phone: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  objective: string;
  education: { degree: string; institution: string; year: string; coursework: string }[];
  skills: { category: string; items: string }[];
  experience: { role: string; company: string; location: string; duration: string; bullets: string[] }[];
  projects: { name: string; description: string }[];
  activities: string[];
  changes: { type: "improved" | "added" | "removed" | "reordered"; section: string; description: string }[];
  keywordsAdded: string[];
  beforeAtsScore: number;
  afterAtsScore: number;
  topChange: string;
}

const CHANGE_META = {
  improved: { icon: <TrendingUp size={14} />, color: "text-primary-600" },
  added:    { icon: <Plus size={14} />,       color: "text-success" },
  removed:  { icon: <Minus size={14} />,      color: "text-danger" },
  reordered:{ icon: <RefreshCw size={14} />,  color: "text-warning" },
};

const TAILOR_STAGES = ["Reading your resume", "Rewriting bullets", "Adding ATS keywords", "Laying out your CV"];

// ─── Resume renderer (printable) ─────────────────────────────────────────────
function ResumePreview({ r }: { r: TailoredResume }) {
  return (
    <div
      id="resume-print-area"
      className="bg-white font-serif text-black"
      style={{ fontFamily: "'Times New Roman', serif", fontSize: "11pt", lineHeight: 1.4 }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 style={{ fontSize: "20pt", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>
          {r.name}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[#444]">
          {r.phone && <span className="flex items-center gap-1"><Phone size={10} />{r.phone}</span>}
          {r.location && <span className="flex items-center gap-1"><MapPin size={10} />{r.location}</span>}
          {r.email && <span className="flex items-center gap-1"><Mail size={10} />{r.email}</span>}
          {r.linkedin && <span className="flex items-center gap-1"><Link2 size={10} />{r.linkedin.replace("https://", "")}</span>}
          {r.github && <span className="flex items-center gap-1"><Link2 size={10} />{r.github.replace("https://", "")}</span>}
        </div>
      </div>

      {/* Objective */}
      {r.objective && (
        <Section title="OBJECTIVE">
          <p className="text-sm">{r.objective}</p>
        </Section>
      )}

      {/* Education */}
      {r.education?.length > 0 && (
        <Section title="EDUCATION">
          {r.education.map((ed, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold text-sm">{ed.degree}</span>
                <span className="text-sm text-[#555]">{ed.year}</span>
              </div>
              <p className="text-sm text-[#444]">{ed.institution}</p>
              {ed.coursework && (
                <p className="text-xs text-[#666] mt-0.5">Relevant Coursework: {ed.coursework}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {r.skills?.length > 0 && (
        <Section title="SKILLS">
          <table className="w-full text-sm">
            <tbody>
              {r.skills.map((s, i) => (
                <tr key={i}>
                  <td className="font-bold pr-6 pb-1 align-top whitespace-nowrap">{s.category}</td>
                  <td className="pb-1 text-[#333]">{s.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Experience */}
      {r.experience?.length > 0 && (
        <Section title="EXPERIENCE">
          {r.experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <span className="font-bold text-sm">{exp.role}</span>
                <span className="text-sm text-[#555]">{exp.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#444]">{exp.company}</span>
                <span className="text-sm italic text-[#555]">{exp.location}</span>
              </div>
              <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="text-sm text-[#333]">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {r.projects?.length > 0 && (
        <Section title="PROJECTS">
          <ul className="space-y-1.5">
            {r.projects.map((p, i) => (
              <li key={i} className="text-sm">
                <span className="font-bold">{p.name}. </span>
                <span className="text-[#333]">{p.description}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Activities */}
      {r.activities?.length > 0 && (
        <Section title="EXTRA-CURRICULAR ACTIVITIES">
          <ul className="list-disc list-outside ml-4 space-y-0.5">
            {r.activities.map((a, i) => <li key={i} className="text-sm text-[#333]">{a}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 style={{ fontSize: "11pt", fontWeight: 700, borderBottom: "1px solid #111", paddingBottom: "2px", marginBottom: "6px", letterSpacing: "0.08em" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TailorPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"paste" | "loading" | "result">("paste");
  const [tailorStage, setTailorStage] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("gapl_last_report");
    if (stored) {
      try { setAnalysis(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const runTailor = async () => {
    setStep("loading");
    setLoading(true);
    setError("");
    setTailorStage(0);
    const iv = setInterval(() => setTailorStage((n) => Math.min(n + 1, TAILOR_STAGES.length - 1)), 3500);
    try {
      const res = await authFetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          role: analysis?.role || "Software Engineer",
          tier: analysis?.companyTier || "Product Startup",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Tailoring failed."); setStep("paste"); return; }
      setResult(data.result);
      setStep("result");
    } catch {
      setError("Network error. Please try again.");
      setStep("paste");
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #resume-print-wrapper { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        #resume-print-area { padding: 0.5in; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  // Loading
  if (step === "loading") {
    return (
      <DepartureBoard
        kicker={`${analysis?.role ?? "Your role"} · ${analysis?.companyTier ?? "Your tier"}`}
        title="Tailoring your CV"
        detail={`${TAILOR_STAGES[tailorStage]}…`}
        stages={TAILOR_STAGES}
        current={tailorStage}
        footnote="Keep this tab open while your CV is tailored."
      />
    );
  }

  // Result
  if (step === "result" && result) {
    const improvement = result.afterAtsScore - result.beforeAtsScore;
    return (
      <>
        <Navbar />
        {/* Hidden print wrapper */}
        <div id="resume-print-wrapper" style={{ display: "none" }}>
          <div id="resume-print-area" style={{ padding: "0.5in", fontFamily: "'Times New Roman', serif" }}>
            <ResumePreview r={result} />
          </div>
        </div>

        <main className="pt-[59px] bg-surface-muted min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <button onClick={() => setStep("paste")} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink mb-2">
                  <ArrowLeft size={14} /> Re-tailor
                </button>
                <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Your tailored CV</h1>
                <p className="chart-data mt-1.5 text-xs text-ink-muted">
                  {analysis?.role} · {analysis?.companyTier}
                </p>
              </div>
              <Button size="md" onClick={downloadPDF}>
                <Download size={16} /> Download PDF
              </Button>
            </div>

            <Sheet title="ATS fit" aside="Estimated">
              <FigureStrip
                items={[
                  { label: "Before", value: result.beforeAtsScore, tone: "text-danger" },
                  { label: "After", value: result.afterAtsScore, tone: "text-success" },
                  { label: "Change", value: `${improvement >= 0 ? "+" : ""}${improvement}` },
                ]}
              />
              {result.topChange && (
                <div className="border-t border-border-DEFAULT px-4 sm:px-6 py-4 grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                  <PenLine size={16} className="mt-0.5 text-primary-600" />
                  <p className="text-[0.9375rem]">
                    <span className="font-bold">Biggest change: </span>
                    <span className="text-ink-secondary">{result.topChange}</span>
                  </p>
                </div>
              )}
            </Sheet>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Sheet
                title="Preview"
                aside={
                  <button onClick={downloadPDF} className="font-sans text-xs font-bold text-primary-600 hover:underline inline-flex items-center gap-1">
                    <Download size={13} /> PDF
                  </button>
                }
              >
                <div className="bg-surface-subtle p-3 sm:p-6 max-h-[760px] overflow-y-auto" ref={printRef}>
                  <div className="bg-white shadow-md mx-auto max-w-[800px] p-5 sm:p-8">
                    <ResumePreview r={result} />
                  </div>
                </div>
              </Sheet>

              <div className="space-y-5">
                <Sheet title="What changed" aside={`${result.changes.length}`}>
                  <ul className="chart-rows">
                    {result.changes.map((c, i) => (
                      <li key={i} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2.5 px-4 sm:px-5 py-3">
                        <span className={cn("mt-0.5", CHANGE_META[c.type].color)}>{CHANGE_META[c.type].icon}</span>
                        <div>
                          <p className={cn("chart-data text-[0.6875rem] font-bold uppercase", CHANGE_META[c.type].color)}>
                            {c.type} · {c.section}
                          </p>
                          <p className="mt-0.5 text-sm text-ink-secondary">{c.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Sheet>

                <Sheet title="Keywords added" aside={`${result.keywordsAdded.length}`}>
                  <ul className="px-4 sm:px-5 py-4 flex flex-wrap gap-2">
                    {result.keywordsAdded.map((kw) => (
                      <li key={kw} className="chart-data inline-flex items-center gap-1.5 rounded-[3px] border border-border-strong bg-surface-DEFAULT px-2 py-1 text-xs">
                        <span aria-hidden className="font-bold text-success">+</span>
                        {kw}
                      </li>
                    ))}
                  </ul>
                </Sheet>

                <div className="flex flex-col gap-2">
                  <Button size="lg" className="w-full" onClick={downloadPDF}>
                    <Download size={17} /> Download as PDF
                  </Button>
                  {analysis && (
                    <Link href={`/report/${analysis.id}`}>
                      <Button variant="outline" size="lg" className="w-full">
                        <ArrowLeft size={17} /> Back to report
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Print-only styles */}
        <style>{`
          @media print {
            body > *:not(#resume-print-wrapper) { display: none !important; }
            #resume-print-wrapper { display: block !important; }
            #resume-print-area { padding: 0.5in; }
            @page { margin: 0; size: A4; }
          }
        `}</style>
      </>
    );
  }

  // Paste screen
  return (
    <>
      <Navbar />
      <main className="pt-[59px] bg-surface-muted min-h-screen">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href={analysis ? `/report/${analysis.id}` : "/analyze"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink mb-4"
          >
            <ArrowLeft size={14} /> {analysis ? "Back to report" : "Run an analysis first"}
          </Link>
          <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">Tailor my CV</h1>
          <p className="mt-2 text-ink-secondary">
            Gapl rewrites your resume for <strong className="text-ink">{analysis?.companyTier ?? "your target"}</strong> companies
            {analysis?.role && <> applying for <strong className="text-ink">{analysis.role}</strong></>}. Preview it here, then
            download a PDF.
          </p>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2 p-3 bg-danger-bg border border-danger-border rounded-[5px]">
              <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <label htmlFor="tailor-resume" className="block mt-6 mb-2 text-[0.8125rem] font-bold text-ink-secondary">
            Paste your resume
          </label>
          <textarea
            id="tailor-resume"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume text…"
            rows={14}
            className={cn(fieldClass, "py-3 resize-y")}
          />

          <Sheet title="What you get" className="mt-5">
            <ul className="divide-y divide-border-DEFAULT">
              {[
                "Rewritten bullets with action verbs and quantified impact",
                "ATS keywords for your role and tier",
                "A live preview on this page",
                "One-click PDF download",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 px-4 sm:px-5 py-3 text-sm">
                  <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </Sheet>

          <Button size="lg" className="w-full mt-6" disabled={resumeText.trim().length < 100 || loading} onClick={runTailor}>
            <PenLine size={17} /> Tailor for {analysis?.companyTier ?? "my target"}
          </Button>
          <p className="mt-3 text-center text-sm text-ink-muted">Uses 1 analysis credit.</p>
        </div>
      </main>
    </>
  );
}
