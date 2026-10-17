"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { StepRoute } from "@/components/brand/StepRoute";
import { DepartureBoard } from "@/components/brand/DepartureBoard";
import { OptionList, ChipGroup, FieldLabel, fieldClass } from "@/components/ui/Choice";
import { Sheet, FigureStrip } from "@/components/ui/Sheet";
import { ResumePreview, type CVData } from "@/components/cv/ResumePreview";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { saveCV } from "@/lib/firebase";
import { authFetch } from "@/lib/auth-fetch";
import {
  Upload, FileText, ChevronRight, AlertCircle,
  Download, ArrowLeft, PenLine, Check, CloudCheck, Mail, ClipboardPaste,
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
  "Parsing your resume",
  "Finding keyword gaps",
  "Adding ATS keywords",
  "Rewriting bullets for impact",
  "Checking ATS fit",
  "Finalising your CV",
];

export default function CVBuilderPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loadingStage, setLoadingStage] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);

  const emailCV = async () => {
    if (!result) return;
    setEmailing(true);
    try {
      const res = await authFetch("/api/cv-builder/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: result }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to send email");
      }
      const remaining: number = json.remaining ?? 0;
      const total: number = json.total ?? 3;
      import("react-hot-toast").then(({ default: toast }) => {
        toast.success(
          remaining > 0
            ? `CV emailed! ${remaining} of ${total} sends remaining (resets in 8 h)`
            : `CV emailed! You've used all ${total} sends — resets in 8 hours`
        );
      });
    } catch (err: any) {
      import("react-hot-toast").then(({ default: toast }) => {
        toast.error(err.message || "Failed to send email");
      });
    } finally {
      setEmailing(false);
    }
  };

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
    if (rejected.length > 0) { setFileError("Only PDF and TXT files under 5 MB. Paste DOCX content directly."); return; }
    if (accepted[0]) setResumeFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
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
          // Send PDF files to the server for text extraction.
          const res2 = await authFetch("/api/cv-builder", {
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

      const res = await authFetch("/api/cv-builder", {
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

  const stepIndex = step - 1;
  const STEP_LABELS = ["Target", "Resume", "Build", "Result"];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <DepartureBoard
        kicker={`${finalRole} · ${companyType}`}
        title="Building your CV"
        detail={`${STAGES[loadingStage]}…`}
        stages={STAGES}
        current={loadingStage}
        footnote="Keep this tab open while your CV is built."
      />
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (step === 4 && result) {
    const improvement = result.atsScore - result.originalAtsScore;
    return (
      <>
        <div className="print:hidden">
          <Navbar />
        </div>
        <main className="pt-[59px] bg-surface-muted min-h-screen print:hidden">
          <StepRoute steps={STEP_LABELS} current={stepIndex} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 text-sm">
                  <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 font-medium text-ink-muted hover:text-ink">
                    <ArrowLeft size={14} /> Rebuild
                  </button>
                  <span aria-hidden className="text-border-strong">|</span>
                  <Link href="/dashboard/my-cvs" className="font-medium text-ink-muted hover:text-ink">
                    My CVs
                  </Link>
                </div>
                <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Your improved CV</h1>
                <p className="chart-data mt-1.5 text-xs text-ink-muted">
                  {finalRole} · {companyType}
                  {savedId && (
                    <span className="ml-2 inline-flex items-center gap-1 text-success">
                      <CloudCheck size={12} /> Saved to your account
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="md" onClick={emailCV} disabled={emailing} loading={emailing}>
                  {!emailing && <Mail size={16} />} {emailing ? "Sending" : "Email me this"}
                </Button>
                <Button size="md" onClick={downloadPDF}>
                  <Download size={16} /> Download PDF
                </Button>
              </div>
            </div>

            <Sheet title="ATS fit" aside="Estimated">
              <FigureStrip
                items={[
                  { label: "Before", value: result.originalAtsScore, tone: "text-danger" },
                  { label: "After", value: result.atsScore, tone: "text-success" },
                  { label: "Change", value: `${improvement >= 0 ? "+" : ""}${improvement}` },
                  { label: "Bullets rewritten", value: result.bulletsImproved },
                ]}
              />
              {result.topWin && (
                <div className="border-t border-border-DEFAULT px-4 sm:px-6 py-4 grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                  <PenLine size={16} className="mt-0.5 text-primary-600" />
                  <p className="text-[0.9375rem]">
                    <span className="font-bold">Biggest win: </span>
                    <span className="text-ink-secondary">{result.topWin}</span>
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
                <div className="bg-surface-subtle p-3 sm:p-6 max-h-[760px] overflow-y-auto">
                  <div className="bg-white shadow-md mx-auto max-w-[800px] p-5 sm:p-8">
                    <ResumePreview cv={result} />
                  </div>
                </div>
              </Sheet>

              <div className="space-y-5">
                <Sheet title="Keywords added" aside={`${result.keywordsInjected?.length ?? 0}`}>
                  <ul className="px-4 sm:px-6 py-4 flex flex-wrap gap-2">
                    {result.keywordsInjected?.map((kw) => (
                      <li key={kw} className="chart-data inline-flex items-center gap-1.5 rounded-[3px] border border-border-strong bg-surface-DEFAULT px-2 py-1 text-xs">
                        <span aria-hidden className="font-bold text-success">+</span>
                        {kw}
                      </li>
                    ))}
                  </ul>
                </Sheet>

                <Sheet title="What changed">
                  <ul className="divide-y divide-border-DEFAULT">
                    {[
                      "Action verbs on every bullet",
                      "Quantified metrics added",
                      "ATS-standard section headings",
                      "Keyword density tuned",
                    ].map((tip) => (
                      <li key={tip} className="flex items-center gap-2.5 px-4 sm:px-6 py-3 text-sm">
                        <Check size={15} strokeWidth={3} className="text-success shrink-0" /> {tip}
                      </li>
                    ))}
                  </ul>
                </Sheet>

                <div className="flex flex-col gap-2">
                  <Button size="lg" className="w-full" onClick={downloadPDF}>
                    <Download size={17} /> Download as PDF
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={emailCV} disabled={emailing} loading={emailing}>
                    {!emailing && <Mail size={17} />} {emailing ? "Sending" : "Email me this"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Hidden print-only layer — rendered outside the clipped scroll container */}
        <div id="cv-print-target" style={{ display: "none" }} aria-hidden="true">
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

  const stepMotion = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  };

  // ── Step 1 & 2 wizard ─────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="pt-[59px] bg-surface-muted min-h-screen">
        <StepRoute steps={STEP_LABELS} current={stepIndex} />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...stepMotion}>
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink mb-4">
                  <ArrowLeft size={14} /> Dashboard
                </Link>
                <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">What are you targeting?</h1>
                <p className="mt-2 text-ink-secondary">Tell Gapl your goal and it builds your CV around it.</p>

                <div className="mt-8 space-y-7">
                  <div>
                    <FieldLabel>Target role</FieldLabel>
                    <ChipGroup
                      name="Target role"
                      value={role}
                      onChange={setRole}
                      options={[...ROLES.map((r) => ({ value: r, label: r })), { value: "Other", label: "Other…" }]}
                    />
                    {role === "Other" && (
                      <input
                        aria-label="Your role"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g. Embedded Systems Engineer"
                        className={cn(fieldClass, "mt-3 h-11")}
                      />
                    )}
                  </div>

                  <div>
                    <FieldLabel>Experience level</FieldLabel>
                    <ChipGroup name="Experience level" value={seniority} onChange={setSeniority} options={SENIORITY.map((x) => ({ value: x, label: x }))} />
                  </div>

                  <div>
                    <FieldLabel>Company type</FieldLabel>
                    <OptionList name="Company type" value={companyType} onChange={setCompanyType} options={COMPANY_TYPES.map((c) => ({ value: c.value, label: c.label }))} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="cv-company" optional>
                      Specific company
                    </FieldLabel>
                    <input
                      id="cv-company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Zepto, Razorpay, Google"
                      className={cn(fieldClass, "h-11")}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="cv-jd" optional>
                      Job description
                    </FieldLabel>
                    <textarea
                      id="cv-jd"
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the job description for sharper keywords…"
                      rows={4}
                      className={cn(fieldClass, "py-2.5 resize-y")}
                    />
                  </div>

                  <Button size="lg" className="w-full" disabled={!step1Valid} onClick={() => setStep(2)}>
                    Continue <ChevronRight size={17} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" {...stepMotion}>
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink mb-4">
                  <ArrowLeft size={14} /> Back
                </button>
                <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">Upload your resume</h1>
                <p className="mt-2 text-ink-secondary">
                  {finalRole} · {companyType}
                  {companyName && <> · {companyName}</>}
                </p>

                {error && (
                  <div role="alert" className="mt-5 flex items-start gap-2 p-3 bg-danger-bg border border-danger-border rounded-[5px]">
                    <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}

                <div role="tablist" aria-label="Resume input" className="mt-6 grid grid-cols-2 rounded-[6px] bg-surface-subtle p-1">
                  {(["upload", "paste"] as const).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={inputMode === m}
                      onClick={() => setInputMode(m)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 h-10 rounded-[4px] text-sm font-semibold",
                        inputMode === m ? "bg-surface-DEFAULT text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                      )}
                    >
                      {m === "upload" ? <Upload size={15} /> : <ClipboardPaste size={15} />}
                      {m === "upload" ? "Upload file" : "Paste text"}
                    </button>
                  ))}
                </div>

                {inputMode === "upload" ? (
                  <div className="mt-3">
                    <div
                      {...getRootProps()}
                      className={cn(
                        "rounded-[6px] border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
                        isDragActive
                          ? "border-primary-600 bg-primary-50"
                          : resumeFile
                          ? "border-success bg-success-bg"
                          : "border-border-strong bg-surface-DEFAULT hover:border-ink"
                      )}
                    >
                      <input {...getInputProps()} />
                      {resumeFile ? (
                        <>
                          <FileText size={28} className="text-success mx-auto" />
                          <p className="mt-3 font-bold break-all">{resumeFile.name}</p>
                          <p className="mt-1 text-sm text-ink-muted">Tap to replace</p>
                        </>
                      ) : (
                        <>
                          <Upload size={28} className="text-ink-muted mx-auto" />
                          <p className="mt-3 font-bold">{isDragActive ? "Drop it here" : "Drop your CV here, or tap to choose"}</p>
                          <p className="mt-1 text-sm text-ink-muted">PDF or TXT, up to 5 MB</p>
                        </>
                      )}
                    </div>
                    {fileError && (
                      <p role="alert" className="mt-2 text-sm text-danger">
                        {fileError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <label htmlFor="cv-resume-text" className="sr-only">Resume text</label>
                    <textarea
                      id="cv-resume-text"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your full resume…"
                      rows={14}
                      className={cn(fieldClass, "py-3 resize-y")}
                    />
                  </div>
                )}

                <Button size="lg" className="w-full mt-6" disabled={!step2Valid} onClick={build}>
                  <PenLine size={17} /> Build my CV
                </Button>
                <p className="mt-3 text-center text-sm text-ink-muted">PDF or text in, a print-ready CV out.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
