"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { type AnalysisResult } from "@/types/analysis";
import { Navbar } from "@/components/layout/Navbar";
import { VerdictBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  Sheet,
  ChartRow,
  RecruiterRemark,
  Breakdown,
  GapsTable,
  SkillsLedger,
} from "@/components/report/ReportParts";
import { waitlistCount } from "@/lib/sample-report";
import { Download, Share2, ArrowRight, ArrowLeft, Mail, Check, Flag } from "lucide-react";
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
    } catch (err: any) {
      import("react-hot-toast").then(({ default: toast }) => {
        toast.error(err.message || "Failed to send email");
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-muted">
        <div className="led-board h-11 px-4 flex items-center rounded-[4px] text-[1.05rem]">
          <span className="animate-led-blink">PREPARING CHART</span>
        </div>
        <p className="text-sm text-ink-muted">Loading your report…</p>
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
  const wl = waitlistCount(result.careerGaps);
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
    { id: "overview", label: "Overview" },
    { id: "verdict", label: "Verdict" },
    { id: "skills", label: "Gaps & skills" },
    { id: "roadmap", label: "Roadmap" },
  ] as const;

  const show = (tab: typeof activeTab) => (activeTab === tab ? "block" : "hidden md:block");

  return (
    <>
      <Navbar />
      <main className="pt-[59px] bg-surface-muted min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink mb-2 print:hidden"
              >
                <ArrowLeft size={14} /> New analysis
              </Link>
              <h1 className="display text-[clamp(2rem,4.5vw,3rem)]">Your chart</h1>
              <p className="chart-data mt-1 text-xs text-ink-muted">Prepared {created} · AI estimate with reasons</p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={emailReport} disabled={emailing}>
                <Mail size={15} /> {emailing ? "Sending…" : "Email me this"}
              </Button>
              <Button variant="outline" size="sm" onClick={shareSummary}>
                <Share2 size={15} /> {shared ? "Copied" : "Share summary"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Download size={15} /> Print or save PDF
              </Button>
            </div>
          </div>

          {/* The row on the chart — always visible */}
          <Sheet title="Reservation chart" aside={`${result.careerGaps.length} gaps found`}>
            <ChartRow
              role={result.role}
              tier={result.companyTier}
              ats={result.atsScore}
              readiness={result.readiness}
              verdict={verdict}
              waitlist={wl}
              topGap={result.recruiterVerdict.topGap}
            />
          </Sheet>

          {/* Mobile tabs */}
          <div className="md:hidden sticky top-[59px] z-20 -mx-4 px-4 bg-surface-muted border-b border-border-strong print:hidden">
            <div className="flex gap-5 overflow-x-auto" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-3 text-sm font-semibold whitespace-nowrap border-b-[3px] -mb-px",
                    activeTab === tab.id ? "border-ink text-ink" : "border-transparent text-ink-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={show("verdict")}>
            <Sheet title="Recruiter's remark" aside={<VerdictBadge verdict={verdict} waitlist={wl} size="sm" />}>
              <RecruiterRemark
                reason={result.recruiterVerdict.reason}
                strongestSignal={result.recruiterVerdict.strongestSignal}
                topGap={result.recruiterVerdict.topGap}
                whatWouldChange={result.recruiterVerdict.whatWouldChangeDecision}
                confidence={result.recruiterVerdict.confidence}
                verdict={verdict}
              />
            </Sheet>
          </div>

          <div className={show("overview")}>
            <Sheet title="Readiness breakdown" aside={`${result.readiness}/100 overall`}>
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

          {/* Route: the roadmap as a schedule with a checklist at every stop */}
          <div className={show("roadmap")}>
            <Sheet title={`Route · ${result.roadmap.length} weeks`} aside={`${doneTasks}/${totalTasks} tasks done`}>
              <div className="led-board mx-4 sm:mx-6 mt-5 rounded-[4px] px-4 py-3 grid grid-cols-3 gap-4 text-sm">
                <span>
                  DONE<span className="block text-2xl leading-none mt-1">{progress}%</span>
                </span>
                <span>
                  READINESS<span className="block text-2xl leading-none mt-1">{initialReadiness}→{currentReadiness}</span>
                </span>
                <span className="text-right">
                  TARGET<span className="block text-2xl leading-none mt-1">{targetReadiness}</span>
                </span>
              </div>
              <p className="px-4 sm:px-6 mt-2 text-xs text-ink-muted">
                Projected readiness rises as you tick off tasks. Re-analyze your updated resume to get a fresh chart.
              </p>

              <ol className="relative px-4 sm:px-6 pt-6 pb-6">
                <span aria-hidden className="absolute left-[calc(1rem+0.6rem)] sm:left-[calc(1.5rem+0.6rem)] top-8 bottom-8 w-[2px] bg-border-strong" />
                {result.roadmap.map((week) => {
                  const weekDone = week.tasks.every((t) => completedTasks.has(`${week.week}-${t}`));
                  return (
                    <li key={week.week} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0">
                      <span
                        aria-hidden
                        className={cn(
                          "relative z-10 mt-1 h-5 w-5 rounded-full border-[3px] grid place-items-center",
                          weekDone ? "border-success bg-success" : "border-ink bg-surface-DEFAULT"
                        )}
                      >
                        {weekDone && <Check size={11} strokeWidth={3.5} className="text-white" />}
                      </span>
                      <div className="min-w-0">
                        <p className="chart-data text-xs text-ink-muted">WEEK {week.week}</p>
                        <h3 className="mt-0.5 text-lg font-bold tracking-[-0.01em]">{week.title}</h3>
                        <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-secondary max-w-[68ch]">{week.description}</p>

                        <ul className="mt-3 border-y border-border-DEFAULT divide-y divide-border-DEFAULT">
                          {week.tasks.map((task) => {
                            const taskId = `${week.week}-${task}`;
                            const isDone = completedTasks.has(taskId);
                            const isStop = taskId === stoppedAt;
                            return (
                              <li key={taskId}>
                                <button
                                  onClick={() => toggleTask(taskId)}
                                  aria-pressed={isDone}
                                  className="group flex w-full items-start gap-3 py-2.5 text-left hover:bg-surface-muted"
                                >
                                  <span
                                    className={cn(
                                      "mt-0.5 h-5 w-5 shrink-0 rounded-[3px] border-[1.5px] grid place-items-center transition-colors",
                                      isDone ? "border-success bg-success text-white" : "border-ink-muted group-hover:border-ink"
                                    )}
                                  >
                                    {isDone && <Check size={13} strokeWidth={3.5} />}
                                  </span>
                                  <span className={cn("flex-1 text-[0.9375rem] leading-relaxed", isDone ? "text-ink-muted line-through" : "text-ink")}>
                                    {task}
                                  </span>
                                  {isStop && (
                                    <span className="stamp shrink-0 text-[0.625rem] text-ink bg-board border-ink">
                                      <Flag size={10} strokeWidth={3} /> Next
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        <p className="mt-2.5 text-sm">
                          <span className="chart-data text-xs font-bold text-success">MILESTONE › </span>
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
            <div className="rounded-[6px] bg-primary-600 text-primary-foreground overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/15">
                <div className="flex items-center gap-3">
                  <Wordmark size="sm" />
                  <span className="text-sm font-bold">Share slip</span>
                </div>
                <div className="flex rounded-[4px] bg-white/10 p-0.5" role="tablist" aria-label="Share slip type">
                  {(["verdict", "readiness", "gaps"] as const).map((type) => (
                    <button
                      key={type}
                      role="tab"
                      aria-selected={shareCardType === type}
                      onClick={() => setShareCardType(type)}
                      className={cn(
                        "px-3 py-1 rounded-[3px] text-xs font-semibold capitalize",
                        shareCardType === type ? "bg-board text-board-ink" : "text-primary-100 hover:text-white"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 sm:px-6 py-6 grid gap-6 sm:grid-cols-2 min-h-[150px]">
                {shareCardType === "verdict" && (
                  <>
                    <SlipField label="Applying for">{result.role} · {result.companyTier}</SlipField>
                    <SlipField label="Recruiter decision">
                      <VerdictBadge verdict={verdict} waitlist={wl} className="bg-surface-DEFAULT" />
                    </SlipField>
                    <SlipField label="Top reason">{result.recruiterVerdict.topGap || result.recruiterVerdict.reason}</SlipField>
                    <SlipField label="Fix">
                      {result.careerGaps[0]?.recommendedProject ?? "Roadmap projects"}
                      <span className="chart-data block text-sm text-board mt-1">
                        {initialReadiness} → {result.careerGaps[0]?.expectedReadinessAfter || targetReadiness}
                      </span>
                    </SlipField>
                  </>
                )}
                {shareCardType === "readiness" && (
                  <>
                    <SlipField label="Readiness">
                      <span className="chart-data text-3xl font-bold">{initialReadiness} → {currentReadiness}</span>
                      <span className="block text-sm text-primary-100 mt-1">Target {targetReadiness}</span>
                    </SlipField>
                    <SlipField label="Roadmap">
                      <span className="chart-data text-3xl font-bold">{doneTasks}/{totalTasks}</span>
                      <span className="block text-sm text-primary-100 mt-1">tasks completed · {progress}%</span>
                    </SlipField>
                  </>
                )}
                {shareCardType === "gaps" && (
                  <>
                    <SlipField label="Top missing skill">
                      {result.careerGaps[0]?.skill ?? "—"}
                      <span className="block text-sm text-primary-100 mt-1">{result.careerGaps[0]?.priority ?? "High"} priority</span>
                    </SlipField>
                    <SlipField label="Build">
                      {result.careerGaps[0]?.recommendedProject ?? "—"}
                      <span className="block text-sm text-primary-100 mt-1">
                        {result.careerGaps[0]?.estimatedWeeks ?? 3} weeks · +
                        {Math.max(1, (result.careerGaps[0]?.expectedReadinessAfter || targetReadiness) - initialReadiness)} readiness
                      </span>
                    </SlipField>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-white/15">
                <span className="chart-data text-xs text-primary-100">gapl.in</span>
                <Button variant="primary" size="sm" onClick={shareSummary}>
                  <Share2 size={14} /> {shared ? "Copied" : "Share slip"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
            <Link href="/tailor" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                Tailor my CV for {result.companyTier} <ArrowRight size={17} strokeWidth={2.5} />
              </Button>
            </Link>
            <Link href="/analyze">
              <Button variant="outline" size="lg" className="w-full">
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
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-board">{label}</p>
      <div className="mt-1.5 text-[0.9375rem] font-semibold leading-snug">{children}</div>
    </div>
  );
}
