"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { type AnalysisResult } from "@/types/analysis";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Download,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
  ArrowUp,
  Mail,
  Phone,
  MapPin,
  Link2,
} from "lucide-react";
import Link from "next/link";

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
  improved: { icon: <TrendingUp size={11} />, color: "bg-[#eef2ff] border-[#e0e7ff] text-[#4338ca]" },
  added:    { icon: <Plus size={11} />,       color: "bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]" },
  removed:  { icon: <Minus size={11} />,      color: "bg-[#fef2f2] border-[#fecaca] text-[#dc2626]" },
  reordered:{ icon: <RefreshCw size={11} />,  color: "bg-[#fefce8] border-[#fde68a] text-[#b45309]" },
};

// ─── Resume renderer (printable) ─────────────────────────────────────────────
function ResumePreview({ r }: { r: TailoredResume }) {
  return (
    <div
      id="resume-print-area"
      className="bg-white font-serif text-[#111111]"
      style={{ fontFamily: "'Times New Roman', serif", fontSize: "11pt", lineHeight: 1.4 }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-[#111111] pb-3 mb-4">
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
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"paste" | "loading" | "result">("paste");

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
    try {
      const res = await fetch("/api/tailor", {
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
      <>
        <Navbar />
        <div className="min-h-screen pt-14 bg-[#FAFAFA] flex items-center justify-center">
          <div className="text-center max-w-xs px-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 mx-auto mb-6 border-2 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full"
            />
            <h2 className="text-base font-bold text-[#111111] mb-1">Tailoring your CV…</h2>
            <p className="text-xs text-[#71717a]">
              Rewriting for <strong>{analysis?.companyTier ?? "your target"}</strong> · {analysis?.role ?? "your role"}. ~15 seconds.
            </p>
          </div>
        </div>
      </>
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

        <main className="pt-14 bg-[#FAFAFA] min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <button onClick={() => setStep("paste")} className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#111111] mb-3 transition-colors">
                  <ArrowLeft size={12} /> Re-tailor
                </button>
                <h1 className="text-xl font-bold text-[#111111]">Your Tailored CV</h1>
                <p className="text-xs text-[#71717a] mt-0.5">{analysis?.role} · {analysis?.companyTier}</p>
              </div>
              <Button variant="primary" size="sm" className="gap-1.5" onClick={downloadPDF}>
                <Download size={14} /> Download PDF
              </Button>
            </div>

            {/* ATS scores */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Before ATS", value: result.beforeAtsScore, color: "text-[#dc2626]" },
                { label: "After ATS",  value: result.afterAtsScore,  color: "text-[#16a34a]" },
                { label: "Improvement", value: `+${improvement}`, color: "text-[#4F46E5]", raw: true },
              ].map(({ label, value, color, raw }) => (
                <div key={label} className="bg-white border border-[#e4e4e7] rounded-xl p-4 text-center">
                  <p className="text-xs text-[#71717a] mb-1">{label}</p>
                  <span className={`text-2xl font-bold ${color}`}>{value}</span>
                  {!raw && <span className="text-sm text-[#71717a]">%</span>}
                </div>
              ))}
            </div>

            {/* Top change callout */}
            <div className="flex items-start gap-3 p-4 bg-[#eef2ff] rounded-xl border border-[#e0e7ff]">
              <Sparkles size={14} className="text-[#4F46E5] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#4338ca] mb-0.5">Biggest impact change</p>
                <p className="text-sm text-[#3f3f46]">{result.topChange}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Resume preview — 2/3 width */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e4e4e7]">
                    <p className="text-xs font-semibold text-[#111111]">Resume Preview</p>
                    <button onClick={downloadPDF} className="flex items-center gap-1 text-xs text-[#71717a] hover:text-[#111111] transition-colors">
                      <Download size={12} /> Download PDF
                    </button>
                  </div>
                  <div className="p-6 max-h-[700px] overflow-y-auto" ref={printRef}>
                    <ResumePreview r={result} />
                  </div>
                </div>
              </div>

              {/* Changes + keywords — 1/3 width */}
              <div className="space-y-4">
                {/* Changes */}
                <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#e4e4e7]">
                    <p className="text-xs font-semibold text-[#111111]">What changed</p>
                    <p className="text-[0.625rem] text-[#a1a1aa] mt-0.5">{result.changes.length} modifications</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.changes.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn("flex items-start gap-2 p-2.5 rounded-lg border", CHANGE_META[c.type].color)}
                      >
                        <div className="mt-0.5 flex-shrink-0">{CHANGE_META[c.type].icon}</div>
                        <div>
                          <span className="text-[0.625rem] font-semibold uppercase tracking-wider opacity-70">
                            {c.section} · {c.type}
                          </span>
                          <p className="text-xs mt-0.5 leading-relaxed">{c.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Keywords added */}
                <div className="bg-white border border-[#e4e4e7] rounded-2xl p-5">
                  <p className="text-xs font-semibold text-[#111111] mb-3">ATS keywords added</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordsAdded.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full text-xs font-medium text-[#16a34a]">
                        <ArrowUp size={9} /> {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button variant="primary" size="lg" className="w-full gap-2" onClick={downloadPDF}>
                    <Download size={16} /> Download as PDF
                  </Button>
                  {analysis && (
                    <Link href={`/report/${analysis.id}`}>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <ArrowLeft size={14} /> Back to Report
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
      <main className="pt-14 bg-[#FAFAFA] min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href={analysis ? `/report/${analysis.id}` : "/analyze"}
              className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#111111] mb-6 transition-colors"
            >
              <ArrowLeft size={12} /> Back to report
            </Link>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 bg-[#111111] rounded-md flex items-center justify-center">
                <Sparkles size={11} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#111111]">Tailor my CV</h1>
            </div>
            <p className="text-sm text-[#71717a] mb-8">
              AI rewrites your resume for{" "}
              <strong className="text-[#111111]">{analysis?.companyTier ?? "your target"}</strong>{" "}
              companies. Preview and download as PDF — no Overleaf needed.
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl mb-4">
                <AlertCircle size={14} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#dc2626]">{error}</p>
              </div>
            )}

            <div className="bg-white border border-[#e4e4e7] rounded-2xl p-1 mb-4">
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-medium text-[#111111] mb-2">Paste your resume</p>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here…"
                rows={14}
                className="w-full px-4 py-2 text-sm text-[#111111] placeholder:text-[#a1a1aa] focus:outline-none resize-none bg-transparent"
              />
            </div>

            <div className="p-4 bg-[#f4f4f5] rounded-xl border border-[#e4e4e7] mb-6">
              <p className="text-xs font-semibold text-[#111111] mb-2">What you get</p>
              <ul className="space-y-1.5">
                {[
                  "Rewritten bullets — action verbs + quantified impact",
                  "ATS keywords injected for your role and tier",
                  "Live resume preview on this page",
                  "One-click PDF download — no external tools",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#71717a]">
                    <ChevronRight size={11} className="text-[#4F46E5] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              size="lg"
              variant="primary"
              className="w-full gap-2"
              disabled={resumeText.trim().length < 100 || loading}
              onClick={runTailor}
            >
              <Sparkles size={16} />
              Tailor for {analysis?.companyTier ?? "target company"}
            </Button>
            <p className="text-center text-xs text-[#a1a1aa] mt-3">~15 seconds · Uses 1 analysis credit</p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
