"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/Button";
import { ANALYSIS_STAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/plans";
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
import { DepartureBoard } from "@/components/brand/DepartureBoard";
import { OptionList } from "@/components/ui/Choice";
import { ROLES, TIERS } from "@/lib/targets";

function currentUsageMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

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
  // Prefill from the landing enquiry (/analyze?role=…&tier=…) and skip the answered steps.
  const searchParams = useSearchParams();
  const paramRole = searchParams.get("role") ?? "";
  const paramTier = searchParams.get("tier") ?? "";
  const initialRole = ROLES.includes(paramRole) ? paramRole : "";
  const initialTier = TIERS.some((t) => t.label === paramTier) ? paramTier : "";
  const [stage, setStage] = useState<Stage>(initialRole && initialTier ? "resume" : initialRole ? "tier" : "role");
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [fileError, setFileError] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [jdText, setJdText] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingError, setLoadingError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [validating, setValidating] = useState(false);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentPlan = String(userDoc?.plan || "free").toLowerCase();
  const monthlyLimit = PLAN_LIMITS[currentPlan] ?? PLAN_LIMITS.free;
  const usageCount =
    userDoc?.analysisUsageMonth === currentUsageMonth()
      ? Math.max(0, Number(userDoc?.analysisUsageCount || 0))
      : 0;
  const usageLabel = `${Math.min(usageCount, monthlyLimit)}/${monthlyLimit} ${currentPlan}`;

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

      const res = await authFetch("/api/analyze/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (resumeFile) {
          setFileError(data.error || "Invalid resume content.");
        } else {
          setPasteError(data.error || "Invalid resume content.");
        }
        return;
      }

      setStage("jd");
    } catch (err) {
      console.error("Resume validation failed:", err);
      const errMsg = "Validation failed. Please check your internet connection and try again.";
      if (resumeFile) {
        setFileError(errMsg);
      } else {
        setPasteError(errMsg);
      }
    } finally {
      setValidating(false);
    }
  };

  const runAnalysis = async () => {
    if (!user) {
      router.push("/auth/login?next=/analyze");
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
  const remaining = Math.max(0, monthlyLimit - usageCount);

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
    <div className="min-h-screen bg-surface-muted flex flex-col">
      {/* Rail bar */}
      <header className="bg-primary-600 text-primary-foreground border-b-[3px] border-board">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href={user ? "/dashboard" : "/"} aria-label="Gapl home">
            <Wordmark size="sm" />
          </Link>
          <span className="text-sm font-semibold text-primary-100">New chart</span>
          <span
            className={cn(
              "stamp ml-auto text-[0.6875rem] bg-surface-DEFAULT",
              remaining === 0 ? "text-danger" : remaining === 1 ? "text-warning" : "text-success"
            )}
            title="Analyses used this month"
          >
            {usageLabel}
          </span>
        </div>
      </header>

      <StepRoute steps={steps.map((st) => st.label)} current={currentIndex} />

      {/* Paywall */}
      {showPaywall && (
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-8">
          <div className="chart-sheet rounded-[6px] overflow-hidden">
            <div className="led-board px-4 py-2.5 text-[0.95rem]">PLAN LIMIT REACHED</div>
            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-[800] tracking-[-0.015em]">You&apos;ve used every analysis on your plan</h2>
              <p className="mt-2 text-[0.9375rem] text-ink-secondary">
                All <strong>{monthlyLimit}</strong> analyses included in your {currentPlan} plan this month are used.
                Upgrade for more and keep working through your roadmap. Limits reset on the 1st of each month.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Link href="/pricing" className="sm:flex-1">
                  <Button size="lg" className="w-full">See plans</Button>
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
          <div className="chart-sheet rounded-[6px] overflow-hidden">
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
      <div className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-xl mx-auto">
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
                  <div role="alert" className="mt-5 flex items-start gap-2 p-3 bg-danger-bg border border-danger-border rounded-[5px]">
                    <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-sm text-danger leading-relaxed">{fileError}</p>
                  </div>
                )}

                {!showPaste && (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "mt-5 rounded-[6px] border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-primary-600 bg-primary-50"
                        : resumeFile
                        ? "border-success bg-success-bg"
                        : "border-border-strong bg-surface-DEFAULT hover:border-ink"
                    )}
                  >
                    <input {...getInputProps()} />
                    {resumeFile ? (
                      <div>
                        <FileText size={28} className="mx-auto text-success" />
                        <p className="mt-3 font-bold break-all">{resumeFile.name}</p>
                        <p className="chart-data mt-1 text-xs text-ink-muted">
                          {(resumeFile.size / 1024).toFixed(0)} KB · tap to replace
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} className="mx-auto text-ink-muted" />
                        <p className="mt-3 font-bold">{isDragActive ? "Drop it here" : "Drag your resume here"}</p>
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
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
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
                        setPasteError("");
                      }}
                      placeholder="Paste your full resume: Education, Skills, Experience, Projects…"
                      rows={12}
                      className={cn(
                        "w-full px-4 py-3 rounded-[6px] border-[1.5px] bg-surface-DEFAULT text-[0.9375rem] text-ink focus:outline-none focus:ring-[3px] focus:ring-primary-600/15 focus:border-primary-600 resize-y",
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
                  className="mt-5 w-full px-4 py-3 rounded-[6px] border-[1.5px] border-border-strong bg-surface-DEFAULT text-[0.9375rem] text-ink focus:outline-none focus:ring-[3px] focus:ring-primary-600/15 focus:border-primary-600 resize-y"
                />
                <div className="flex gap-2 mt-5">
                  <Button variant="outline" size="lg" onClick={() => setStage("resume")}>Back</Button>
                  <Button size="lg" onClick={runAnalysis} className="flex-1">
                    {jdText.trim() ? "Prepare my chart" : "Skip and prepare my chart"} <ChevronRight size={17} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
    <DepartureBoard
      kicker={`${role} · ${tier}`}
      title="Preparing your chart"
      detail={`${STAGE_DETAILS[loadingStep] ?? "Finalizing your report"}…`}
      stages={ANALYSIS_STAGES.map((s) => s.label)}
      current={loadingStep}
      footnote="Keep this tab open while the chart is prepared."
    />
  );
}
