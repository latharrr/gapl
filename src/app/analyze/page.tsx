"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/Button";
import { ANALYSIS_STAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { creditBalance } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/auth-fetch";
import {
  Upload,
  FileText,
  ChevronRight,
  AlertCircle,
  ClipboardPaste,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { StepRoute } from "@/components/brand/StepRoute";
import { ReadingScreen } from "@/components/brand/ReadingScreen";
import { OptionList } from "@/components/ui/Choice";
import { ROLES, TIERS } from "@/lib/targets";
import { clearHandedOffResume, peekHandedOffResume } from "@/lib/resume-handoff";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);
const DRAFT_KEY = "gapl_analyze_draft";
const MAX_DRAFT_RESUME_LENGTH = 50_000;

// Wizard answers kept across the sign-in redirect, so the visitor does not redo the wizard.
interface AnalyzeDraft {
  role: string;
  tier: string;
  jdText: string;
  resumeText: string;
  fileName: string;
}

function readDraft(): AnalyzeDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<AnalyzeDraft>;
    if (!draft.role || !draft.tier || !draft.resumeText) return null;
    return {
      role: String(draft.role),
      tier: String(draft.tier),
      jdText: String(draft.jdText || ""),
      resumeText: String(draft.resumeText),
      fileName: String(draft.fileName || ""),
    };
  } catch {
    return null;
  }
}

function validDraft(draft: AnalyzeDraft | null): AnalyzeDraft | null {
  if (!draft || !ROLES.includes(draft.role) || !TIERS.some((t) => t.label === draft.tier)) return null;
  return draft;
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

type Stage = "role" | "tier" | "resume" | "jd" | "loading";

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeFlow />
    </Suspense>
  );
}

function AnalyzeFlow() {
  const { user, userDoc } = useAuth();
  // Prefill from the landing hero (/analyze?role=…&tier=…) and skip the answered steps.
  const searchParams = useSearchParams();
  const paramRole = searchParams.get("role") ?? "";
  const paramTier = searchParams.get("tier") ?? "";
  // A draft saved at the sign-in gate takes precedence. This component only renders on the
  // client (useSearchParams inside Suspense), so sessionStorage is readable on first render.
  const [draft] = useState(() =>
    typeof window === "undefined" ? null : validDraft(readDraft())
  );
  const initialRole = draft?.role ?? (ROLES.includes(paramRole) ? paramRole : "");
  const initialTier = draft?.tier ?? (TIERS.some((t) => t.label === paramTier) ? paramTier : "");
  const [stage, setStage] = useState<Stage>(
    draft ? "jd" : initialRole && initialTier ? "resume" : initialRole ? "tier" : "role"
  );
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [selectedTier, setSelectedTier] = useState(initialTier);
  // A PDF dropped on the landing page arrives here already chosen.
  const [resumeFile, setResumeFile] = useState<File | null>(() => (draft ? null : peekHandedOffResume()));
  const [resumeText, setResumeText] = useState(draft?.resumeText ?? "");
  const [showPaste, setShowPaste] = useState(Boolean(draft));
  const [fileError, setFileError] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [jdText, setJdText] = useState(draft?.jdText ?? "");
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingError, setLoadingError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validatedText, setValidatedText] = useState(draft?.resumeText ?? "");
  const [showSignInGate, setShowSignInGate] = useState(false);
  const [restoredFileName, setRestoredFileName] = useState(draft?.fileName ?? "");
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clearHandedOffResume();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const credits = creditBalance(userDoc ?? {});
  const usageLabel = `${credits} credit${credits === 1 ? "" : "s"} left`;

  const onResumeDrop = useCallback((acceptedFiles: File[], rejectedFiles: { file: File }[]) => {
    setFileError("");
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0].file;
      const ext = rejected.name.slice(rejected.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        setFileError(
          `"${rejected.name}" is not supported. Upload a PDF or TXT resume, or paste the text directly.`
        );
      } else {
        setFileError("File rejected. Upload a PDF or TXT file under 5 MB.");
      }
      return;
    }
    if (acceptedFiles[0]) {
      // Basic filename/extension sanity check
      const file = acceptedFiles[0];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        setFileError(`Only PDF and TXT files are accepted. "${ext}" is not supported.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File is too large. Maximum size is 5 MB.");
        return;
      }
      setResumeFile(file);
      setShowPaste(false);
      setResumeText("");
      setValidatedText("");
      setRestoredFileName("");
      import("@/lib/analytics").then(({ trackEvent }) => trackEvent("resume_uploaded"));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: onResumeDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const hasResume = resumeFile !== null || resumeText.trim().length > 50;

  const handleContinueToJD = async () => {
    setFileError("");
    setPasteError("");

    if (!resumeFile && !resumeText.trim()) {
      setFileError("Please upload your resume or paste the text.");
      return;
    }

    setValidating(true);
    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else {
        formData.append("resumeText", resumeText.trim());
      }

      // Validation does no AI work, so it runs before sign-in.
      const res = await fetch("/api/analyze/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (resumeFile) {
          setFileError(data.error || "Invalid resume content.");
        } else {
          setPasteError(data.error || "Invalid resume content.");
        }
        return;
      }

      setValidatedText(typeof data.resumeText === "string" ? data.resumeText : "");
      setStage("jd");
    } catch (err) {
      console.error("Resume validation failed:", err);
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      const errMsg = offline
        ? "You appear to be offline. Check your connection and try again."
        : "Something went wrong while checking your resume. Please try again.";
      if (resumeFile) {
        setFileError(errMsg);
      } else {
        setPasteError(errMsg);
      }
    } finally {
      setValidating(false);
    }
  };

  const saveDraft = () => {
    const text = (validatedText || resumeText).trim();
    if (!text || text.length > MAX_DRAFT_RESUME_LENGTH) return;
    try {
      const draft: AnalyzeDraft = {
        role: selectedRole,
        tier: selectedTier,
        jdText,
        resumeText: text,
        fileName: resumeFile?.name || restoredFileName,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage full or blocked; the visitor re-enters the wizard after signing in.
    }
  };

  const runAnalysis = async () => {
    if (!user) {
      saveDraft();
      setShowSignInGate(true);
      return;
    }

    // Server-side quota enforcement happens inside /api/analyze.
    setStage("loading");
    setLoadingError("");
    setLoadingStep(0);

    import("@/lib/analytics").then(({ trackEvent }) => {
      trackEvent("analysis_started");
      if (!jdText.trim()) {
        trackEvent("jd_skipped");
      }
    });

    // Animate loading steps while API call runs
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step < ANALYSIS_STAGES.length) {
        setLoadingStep(step);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 2500);
    try {
      const formData = new FormData();
      formData.append("role", selectedRole);
      formData.append("tier", selectedTier);
      if (jdText.trim()) {
        formData.append("jdText", jdText.trim());
        import("@/lib/analytics").then(({ trackEvent }) => trackEvent("jd_uploaded"));
      }
      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else if (resumeText.trim()) {
        formData.append("resumeText", resumeText.trim());
      }

      const response = await authFetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoadingStep(ANALYSIS_STAGES.length);

      const data = await response.json();

      if (response.status === 403 || data.code === "LIMIT_REACHED") {
        setShowPaywall(true);
        setStage("resume");
        return;
      }

      if (!response.ok) {
        import("@/lib/analytics").then(({ trackEvent }) => trackEvent("analysis_failed"));
        setLoadingError(data.error || "Analysis failed. Please try again.");
        setStage("resume");
        return;
      }

      import("@/lib/analytics").then(({ trackEvent }) => trackEvent("analysis_completed"));
      clearDraft();

      const reportId = data.result.id;

      // Store result for immediate report rendering before Firestore catches up.
      sessionStorage.setItem("gapl_last_report", JSON.stringify(data.result));
      sessionStorage.setItem("gapl_report_id", reportId);

      // Brief pause before redirect for UX
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/report/${reportId}`);
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current);
      import("@/lib/analytics").then(({ trackEvent }) => trackEvent("analysis_failed"));
      setLoadingError("Network error. Please check your connection and try again.");
      setStage("resume");
    }
  };

  const steps = [
    { key: "role", label: "Role" },
    { key: "tier", label: "Tier" },
    { key: "resume", label: "Resume" },
    { key: "jd", label: "Job description" },
  ];
  const stageOrder: Stage[] = ["role", "tier", "resume", "jd", "loading"];
  const currentIndex = stageOrder.indexOf(stage);
  const remaining = credits;

  if (stage === "loading") {
    return <LoadingScreen loadingStep={loadingStep} role={selectedRole} tier={selectedTier} />;
  }

  const stepMotion = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <div className="min-h-screen on-desk flex flex-col">
      {/* Rail bar */}
      <header className="on-desk border-b border-desk-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link href={user ? "/dashboard" : "/"} aria-label="Gapl home">
            <Wordmark size="sm" />
          </Link>
          <span className="text-sm font-medium text-desk-muted">New analysis</span>
          {user && (
            <span
              className={cn(
                "ml-auto tabular text-xs font-medium",
                remaining === 0 ? "text-danger-on-desk" : "text-desk-muted"
              )}
              title="Each analysis uses 1 credit"
            >
              {usageLabel}
            </span>
          )}
        </div>
      </header>


      {/* Sign-in gate: the read is free, but it is saved to an account */}
      {showSignInGate && !user && (
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-8">
          <div className="sheet rounded-[10px] overflow-hidden">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-[-0.015em]">One step left: sign in to see your read</h2>
              <p className="mt-2 text-[0.9375rem] text-ink-secondary">
                Your first analysis is free, no card needed. Your report is saved to your account so you can come back
                to the roadmap. Your answers are kept, so you won&apos;t have to start over.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Link href={`/auth/signup?next=${encodeURIComponent("/analyze")}`} className="sm:flex-1">
                  <Button size="lg" className="w-full">Create free account</Button>
                </Link>
                <Link href={`/auth/login?next=${encodeURIComponent("/analyze")}`} className="sm:flex-1">
                  <Button variant="outline" size="lg" className="w-full">I have an account</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall */}
      {showPaywall && (
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-8">
          <div className="sheet rounded-[10px] overflow-hidden">
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-[-0.015em]">You&apos;re out of credits</h2>
              <p className="mt-2 text-[0.9375rem] text-ink-secondary">
                Each analysis uses one credit. Packs start at ₹99 for 4 credits, paid once, and credits never expire.
                Your answers are kept, so you won&apos;t have to start over.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Link href="/dashboard/billing" className="sm:flex-1">
                  <Button size="lg" className="w-full">Buy credits</Button>
                </Link>
                <Button variant="outline" size="lg" onClick={() => setShowPaywall(false)}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {loadingError && (
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-8" role="alert">
          <div className="sheet rounded-[10px] overflow-hidden">
            <div className="px-5 py-3 bg-danger-bg border-b border-danger-border flex items-center gap-2 text-danger">
              <AlertCircle size={17} />
              <h3 className="text-sm font-bold">The analysis was interrupted</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[0.9375rem] text-ink">{loadingError}</p>
              <div>
                <p className="text-sm font-bold">Before you retry</p>
                <ul className="mt-1.5 text-sm text-ink-secondary space-y-1">
                  <li>— Check your internet connection.</li>
                  <li>— Make sure your PDF has selectable text, not a scanned image.</li>
                  <li>— Keep clear sections: Skills, Projects, Education.</li>
                  <li>— If the upload keeps failing, paste the text instead.</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setLoadingError("");
                    setStage("resume");
                  }}
                >
                  Change resume
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setLoadingError("");
                    runAnalysis();
                  }}
                >
                  Retry analysis
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-3 sm:px-6 py-6 sm:py-12">
        <div className="page w-full max-w-2xl mx-auto rounded-[10px] overflow-hidden">
          <StepRoute steps={steps.map((st) => st.label)} current={currentIndex} />
          <div className="px-5 sm:px-12 py-8 sm:py-11">
          <AnimatePresence mode="wait">
            {stage === "role" && (
              <motion.div key="role" {...stepMotion}>
                <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">What role are you applying for?</h1>
                <p className="mt-2 text-ink-secondary">This decides what a recruiter looks for in your resume.</p>
                <OptionList
                  className="mt-6"
                  name="role"
                  value={selectedRole}
                  onChange={setSelectedRole}
                  options={ROLES.map((r) => ({ value: r, label: r }))}
                />
                <Button className="w-full mt-6" size="lg" disabled={!selectedRole} onClick={() => setStage("tier")}>
                  Continue <ChevronRight size={17} />
                </Button>
              </motion.div>
            )}

            {stage === "tier" && (
              <motion.div key="tier" {...stepMotion}>
                <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">Which companies are you targeting?</h1>
                <p className="mt-2 text-ink-secondary">The bar for a {selectedRole || "candidate"} is very different across tiers.</p>
                <OptionList
                  className="mt-6"
                  name="tier"
                  value={selectedTier}
                  onChange={setSelectedTier}
                  options={TIERS.map((t) => ({ value: t.label, label: t.label, hint: t.description }))}
                />
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" size="lg" onClick={() => setStage("role")}>Back</Button>
                  <Button size="lg" disabled={!selectedTier} onClick={() => setStage("resume")} className="flex-1">
                    Continue <ChevronRight size={17} />
                  </Button>
                </div>
              </motion.div>
            )}

            {stage === "resume" && (
              <motion.div key="resume" {...stepMotion}>
                <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">Upload your resume</h1>
                <p className="mt-2 text-ink-secondary">
                  {selectedRole} · {selectedTier}. PDF or TXT; for DOCX, paste the text.
                </p>

                {fileError && (
                  <div role="alert" className="mt-5 flex items-start gap-2 p-3 bg-danger-bg border border-danger-border rounded-[8px]">
                    <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-sm text-danger leading-relaxed">{fileError}</p>
                  </div>
                )}

                {!showPaste && (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "mt-6 rounded-[12px] border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-ink bg-highlight-soft"
                        : resumeFile
                        ? "border-solid border-ink bg-highlight-soft/50"
                        : "border-border-strong bg-surface-DEFAULT hover:border-ink"
                    )}
                  >
                    <input {...getInputProps()} />
                    {resumeFile ? (
                      <div>
                        <FileText size={28} className="mx-auto text-ink" />
                        <p className="mt-3 font-semibold break-all">{resumeFile.name}</p>
                        <p className="figure mt-1 text-xs text-ink-muted">
                          {(resumeFile.size / 1024).toFixed(0)} KB · tap to replace
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} className="mx-auto text-ink-muted" />
                        <p className="mt-3 font-semibold">{isDragActive ? "Drop it here" : "Drag your resume here"}</p>
                        <p className="mt-1 text-sm text-ink-muted">PDF or TXT, up to 5 MB</p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            open();
                          }}
                        >
                          Choose file
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowPaste(!showPaste);
                    setResumeFile(null);
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary-700 hover:text-primary-900"
                >
                  <ClipboardPaste size={15} />
                  {showPaste ? "Upload a file instead" : "Paste resume text instead"}
                </button>

                {showPaste && (
                  <div className="mt-2">
                    <label htmlFor="resume-text" className="sr-only">Resume text</label>
                    <textarea
                      id="resume-text"
                      value={resumeText}
                      onChange={(e) => {
                        setResumeText(e.target.value);
                        setValidatedText("");
                        setRestoredFileName("");
                        setPasteError("");
                      }}
                      placeholder="Paste your full resume: Education, Skills, Experience, Projects…"
                      rows={12}
                      className={cn(
                        "w-full px-4 py-3 rounded-[10px] border bg-surface-DEFAULT text-[0.9375rem] text-ink focus:outline-none focus:ring-[3px] focus:ring-primary-600/20 focus:border-primary-600 resize-y",
                        pasteError ? "border-danger" : "border-border-strong"
                      )}
                    />
                    {pasteError && (
                      <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-danger">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        {pasteError}
                      </p>
                    )}
                  </div>
                )}

                <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted">
                  <Shield size={15} className="mt-0.5 shrink-0" />
                  Your resume is processed for analysis and is not stored. Only the generated report is saved.
                </p>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" size="lg" onClick={() => setStage("tier")}>Back</Button>
                  <Button
                    size="lg"
                    onClick={handleContinueToJD}
                    className="flex-1"
                    disabled={!hasResume || validating}
                    loading={validating}
                  >
                    {validating ? "Checking resume" : "Continue"} {!validating && <ChevronRight size={17} />}
                  </Button>
                </div>
              </motion.div>
            )}

            {stage === "jd" && (
              <motion.div key="jd" {...stepMotion}>
                {restoredFileName && (
                  <p className="mb-4 flex items-start gap-2 text-sm text-success">
                    <FileText size={15} className="mt-0.5 shrink-0" />
                    Picked up where you left off with {restoredFileName}.
                  </p>
                )}
                <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)]">Add a job description</h1>
                <p className="mt-2 text-ink-secondary">
                  Optional, but it sharpens the gap analysis. Skip it to use defaults for {selectedRole || "your role"}.
                </p>
                <label htmlFor="jd-text" className="sr-only">Job description</label>
                <textarea
                  id="jd-text"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description…"
                  rows={9}
                  className="mt-5 w-full px-4 py-3 rounded-[10px] border border-border-strong bg-surface-DEFAULT text-[0.9375rem] text-ink focus:outline-none focus:ring-[3px] focus:ring-primary-600/20 focus:border-primary-600 resize-y"
                />
                <div className="flex gap-2 mt-5">
                  <Button variant="outline" size="lg" onClick={() => setStage("resume")}>Back</Button>
                  <Button size="lg" onClick={runAnalysis} className="flex-1">
                    {jdText.trim() ? "Read my resume" : "Skip and read my resume"} <ChevronRight size={17} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGE_DETAILS = [
  "Extracting skills, project complexity and experience",
  "Matching keywords and finding missing requirements",
  "Running the 6-second recruiter screen",
  "Building a week-by-week plan for your critical gaps",
  "Weighting the scores and setting your readiness",
];

function LoadingScreen({ loadingStep, role, tier }: { loadingStep: number; role: string; tier: string }) {
  return (
    <ReadingScreen
      kicker={`${role} · ${tier}`}
      title="Reading your resume"
      detail={`${STAGE_DETAILS[loadingStep] ?? "Finalizing your report"}…`}
      stages={ANALYSIS_STAGES.map((s) => s.label)}
      current={loadingStep}
      footnote="Keep this tab open. It usually takes under a minute."
    />
  );
}
