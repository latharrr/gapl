"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/Button";
import { ANALYSIS_STAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  canRunAnalysis,
  getRemainingAnalyses,
  incrementUsage,
  FREE_LIMIT,
} from "@/lib/usage";
import { useAuth } from "@/context/AuthContext";
import { saveReport } from "@/lib/firebase";
import {
  Check,
  Upload,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardPaste,
  Zap,
  Lock,
} from "lucide-react";
import Link from "next/link";

// ── Client-side resume content check (mirrors backend heuristic) ──────────────
const RESUME_SIGNALS = [
  "experience", "education", "skills", "projects", "work experience",
  "internship", "objective", "summary", "achievements", "certifications",
  "curriculum vitae", "resume", "cgpa", "gpa", "b.tech", "b.e.", "b.sc",
  "m.tech", "bachelor", "master", "degree", "university", "college",
  "linkedin", "github",
];

function looksLikeResume(text: string): boolean {
  const lower = text.toLowerCase();
  return RESUME_SIGNALS.filter((s) => lower.includes(s)).length >= 3;
}

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".txt"]);

const ROLES = ["SDE Intern", "SDE Full Time", "Data Analyst", "AI/ML Engineer", "Product Manager"];
const TIERS = [
  { label: "Mass Recruiter", description: "Companies hiring 500+ engineers/year" },
  { label: "Product Startup", description: "Series A–C startups with strong engineering culture" },
  { label: "Top Product", description: "FAANG, Stripe, Razorpay, Notion-tier companies" },
];

type Stage = "role" | "tier" | "resume" | "jd" | "loading";

export default function AnalyzePage() {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [fileError, setFileError] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [jdText, setJdText] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingError, setLoadingError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [remaining, setRemaining] = useState(FREE_LIMIT);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(getRemainingAnalyses());
  }, []);

  const onResumeDrop = useCallback((acceptedFiles: File[], rejectedFiles: { file: File }[]) => {
    setFileError("");
    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles[0].file;
      const ext = rejected.name.slice(rejected.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        setFileError(
          `"${rejected.name}" is not a supported file type. Please upload a PDF, DOC, DOCX, or TXT resume.`
        );
      } else {
        setFileError("File rejected. Please upload a PDF, DOC, DOCX, or TXT file under 5 MB.");
      }
      return;
    }
    if (acceptedFiles[0]) {
      // Basic filename/extension sanity check
      const file = acceptedFiles[0];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        setFileError(`Only PDF, DOC, DOCX, and TXT files are accepted. "${ext}" is not supported.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File is too large. Maximum size is 5 MB.");
        return;
      }
      setResumeFile(file);
      setShowPaste(false);
      setResumeText("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onResumeDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const hasResume = resumeFile !== null || resumeText.trim().length > 50;

  const handleContinueToJD = () => {
    // Client-side CV check for pasted text
    if (!resumeFile && resumeText.trim()) {
      if (!looksLikeResume(resumeText)) {
        setPasteError(
          "This doesn't look like a resume. Make sure your text includes sections like Education, Skills, Experience, or Projects."
        );
        return;
      }
    }
    setPasteError("");
    setStage("jd");
  };

  const runAnalysis = async () => {
    // ── Quota check ────────────────────────────────────────────────────────
    if (!canRunAnalysis()) {
      setShowPaywall(true);
      return;
    }

    setStage("loading");
    setLoadingError("");

    // Animate loading steps while API call runs
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step < ANALYSIS_STAGES.length) {
        setLoadingStep(step);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 2000);
    try {
      const formData = new FormData();
      formData.append("role", selectedRole);
      formData.append("tier", selectedTier);
      if (jdText.trim()) formData.append("jdText", jdText.trim());
      if (user) {
        formData.append("userId", user.uid);
      }

      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else if (resumeText.trim()) {
        formData.append("resumeText", resumeText.trim());
      }

      const response = await fetch("/api/analyze", {
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
        setLoadingError(data.error || "Analysis failed. Please try again.");
        setStage("resume");
        return;
      }

      let reportId = data.result.id;
      if (user) {
        try {
          const docRef = await saveReport(user.uid, data.result);
          reportId = docRef.id;
          data.result.id = reportId; // sync object ID with firestore doc ID
        } catch (e) {
          console.warn("Could not save analysis report to Firestore:", e);
        }
      }

      // Store result + increment usage counter
      sessionStorage.setItem("gapl_last_report", JSON.stringify(data.result));
      sessionStorage.setItem("gapl_report_id", reportId);
      incrementUsage();
      setRemaining(getRemainingAnalyses());

      // Brief pause before redirect for UX
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/report/${reportId}`);
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoadingError("Network error. Please check your connection and try again.");
      setStage("resume");
    }
  };

  const steps = [
    { key: "role", label: "Select Role" },
    { key: "tier", label: "Company Tier" },
    { key: "resume", label: "Upload Resume" },
    { key: "jd", label: "Job Description" },
  ];
  const stageOrder: Stage[] = ["role", "tier", "resume", "jd", "loading"];
  const currentIndex = stageOrder.indexOf(stage);

  if (stage === "loading") {
    return <LoadingScreen loadingStep={loadingStep} />;
  }

  // ── Paywall modal ─────────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl border border-[#e4e4e7] p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-[#f4f4f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[#71717a]" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] mb-2">Free limit reached</h2>
            <p className="text-sm text-[#71717a] mb-1">
              You&apos;ve used all <strong>{FREE_LIMIT}</strong> free analyses this month.
            </p>
            <p className="text-xs text-[#a1a1aa] mb-8">
              Upgrade to Pro for unlimited analyses, deeper gap reports, and priority AI processing.
            </p>
            <div className="space-y-3">
              <Link href="/pricing">
                <Button size="lg" variant="primary" className="w-full gap-2">
                  <Zap size={16} /> Upgrade to Pro
                </Button>
              </Link>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full text-xs text-[#a1a1aa] hover:text-[#71717a] py-2 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[#a1a1aa] mt-4">
            Resets on the 1st of each month
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#e4e4e7] bg-white px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-[#111111] rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="text-xs font-semibold text-[#111111]">Gapl</span>
            <span className="text-xs text-[#a1a1aa] mx-1">·</span>
            <span className="text-xs text-[#71717a]">New Analysis</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                remaining === 0
                  ? "bg-[#fef2f2] text-[#dc2626]"
                  : remaining === 1
                  ? "bg-[#fefce8] text-[#b45309]"
                  : "bg-[#f0fdf4] text-[#16a34a]"
              )}>
                {remaining}/{FREE_LIMIT} free
              </span>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                        done ? "bg-[#16a34a] text-white"
                          : active ? "bg-[#111111] text-white"
                          : "bg-[#e4e4e7] text-[#a1a1aa]"
                      )}
                    >
                      {done ? <Check size={10} /> : i + 1}
                    </div>
                    <span className={cn(
                      "text-xs hidden sm:block",
                      active ? "font-medium text-[#111111]"
                        : done ? "text-[#71717a]"
                        : "text-[#a1a1aa]"
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px bg-[#e4e4e7] mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {loadingError && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-4">
          <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
            <AlertCircle size={14} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#dc2626]">{loadingError}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 1: Role */}
            {stage === "role" && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <h2 className="text-xl font-bold text-[#111111] mb-1">What role are you targeting?</h2>
                <p className="text-sm text-[#71717a] mb-6">This shapes how we evaluate your resume.</p>
                <div className="space-y-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-150",
                        selectedRole === role
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-[#e4e4e7] bg-white text-[#111111] hover:border-[#a1a1aa] hover:shadow-sm"
                      )}
                    >
                      <span className="text-sm font-medium">{role}</span>
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full mt-6"
                  size="lg"
                  disabled={!selectedRole}
                  onClick={() => setStage("tier")}
                >
                  Continue <ChevronRight size={16} />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Tier */}
            {stage === "tier" && (
              <motion.div
                key="tier"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <h2 className="text-xl font-bold text-[#111111] mb-1">What companies are you targeting?</h2>
                <p className="text-sm text-[#71717a] mb-6">The bar is very different across tiers.</p>
                <div className="space-y-3">
                  {TIERS.map((tier) => (
                    <button
                      key={tier.label}
                      onClick={() => setSelectedTier(tier.label)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-150",
                        selectedTier === tier.label
                          ? "border-[#111111] bg-[#111111] text-white"
                          : "border-[#e4e4e7] bg-white hover:border-[#a1a1aa] hover:shadow-sm"
                      )}
                    >
                      <p className={cn("text-sm font-semibold", selectedTier === tier.label ? "text-white" : "text-[#111111]")}>
                        {tier.label}
                      </p>
                      <p className={cn("text-xs mt-0.5", selectedTier === tier.label ? "text-[#a1a1aa]" : "text-[#71717a]")}>
                        {tier.description}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" size="lg" onClick={() => setStage("role")} className="flex-1">Back</Button>
                  <Button size="lg" disabled={!selectedTier} onClick={() => setStage("resume")} className="flex-1">
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Resume */}
            {stage === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <h2 className="text-xl font-bold text-[#111111] mb-1">Upload your resume</h2>
                <p className="text-sm text-[#71717a] mb-6">PDF, DOC, or DOCX. Or paste text directly.</p>

                {/* File type error */}
                {fileError && (
                  <div className="flex items-start gap-2 p-3 mb-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
                    <AlertCircle size={14} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#dc2626] leading-relaxed">{fileError}</p>
                  </div>
                )}

                {/* Drop zone */}
                {!showPaste && (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-3",
                      isDragActive ? "border-[#4F46E5] bg-[#eef2ff]"
                        : resumeFile ? "border-[#16a34a] bg-[#f0fdf4]"
                        : "border-[#e4e4e7] bg-white hover:border-[#a1a1aa] hover:bg-[#f4f4f5]"
                    )}
                  >
                    <input {...getInputProps()} />
                    {resumeFile ? (
                      <div>
                        <div className="w-10 h-10 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl flex items-center justify-center mx-auto mb-3">
                          <FileText size={20} className="text-[#16a34a]" />
                        </div>
                        <p className="text-sm font-semibold text-[#111111]">{resumeFile.name}</p>
                        <p className="text-xs text-[#71717a] mt-1">{(resumeFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                      </div>
                    ) : (
                      <div>
                        <div className="w-10 h-10 bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Upload size={20} className="text-[#71717a]" />
                        </div>
                        <p className="text-sm font-semibold text-[#111111]">
                          {isDragActive ? "Drop it here" : "Drag & drop your resume"}
                        </p>
                        <p className="text-xs text-[#71717a] mt-1">or click to browse · PDF, DOC, DOCX, TXT</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste option */}
                <button
                  onClick={() => { setShowPaste(!showPaste); setResumeFile(null); }}
                  className="w-full flex items-center gap-2 justify-center text-xs text-[#71717a] hover:text-[#111111] mb-3 transition-colors"
                >
                  <ClipboardPaste size={12} />
                  {showPaste ? "Upload file instead" : "Or paste resume text"}
                </button>

                {showPaste && (
                  <div className="mb-3">
                    <textarea
                      value={resumeText}
                      onChange={(e) => { setResumeText(e.target.value); setPasteError(""); }}
                      placeholder="Paste your full resume text here — include Education, Skills, Experience, Projects..."
                      rows={12}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white text-sm text-[#111111] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none transition-all",
                        pasteError ? "border-[#fecaca]" : "border-[#e4e4e7]"
                      )}
                    />
                    {pasteError && (
                      <div className="flex items-start gap-2 mt-2">
                        <AlertCircle size={12} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-[#dc2626] leading-relaxed">{pasteError}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="lg" onClick={() => setStage("tier")} className="flex-1">Back</Button>
                  <Button size="lg" onClick={handleContinueToJD} className="flex-1" disabled={!hasResume}>
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: JD */}
            {stage === "jd" && (
              <motion.div
                key="jd"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <h2 className="text-xl font-bold text-[#111111] mb-1">Add a job description</h2>
                <p className="text-sm text-[#71717a] mb-1">Optional — but adds precision to gap analysis.</p>
                <p className="text-xs text-[#a1a1aa] mb-6">Paste the JD text or skip to use role-based defaults.</p>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste job description here..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-[#e4e4e7] bg-white text-sm text-[#111111] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none transition-all"
                />
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="lg" onClick={() => setStage("resume")} className="flex-1">Back</Button>
                  <Button size="lg" onClick={runAnalysis} className="flex-1 bg-[#111111]">
                    Run Analysis
                  </Button>
                </div>
                <button
                  onClick={runAnalysis}
                  className="w-full mt-3 text-xs text-[#a1a1aa] hover:text-[#71717a] text-center transition-colors"
                >
                  Skip and analyze without JD →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ loadingStep }: { loadingStep: number }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center max-w-sm w-full px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 mx-auto mb-8 border-2 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full"
        />
        <h2 className="text-lg font-bold text-[#111111] mb-2">Analyzing your resume</h2>
        <p className="text-sm text-[#71717a] mb-10">
          GPT-OSS-120B is reviewing your profile. This takes ~15 seconds.
        </p>
        <div className="space-y-3 text-left">
          {ANALYSIS_STAGES.map((s, i) => {
            const done = i < loadingStep;
            const active = i === loadingStep;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                  done ? "bg-[#16a34a]" : active ? "bg-[#4F46E5]" : "bg-[#e4e4e7]"
                )}>
                  {done ? (
                    <Check size={10} className="text-white" />
                  ) : active ? (
                    <Loader2 size={10} className="text-white animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a1a1aa]" />
                  )}
                </div>
                <span className={cn(
                  "text-sm",
                  done ? "text-[#71717a] line-through" : active ? "text-[#111111] font-medium" : "text-[#a1a1aa]"
                )}>
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
