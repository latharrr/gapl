"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { type AnalysisResult } from "@/types/analysis";
import { Navbar } from "@/components/layout/Navbar";
import { Tag, VerdictBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/brand/Wordmark";
import { ReadingLine } from "@/components/ui/Sheet";
import {
  Sheet,
  ReportFace,
  Breakdown,
  GapsTable,
  SkillsLedger,
} from "@/components/report/ReportParts";
import { Download, Share2, ArrowRight, ArrowLeft, Mail, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/auth-fetch";
import { cn } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const emailReport = async () => {
    setEmailing(true);
    try {
      const res = await authFetch(`/api/reports/${params.id}/email`, {
        method: "POST",
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
            ? `Report emailed! ${remaining} of ${total} sends remaining (resets in 8 h)`
            : `Report emailed! You've used all ${total} sends — resets in 8 hours`
        );
      });
    } catch (err) {
      import("react-hot-toast").then(({ default: toast }) => {
        toast.error(err instanceof Error ? err.message : "Failed to send email");
      });
    } finally {
      setEmailing(false);
    }
  };
  const [activeTab, setActiveTab] = useState<"overview" | "verdict" | "skills" | "roadmap">("overview");
  const [shareCardType, setShareCardType] = useState<"verdict" | "readiness" | "gaps">("verdict");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  interface RoadmapDoc {
    reportId: string;
    userId: string;
    startedAt: string;
    completedTasks: string[];
    completionPercentage: number;
    targetReadiness: number;
    currentReadiness: number;
  }
  const [roadmapData, setRoadmapData] = useState<RoadmapDoc | null>(null);

  const toggleTask = async (taskId: string) => {
    if (!result) return;
    
    let nextSet: Set<string> = new Set();
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      nextSet = next;
      return next;
    });

    const nextArray = Array.from(nextSet);
    const total = result.roadmap.reduce((acc, w) => acc + w.tasks.length, 0);
    const done = nextArray.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const target = roadmapData?.targetReadiness || 88;
    const current = Math.min(
      target,
      Math.round(result.readiness + (pct / 100) * (target - result.readiness))
    );

    setRoadmapData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        completedTasks: nextArray,
        completionPercentage: pct,
        currentReadiness: current,
      };
    });

    import("@/lib/analytics").then(({ trackEvent }) => {
      trackEvent("task_completed");
      if (done === 1) trackEvent("roadmap_started");
    });

    try {
      await authFetch(`/api/roadmaps/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          completedTasks: nextArray,
          completionPercentage: pct,
          currentReadiness: current,
        }),
      });
    } catch (err) {
      console.error("Failed to sync progress:", err);
    }
  };

  useEffect(() => {
    async function loadReport() {
      if (authLoading) return;
      if (!user) {
        router.push(`/auth/login?next=/report/${params.id}`);
        return;
      }

      import("@/lib/analytics").then(({ trackEvent }) => trackEvent("report_viewed"));

      // 1. Try session storage first for immediate access
      let initialReport: AnalysisResult | null = null;
      const stored = sessionStorage.getItem("gapl_last_report");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AnalysisResult;
          if (parsed.id === params.id) {
            initialReport = parsed;
          }
        } catch { /* ignore */ }
      }

      // 2. Query Firestore if it's a valid ID or if session didn't match
      if (!initialReport && typeof params.id === "string") {
        try {
          const res = await authFetch(`/api/reports/${params.id}`);
          const data = await res.json();
          if (res.ok && data.report) {
            initialReport = data.report as AnalysisResult;
          }
        } catch (err) {
          console.error("Error loading report from DB:", err);
        }
      }

      if (!initialReport) {
        router.push("/analyze");
        return;
      }

      setResult(initialReport);

      // 3. Load the corresponding roadmap document
      try {
        const res = await authFetch(`/api/roadmaps/${params.id}`);
        const data = await res.json();
        if (res.ok && data.roadmap) {
          setRoadmapData(data.roadmap);
          if (Array.isArray(data.roadmap.completedTasks)) {
            setCompletedTasks(new Set(data.roadmap.completedTasks));
          }
        }
      } catch (err) {
        console.error("Error loading roadmap from DB:", err);
      }

      setLoading(false);
    }

    loadReport();
  }, [authLoading, params.id, router, user]);

  if (loading || !result) {
    return (
      <div className="min-h-screen on-desk flex flex-col items-center justify-center gap-4" role="status">
        <ReadingLine className="bg-desk-line" />
        <p className="text-sm text-desk-muted">Opening your report…</p>
      </div>
    );
  }

  const totalTasks = result.roadmap.reduce((acc, w) => acc + w.tasks.length, 0);
  const doneTasks = completedTasks.size;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const initialReadiness = result.readiness;
  const targetReadiness = roadmapData?.targetReadiness || 88;
  const currentReadiness = Math.min(
    targetReadiness,
    Math.round(initialReadiness + (progress / 100) * (targetReadiness - initialReadiness))
  );

  const shareSummary = async () => {
    let text = "";
    if (shareCardType === "verdict") {
      const verdictText = result.recruiterVerdict.verdict === "Reject" ? "Would Not Shortlist" : result.recruiterVerdict.verdict === "Maybe" ? "Needs Review" : "Shortlisted";
      text = `Gapl AI Recruiter: ${verdictText}\nReason: ${result.recruiterVerdict.topGap || result.recruiterVerdict.reason.slice(0, 80)}\nFix: ${result.careerGaps[0]?.recommendedProject || "Roadmap projects"}\nExpected Improvement: ${initialReadiness}% → ${result.careerGaps[0]?.expectedReadinessAfter || targetReadiness}%`;
    } else if (shareCardType === "readiness") {
      text = `Gapl Progress Checklist\nStarted: ${initialReadiness}% | Current: ${currentReadiness}% | Target: ${targetReadiness}%\nCompleted: ${doneTasks}/${totalTasks} Tasks\nTarget Role: ${result.role} (${result.companyTier})`;
    } else {
      text = `Gapl Top Missing Skill: ${result.careerGaps[0]?.skill || "Backend APIs"}\nPriority: ${result.careerGaps[0]?.priority || "High"}\nEstimated Improvement: +${(result.careerGaps[0]?.expectedReadinessAfter || targetReadiness) - initialReadiness}%`;
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: "My Gapl Readiness Profile", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      // ignore
    }
  };

  const verdict = result.recruiterVerdict.verdict;
  const created = new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // The first unchecked task is where the student stopped: it carries the flag.
  let stoppedAt: string | null = null;
  for (const w of result.roadmap) {
    const t = w.tasks.find((task) => !completedTasks.has(`${w.week}-${task}`));
    if (t) {
      stoppedAt = `${w.week}-${t}`;
      break;
    }
  }

  const TABS = [
    { id: "overview", label: "Breakdown" },
    { id: "skills", label: "Gaps & skills" },
    { id: "roadmap", label: "Roadmap" },
    { id: "verdict", label: "Share" },
  ] as const;

  const show = (tab: typeof activeTab) => (activeTab === tab ? "block" : "hidden md:block");

  return (
    <>
      <Navbar />
      <main className="on-desk pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-20 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-3">
            <div>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-desk-muted hover:text-desk-ink mb-3 print:hidden"
              >
                <ArrowLeft size={14} /> New analysis
              </Link>
              <h1 className="display text-[clamp(2.25rem,5vw,3.25rem)]">Your report</h1>
              <p className="tabular mt-2 text-sm text-desk-muted">Read {created} · an AI estimate, with its reasons</p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="desk" size="sm" onClick={emailReport} disabled={emailing}>
                <Mail size={15} /> {emailing ? "Sending…" : "Email me this"}
              </Button>
              <Button variant="desk" size="sm" onClick={shareSummary}>
                <Share2 size={15} /> {shared ? "Copied" : "Share summary"}
              </Button>
              <Button variant="desk" size="sm" onClick={() => window.print()}>
                <Download size={15} /> Save as PDF
              </Button>
            </div>
          </div>

          {/* The face of the report — always visible */}
          <div className="page rounded-[6px] overflow-hidden">
            <ReportFace
              role={result.role}
              tier={result.companyTier}
              ats={result.atsScore}
              readiness={result.readiness}
              verdict={verdict}
              confidence={result.recruiterVerdict.confidence}
              reason={result.recruiterVerdict.reason}
              strongestSignal={result.recruiterVerdict.strongestSignal}
              topGap={result.recruiterVerdict.topGap}
              whatWouldChange={result.recruiterVerdict.whatWouldChangeDecision}
              meta={`${result.careerGaps.length} gaps found`}
            />
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden sticky top-16 z-20 -mx-4 px-4 bg-desk border-b border-desk-line print:hidden">
            <div className="flex gap-6 overflow-x-auto" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors",
                    activeTab === tab.id ? "border-highlight text-desk-ink" : "border-transparent text-desk-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={show("overview")}>
            <Sheet title="Where the readiness comes from" aside={`${result.readiness}/100 overall`}>
              <Breakdown
                pulledBy={result.recruiterVerdict.topGap}
                items={[
                  { label: "Skill match", score: result.readinessBreakdown.skillMatch.score, weight: "40%" },
                  { label: "Project complexity", score: result.readinessBreakdown.projectComplexity.score, weight: "30%" },
                  { label: "Deployment evidence", score: result.readinessBreakdown.deploymentEvidence.score, weight: "20%" },
                  { label: "Team collaboration", score: result.readinessBreakdown.teamCollaboration.score, weight: "10%" },
                ]}
              />
            </Sheet>
          </div>

          <div className={cn("space-y-5", show("skills"))}>
            <Sheet title="Career gaps" aside="Ranked by impact on shortlisting">
              <GapsTable gaps={result.careerGaps} readiness={result.readiness} />
            </Sheet>
            <Sheet title="Skills">
              <SkillsLedger strong={result.strongSkills} missing={result.missingSkills} />
            </Sheet>
          </div>

          {/* Roadmap: weeks on a ruled line, a checklist at every week */}
          <div className={show("roadmap")}>
            <Sheet title={`Roadmap · ${result.roadmap.length} weeks`} aside={`${doneTasks}/${totalTasks} tasks done`}>
              <dl className="grid grid-cols-3 divide-x divide-border-DEFAULT border-b border-border-DEFAULT">
                <div className="px-4 sm:px-6 py-4">
                  <dt className="text-xs sm:text-sm text-ink-muted">Done</dt>
                  <dd className="figure mt-1 text-2xl sm:text-3xl font-semibold leading-none">{progress}%</dd>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <dt className="text-xs sm:text-sm text-ink-muted">Readiness</dt>
                  <dd className="figure mt-1 text-2xl sm:text-3xl font-semibold leading-none">
                    <span className="text-ink-faint">{initialReadiness}→</span>
                    <span className={cn(currentReadiness > initialReadiness && "text-primary-700")}>{currentReadiness}</span>
                  </dd>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <dt className="text-xs sm:text-sm text-ink-muted">Target</dt>
                  <dd className="figure mt-1 text-2xl sm:text-3xl font-semibold leading-none">{targetReadiness}</dd>
                </div>
              </dl>
              <p className="px-4 sm:px-6 pt-3 text-xs text-ink-muted">
                Projected readiness rises as you tick off tasks. Re-analyze your updated resume to confirm it.
              </p>

              <ol className="relative px-4 sm:px-6 pt-6 pb-6">
                <span aria-hidden className="absolute left-[calc(1rem+0.6rem)] sm:left-[calc(1.5rem+0.6rem)] top-8 bottom-8 w-px bg-border-strong" />
                {result.roadmap.map((week) => {
                  const weekDone = week.tasks.every((t) => completedTasks.has(`${week.week}-${t}`));
                  return (
                    <li key={week.week} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 pb-9 last:pb-0">
                      <span
                        aria-hidden
                        className={cn(
                          "relative z-10 mt-0.5 h-5 w-5 rounded-full border-2 grid place-items-center",
                          weekDone ? "border-ink bg-ink text-highlight" : "border-ink bg-surface-DEFAULT"
                        )}
                      >
                        {weekDone && <Check size={11} strokeWidth={3.5} />}
                      </span>
                      <div className="min-w-0">
                        <p className="tabular text-sm text-ink-muted">Week {week.week}{weekDone && " · done"}</p>
                        <h3 className="mt-0.5 text-lg font-semibold tracking-[-0.01em]">{week.title}</h3>
                        <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-secondary max-w-[68ch]">{week.description}</p>

                        <ul className="mt-3 border-y border-border-DEFAULT divide-y divide-border-DEFAULT">
                          {week.tasks.map((task) => {
                            const taskId = `${week.week}-${task}`;
                            const isDone = completedTasks.has(taskId);
                            const isNext = taskId === stoppedAt;
                            return (
                              <li key={taskId}>
                                <button
                                  onClick={() => toggleTask(taskId)}
                                  aria-pressed={isDone}
                                  className="group flex w-full items-start gap-3 py-3 text-left hover:bg-surface-muted"
                                >
                                  <span
                                    className={cn(
                                      "mt-0.5 h-5 w-5 shrink-0 rounded-[5px] border-[1.5px] grid place-items-center transition-colors",
                                      isDone ? "border-ink bg-ink text-highlight" : "border-ink-faint group-hover:border-ink"
                                    )}
                                  >
                                    {isDone && <Check size={13} strokeWidth={3.5} />}
                                  </span>
                                  <span className={cn("flex-1 text-[0.9375rem] leading-relaxed", isDone ? "text-ink-muted line-through decoration-ink-faint" : "text-ink")}>
                                    {task}
                                  </span>
                                  {isNext && <Tag tone="highlight" className="shrink-0 mt-0.5">Next</Tag>}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        <p className="mt-2.5 text-sm">
                          <span className="font-semibold text-primary-700">Milestone: </span>
                          <span className="text-ink-secondary">{week.milestone}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Sheet>
          </div>

          {/* Share slip */}
          <div className={cn("print:hidden", show("verdict"))}>
            <Sheet
              title={
                <span className="inline-flex items-center gap-3">
                  <Wordmark size="sm" /> Share a summary
                </span>
              }
              aside={
                <span className="inline-flex rounded-[7px] bg-surface-subtle p-0.5" role="tablist" aria-label="What to share">
                  {(["verdict", "readiness", "gaps"] as const).map((type) => (
                    <button
                      key={type}
                      role="tab"
                      aria-selected={shareCardType === type}
                      onClick={() => setShareCardType(type)}
                      className={cn(
                        "px-3 py-1 rounded-[5px] text-xs font-semibold capitalize transition-colors",
                        shareCardType === type ? "bg-surface-DEFAULT text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </span>
              }
            >
              <div className="px-4 sm:px-6 py-6 grid gap-6 sm:grid-cols-2 min-h-[150px]">
                {shareCardType === "verdict" && (
                  <>
                    <SlipField label="Applying for">{result.role} · {result.companyTier}</SlipField>
                    <SlipField label="Recruiter decision">
                      <VerdictBadge verdict={verdict} />
                    </SlipField>
                    <SlipField label="Top reason">{result.recruiterVerdict.topGap || result.recruiterVerdict.reason}</SlipField>
                    <SlipField label="Fix">
                      <span className="text-primary-700">{result.careerGaps[0]?.recommendedProject ?? "Roadmap projects"}</span>
                      <span className="figure block text-sm text-ink-muted mt-1">
                        Readiness {initialReadiness} → {result.careerGaps[0]?.expectedReadinessAfter || targetReadiness}
                      </span>
                    </SlipField>
                  </>
                )}
                {shareCardType === "readiness" && (
                  <>
                    <SlipField label="Readiness">
                      <span className="figure text-3xl font-semibold">{initialReadiness} → {currentReadiness}</span>
                      <span className="block text-sm text-ink-muted mt-1">Target {targetReadiness}</span>
                    </SlipField>
                    <SlipField label="Roadmap">
                      <span className="figure text-3xl font-semibold">{doneTasks}/{totalTasks}</span>
                      <span className="block text-sm text-ink-muted mt-1">tasks completed · {progress}%</span>
                    </SlipField>
                  </>
                )}
                {shareCardType === "gaps" && (
                  <>
                    <SlipField label="Top missing skill">
                      {result.careerGaps[0]?.skill ?? "—"}
                      <span className="block text-sm text-ink-muted mt-1">{result.careerGaps[0]?.priority ?? "High"} priority</span>
                    </SlipField>
                    <SlipField label="Build">
                      <span className="text-primary-700">{result.careerGaps[0]?.recommendedProject ?? "—"}</span>
                      <span className="block text-sm text-ink-muted mt-1">
                        {result.careerGaps[0]?.estimatedWeeks ?? 3} weeks · +
                        {Math.max(1, (result.careerGaps[0]?.expectedReadinessAfter || targetReadiness) - initialReadiness)} readiness
                      </span>
                    </SlipField>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-border-DEFAULT">
                <span className="text-xs text-ink-muted">gapl.in</span>
                <Button size="sm" onClick={shareSummary}>
                  <Share2 size={14} /> {shared ? "Copied" : "Share"}
                </Button>
              </div>
            </Sheet>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 print:hidden">
            <Link href="/tailor" className="flex-1">
              <Button size="lg" className="w-full">
                Tailor my CV for {result.companyTier} <ArrowRight size={17} strokeWidth={2.5} />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button variant="desk" size="lg" className="w-full">
                New analysis
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function SlipField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="field-label text-ink-muted">{label}</p>
      <div className="mt-1.5 text-[0.9375rem] font-semibold leading-snug">{children}</div>
    </div>
  );
}
