"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { ResumePreview, type CVData } from "@/components/cv/ResumePreview";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { saveCV } from "@/lib/firebase";
import {
  Upload, FileText, ChevronRight, AlertCircle,
  Download, ArrowLeft, Sparkles, Target, ArrowUp, Check, CloudCheck,
} from "lucide-react";

const ROLES = ["SDE Intern", "SDE Full Time", "Frontend Engineer", "Backend Engineer",
  "Full Stack Engineer", "Data Engineer", "ML Engineer", "DevOps Engineer",
  "Product Manager", "Data Analyst"];

const SENIORITY = ["Intern", "Entry Level (0–1 yr)", "Junior (1–2 yrs)", "Mid Level (2–4 yrs)", "Senior (4+ yrs)"];

const COMPANY_TYPES = [
  { label: "Top Product (FAANG / Razorpay / Stripe)", value: "Top Product" },
  { label: "Product Startup (Series A–C)", value: "Product Startup" },
  { label: "Mass Recruiter (TCS / Infosys / Wipro)", value: "Mass Recruiter" },
];

const STAGES = [
  "Parsing your resume…",
  "Identifying keyword gaps…",
  "Injecting ATS keywords…",
  "Rewriting bullets for impact…",
  "Optimising for 90+ ATS score…",
  "Finalising your CV…",
];

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepDot({ n, current, label }: { n: number; current: number; label: string }) {
  const done = current > n;
  const active = current === n;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
        done ? "bg-[#111] border-[#111] text-white"
          : active ? "border-[#111] text-[#111] bg-white"
          : "border-[#d4d4d8] text-[#a1a1aa] bg-white"
      )}>
        {done ? <Check size={12} /> : n}
      </div>
      <span className={cn("text-[10px] font-medium hidden sm:block",
        active ? "text-[#111]" : "text-[#a1a1aa]")}>{label}</span>
    </div>
  );
}

export default function CVBuilderPage() {
  // Step: 1=target, 2=upload, 3=loading, 4=result
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loadingStage, setLoadingStage] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [seniority, setSeniority] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CVData | null>(null);

  const finalRole = role === "Other" ? customRole : role;
  const step1Valid = finalRole.trim() && seniority && companyType;
  const step2Valid = resumeFile !== null || resumeText.trim().length > 80;

  // Dropzone
  const onDrop = useCallback((accepted: File[], rejected: { file: File }[]) => {
    setFileError("");
    if (rejected.length > 0) { setFileError("Only PDF, DOC, DOCX, TXT files under 5 MB."); return; }
    if (accepted[0]) setResumeFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  // Submit
  const build = async () => {
    setStep(3);
    setError("");
    setLoadingStage(0);

    // Cycle loading stages
    let s = 0;
    const iv = setInterval(() => {
      s = Math.min(s + 1, STAGES.length - 1);
      setLoadingStage(s);
    }, 2800);

    try {
      // Extract text if file uploaded
      let text = resumeText;
      if (resumeFile) {
        const fd = new FormData();
        fd.append("resume", resumeFile);
        fd.append("role", finalRole);
        fd.append("tier", companyType);
        // Re-use analyze endpoint just to extract text (pass dummy prompt)
        // Instead: read as plain text for txt files, otherwise send to cv-builder directly
        if (resumeFile.type === "text/plain") {
          text = await resumeFile.text();
        } else {
          // For PDF/DOC — send file via FormData to cv-builder which handles extraction
          const res2 = await fetch("/api/cv-builder", {
            method: "POST",
            body: (() => {
              const f = new FormData();
              f.append("resumeFile", resumeFile);
              f.append("role", finalRole);
              f.append("seniority", seniority);
              f.append("companyType", companyType);
              f.append("companyName", companyName);
              if (jdText) f.append("jdText", jdText);
              return f;
            })(),
          });
          clearInterval(iv);
          const d2 = await res2.json();
          if (!res2.ok) { setError(d2.error || "Build failed."); setStep(2); return; }
          setResult(d2.result);
          setStep(4);
          return;
        }
      }

      const res = await fetch("/api/cv-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text, role: finalRole, seniority, companyType, companyName, jdText }),
      });
      clearInterval(iv);
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Build failed."); setStep(2); return; }
      setResult(d.result);
      setStep(4);
      // Save to Firestore
      if (user && d.result) {
        try {
          const ref = await saveCV(user.uid, {
            role: finalRole,
            seniority,
            companyType,
            companyName,
            atsScore: d.result.atsScore,
            originalAtsScore: d.result.originalAtsScore,
            name: d.result.name || "",
            cv: d.result,
          });
          setSavedId(ref.id);
        } catch (e) {
          console.warn("Could not save CV to Firestore:", e);
        }
      }
    } catch {
      clearInterval(iv);
      setError("Network error. Please try again.");
      setStep(2);
    }
  };

  const downloadPDF = () => window.print();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-14 bg-[#FAFAFA] flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <div className="relative w-16 h-16 mx-auto mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-[#4F46E5]/20 border-t-[#4F46E5]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target size={22} className="text-[#4F46E5]" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-[#111] mb-2">Building your 90+ ATS CV</h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-[#71717a]"
              >
                {STAGES[loadingStage]}
              </motion.p>
            </AnimatePresence>
            <div className="flex justify-center gap-1.5 mt-6">
              {STAGES.map((_, i) => (
                <div key={i} className={cn("h-1 rounded-full transition-all duration-500",
                  i <= loadingStage ? "w-6 bg-[#4F46E5]" : "w-2 bg-[#e4e4e7]")} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (step === 4 && result) {
    const improvement = result.atsScore - result.originalAtsScore;
    return (
      <>
        <Navbar />
        <main className="pt-14 bg-[#FAFAFA] min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#111] mb-3 transition-colors">
                  <ArrowLeft size={12} /> Rebuild
                </button>
                <h1 className="text-xl font-bold text-[#111]">Your Improved CV</h1>
                <p className="text-xs text-[#71717a] mt-0.5">{finalRole} · {companyType}</p>
                {savedId && (
                  <p className="text-xs text-[#16a34a] mt-1 flex items-center gap-1">
                    <CloudCheck size={11} /> Saved to your account
                  </p>
                )}
              </div>
              <Button variant="primary" size="sm" className="gap-1.5 print:hidden" onClick={downloadPDF}>
                <Download size={14} /> Download PDF
              </Button>
            </div>

            {/* Score banner */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "ATS Before", value: `${result.originalAtsScore}%`, color: "text-[#dc2626]" },
                { label: "ATS After", value: `${result.atsScore}%`, color: "text-[#16a34a]" },
                { label: "Improvement", value: `+${improvement}%`, color: "text-[#4F46E5]" },
                { label: "Bullets Rewritten", value: result.bulletsImproved, color: "text-[#111]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-[#e4e4e7] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-[#71717a] mb-1">{label}</p>
                  <span className={`text-xl font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Top win */}
            <div className="flex items-start gap-3 p-4 bg-[#eef2ff] rounded-xl border border-[#e0e7ff]">
              <Sparkles size={14} className="text-[#4F46E5] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#4338ca] mb-0.5">Biggest win</p>
                <p className="text-sm text-[#3f3f46]">{result.topWin}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Resume preview */}
              <div className="lg:col-span-2 bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e4e4e7]">
                  <p className="text-xs font-semibold text-[#111]">Resume Preview</p>
                  <button onClick={downloadPDF} className="text-xs text-[#71717a] hover:text-[#111] flex items-center gap-1 transition-colors">
                    <Download size={12} /> Download PDF
                  </button>
                </div>
                <div className="p-6 max-h-[700px] overflow-y-auto">
                  <ResumePreview cv={result} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Keywords */}
                <div className="bg-white border border-[#e4e4e7] rounded-2xl p-5">
                  <p className="text-xs font-semibold text-[#111] mb-3">Keywords injected ({result.keywordsInjected?.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywordsInjected?.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full text-xs text-[#16a34a] font-medium">
                        <ArrowUp size={8} />{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ATS tips */}
                <div className="bg-[#111] rounded-2xl p-5">
                  <p className="text-xs font-semibold text-white mb-3">ATS Score: {result.atsScore}%</p>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.atsScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-[#4F46E5]"
                    />
                  </div>
                  {[
                    "Action verbs on every bullet ✓",
                    "Quantified metrics injected ✓",
                    "ATS-standard section headings ✓",
                    "Keyword density optimised ✓",
                  ].map((tip) => (
                    <p key={tip} className="text-xs text-[#71717a] mb-1.5">{tip}</p>
                  ))}
                </div>

                <Button variant="primary" size="lg" className="w-full gap-2" onClick={downloadPDF}>
                  <Download size={16} /> Download as PDF
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Hidden print-only layer — rendered outside the clipped scroll container */}
        <div
          id="cv-print-target"
          style={{ display: "none" }}
          aria-hidden="true"
        >
          <ResumePreview cv={result} />
        </div>

        <style>{`
          @media print {
            /* Hide everything */
            body * { visibility: hidden; }
            /* Show only the resume */
            #cv-print-target, #cv-print-target * { visibility: visible; }
            #cv-print-target {
              display: block !important;
              position: fixed;
              inset: 0;
              padding: 0.5in;
              background: white;
              font-family: 'Times New Roman', serif;
            }
            @page { margin: 0; size: A4; }
          }
        `}</style>
      </>
    );
  }

  // ── Step 1 & 2 wizard ─────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="pt-14 bg-[#FAFAFA] min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-12">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <StepDot n={1} current={step} label="Target" />
            <div className="w-12 h-px bg-[#e4e4e7]" />
            <StepDot n={2} current={step} label="Resume" />
            <div className="w-12 h-px bg-[#e4e4e7]" />
            <StepDot n={3} current={step} label="Build" />
            <div className="w-12 h-px bg-[#e4e4e7]" />
            <StepDot n={4} current={step} label="Result" />
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Target ────────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold text-[#111] mb-1">What are you targeting?</h1>
                <p className="text-sm text-[#71717a] mb-8">Tell us your goal — we'll build your CV around it.</p>

                <div className="space-y-5">
                  {/* Role */}
                  <div>
                    <label className="text-xs font-semibold text-[#111] mb-2 block">Target Role</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {ROLES.map((r) => (
                        <button key={r} onClick={() => setRole(r)}
                          className={cn("px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all",
                            role === r ? "bg-[#111] text-white border-[#111]" : "bg-white border-[#e4e4e7] text-[#444] hover:border-[#111]")}>
                          {r}
                        </button>
                      ))}
                      <button onClick={() => setRole("Other")}
                        className={cn("px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all",
                          role === "Other" ? "bg-[#111] text-white border-[#111]" : "bg-white border-[#e4e4e7] text-[#444] hover:border-[#111]")}>
                        Other…
                      </button>
                    </div>
                    {role === "Other" && (
                      <input value={customRole} onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g. Embedded Systems Engineer"
                        className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-lg focus:outline-none focus:border-[#111]" />
                    )}
                  </div>

                  {/* Seniority */}
                  <div>
                    <label className="text-xs font-semibold text-[#111] mb-2 block">Experience Level</label>
                    <div className="flex flex-wrap gap-2">
                      {SENIORITY.map((s) => (
                        <button key={s} onClick={() => setSeniority(s)}
                          className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                            seniority === s ? "bg-[#111] text-white border-[#111]" : "bg-white border-[#e4e4e7] text-[#444] hover:border-[#111]")}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company type */}
                  <div>
                    <label className="text-xs font-semibold text-[#111] mb-2 block">Company Type</label>
                    <div className="space-y-2">
                      {COMPANY_TYPES.map((c) => (
                        <button key={c.value} onClick={() => setCompanyType(c.value)}
                          className={cn("w-full px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all",
                            companyType === c.value ? "bg-[#111] text-white border-[#111]" : "bg-white border-[#e4e4e7] text-[#444] hover:border-[#111]")}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional company name */}
                  <div>
                    <label className="text-xs font-semibold text-[#111] mb-2 block">Specific Company <span className="text-[#a1a1aa] font-normal">(optional)</span></label>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Zepto, Razorpay, Google"
                      className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-lg focus:outline-none focus:border-[#111]" />
                  </div>

                  {/* Optional JD */}
                  <div>
                    <label className="text-xs font-semibold text-[#111] mb-2 block">Job Description <span className="text-[#a1a1aa] font-normal">(optional but recommended)</span></label>
                    <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the job description for hyper-targeted keywords…"
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-xl focus:outline-none focus:border-[#111] resize-none" />
                  </div>

                  <Button size="lg" variant="primary" className="w-full gap-2" disabled={!step1Valid} onClick={() => setStep(2)}>
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Resume ────────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#111] mb-6 transition-colors">
                  <ArrowLeft size={12} /> Back
                </button>
                <h1 className="text-2xl font-bold text-[#111] mb-1">Upload your resume</h1>
                <p className="text-sm text-[#71717a] mb-2">
                  Targeting <strong className="text-[#111]">{finalRole}</strong> · <strong className="text-[#111]">{companyType}</strong>
                  {companyName && <> · <strong className="text-[#111]">{companyName}</strong></>}
                </p>
                <p className="text-xs text-[#4F46E5] font-medium mb-8">Goal: 90+ ATS Score</p>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl mb-4">
                    <AlertCircle size={14} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#dc2626]">{error}</p>
                  </div>
                )}

                {/* Toggle */}
                <div className="flex gap-1 bg-[#f4f4f5] rounded-xl p-1 mb-4">
                  {(["upload", "paste"] as const).map((m) => (
                    <button key={m} onClick={() => setInputMode(m)}
                      className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                        inputMode === m ? "bg-white text-[#111] shadow-sm" : "text-[#71717a]")}>
                      {m === "upload" ? "Upload File" : "Paste Text"}
                    </button>
                  ))}
                </div>

                {inputMode === "upload" ? (
                  <div>
                    <div {...getRootProps()} className={cn(
                      "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
                      isDragActive ? "border-[#4F46E5] bg-[#eef2ff]" : resumeFile ? "border-[#16a34a] bg-[#f0fdf4]" : "border-[#e4e4e7] hover:border-[#111] bg-white"
                    )}>
                      <input {...getInputProps()} />
                      {resumeFile ? (
                        <>
                          <FileText size={28} className="text-[#16a34a] mx-auto mb-3" />
                          <p className="text-sm font-semibold text-[#111]">{resumeFile.name}</p>
                          <p className="text-xs text-[#71717a] mt-1">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <Upload size={28} className="text-[#a1a1aa] mx-auto mb-3" />
                          <p className="text-sm font-medium text-[#111]">Drop your CV here</p>
                          <p className="text-xs text-[#71717a] mt-1">PDF, DOC, DOCX, TXT · max 5 MB</p>
                        </>
                      )}
                    </div>
                    {fileError && <p className="text-xs text-[#dc2626] mt-2">{fileError}</p>}
                  </div>
                ) : (
                  <div className="bg-white border border-[#e4e4e7] rounded-2xl p-1">
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-xs font-medium text-[#111] mb-1">Paste your resume text</p>
                    </div>
                    <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your full resume content here…"
                      rows={16}
                      className="w-full px-4 py-2 text-sm text-[#111] placeholder:text-[#a1a1aa] focus:outline-none resize-none" />
                  </div>
                )}

                <div className="mt-6">
                  <Button size="lg" variant="primary" className="w-full gap-2" disabled={!step2Valid} onClick={build}>
                    <Sparkles size={16} /> Build 90+ ATS CV
                  </Button>
                  <p className="text-center text-xs text-[#a1a1aa] mt-3">~20 seconds · AI-powered · No Overleaf needed</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
