"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { type AnalysisResult } from "@/types/analysis";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { VerdictBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Download,
  Share2,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Mail,
} from "lucide-react";
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
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to send email");
      }
      import("react-hot-toast").then(({ default: toast }) => {
        toast.success("Report summary emailed successfully!");
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-8 h-8 border-2 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full animate-spin" />
      </div>
    );
  }

  const radarData = [
    { skill: "Skill Match", score: result.readinessBreakdown.skillMatch.score },
    { skill: "Projects", score: result.readinessBreakdown.projectComplexity.score },
    { skill: "Deployment", score: result.readinessBreakdown.deploymentEvidence.score },
    { skill: "Teamwork", score: result.readinessBreakdown.teamCollaboration.score },
    { skill: "ATS", score: result.atsScore },
  ];

  const verdictColor = {
    Shortlist: "#16a34a",
    Maybe: "#f59e0b",
    Reject: "#dc2626",
  }[result.recruiterVerdict.verdict];

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

  return (
    <>
      <Navbar />
      <main className="pt-14 bg-[#FAFAFA] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

          {/* Back + header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#111111] mb-3 transition-colors"
              >
                <ArrowLeft size={12} /> New Analysis
              </Link>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-[#71717a] font-medium">{result.role} · {result.companyTier}</p>
                <span className="text-[#a1a1aa]">·</span>
                <p className="text-xs text-[#a1a1aa]">
                  {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <h1 className="text-xl font-bold text-[#111111]">Analysis Report</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={emailReport}
                disabled={emailing}
              >
                <Mail size={14} /> {emailing ? "Emailing..." : "Email me this"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={shareSummary}>
                <Share2 size={14} /> {shared ? "Shared" : "Share summary"}
              </Button>
              <Button variant="primary" size="sm" className="gap-1.5" onClick={() => window.print()}>
                <Download size={14} /> Print or save PDF
              </Button>
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="flex md:hidden border-b border-[#e4e4e7] bg-white sticky top-14 z-20 -mx-4 px-4 overflow-x-auto gap-4 scrollbar-none">
            {[
              { id: "overview", label: "Overview" },
              { id: "verdict", label: "Recruiter Verdict" },
              { id: "skills", label: "Skills" },
              { id: "roadmap", label: "Roadmap" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-[#4F46E5] text-[#4F46E5] border-[#4F46E5]"
                    : "border-transparent text-[#71717a] hover:text-[#111111]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Score cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={cn(
              "grid grid-cols-2 lg:grid-cols-4 gap-4",
              activeTab === "overview" ? "grid" : "hidden md:grid"
            )}
          >
            {[
              { label: "ATS Fit Estimate", value: result.atsScore, color: result.atsScore >= 70 ? "#16a34a" : "#f59e0b" },
              { label: "Readiness Estimate", value: result.readiness, color: "#111111" },
              { label: "Model Confidence", value: result.recruiterVerdict.confidence, color: "#111111" },
              { label: "Gaps Found", value: result.careerGaps.length, color: "#dc2626", noPercent: true },
            ].map(({ label, value, color, noPercent }) => (
              <Card key={label} variant="default" padding="md">
                <p className="text-xs text-[#71717a] mb-2">{label}</p>
                <div className="flex items-end gap-0.5">
                  <span className="text-2xl font-bold" style={{ color }}>{value}</span>
                  {!noPercent && <span className="text-sm text-[#71717a] mb-0.5">%</span>}
                </div>
              </Card>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recruiter Simulation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(activeTab === "verdict" ? "block" : "hidden lg:block")}
            >
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-[#111111]">AI Recruiter Perspective</h2>
                  <VerdictBadge verdict={result.recruiterVerdict.verdict} />
                </div>

                <div
                  className="p-4 rounded-xl mb-4 border"
                  style={{
                    background: `${verdictColor}0d`,
                    borderColor: `${verdictColor}33`,
                  }}
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: verdictColor }}>
                    Why this estimate
                  </p>
                  <p className="text-sm text-[#3f3f46] leading-relaxed">{result.recruiterVerdict.reason}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#111111]">Strongest Signal</p>
                      <p className="text-xs text-[#71717a] mt-0.5">{result.recruiterVerdict.strongestSignal}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle size={14} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#111111]">Top Gap</p>
                      <p className="text-xs text-[#71717a] mt-0.5">{result.recruiterVerdict.topGap}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Zap size={14} className="text-[#4F46E5] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#111111]">What Would Change This</p>
                      <p className="text-xs text-[#71717a] mt-0.5">{result.recruiterVerdict.whatWouldChangeDecision}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e4e4e7]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-[#71717a]">Model confidence estimate</p>
                    <p className="text-xs font-semibold text-[#111111]">{result.recruiterVerdict.confidence}%</p>
                  </div>
                  <Progress
                    value={result.recruiterVerdict.confidence}
                    color={result.recruiterVerdict.verdict === "Reject" ? "danger" : result.recruiterVerdict.verdict === "Shortlist" ? "success" : "warning"}
                    size="sm"
                  />
                </div>
              </Card>
            </motion.div>

            {/* Radar chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(activeTab === "overview" ? "block" : "hidden lg:block")}
            >
              <Card variant="default" padding="md">
                <h2 className="text-sm font-semibold text-[#111111] mb-1">Readiness Profile</h2>
                <p className="text-xs text-[#71717a] mb-4">Estimated from the evidence visible in your resume</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#E4E4E7" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#71717A" }} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #E4E4E7", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: unknown) => [`${value}%`, "Score"]}
                    />
                    <Radar name="Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.1} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Readiness breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(activeTab === "overview" ? "block" : "hidden md:block")}
          >
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-[#111111]">Readiness Breakdown</h2>
                <Badge variant="default">{result.readiness}% overall</Badge>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Skill Match", score: result.readinessBreakdown.skillMatch.score, weight: "40%", color: "primary" as const },
                  { label: "Project Complexity", score: result.readinessBreakdown.projectComplexity.score, weight: "30%", color: "warning" as const },
                  { label: "Deployment Evidence", score: result.readinessBreakdown.deploymentEvidence.score, weight: "20%", color: "danger" as const },
                  { label: "Team Collaboration", score: result.readinessBreakdown.teamCollaboration.score, weight: "10%", color: "success" as const },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#111111]">{item.label}</span>
                        <span className="text-[0.625rem] text-[#a1a1aa]">{item.weight} weight</span>
                      </div>
                      <span className="text-xs font-semibold text-[#111111]">{item.score}%</span>
                    </div>
                    <Progress value={item.score} color={item.color} size="sm" />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Career gaps */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={cn(activeTab === "skills" ? "block" : "hidden md:block")}
          >
            <Card variant="default" padding="md">
              <h2 className="text-sm font-semibold text-[#111111] mb-1">Career Gap Analysis</h2>
              <p className="text-xs text-[#71717a] mb-5">Prioritized by impact on shortlisting probability</p>
              <div className="space-y-4">
                {result.careerGaps.map((gap, i) => (
                  <motion.div
                    key={gap.skill}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="p-4 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7]"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-[#111111]">{gap.skill}</h3>
                          <Badge variant={gap.priority === "Critical" ? "danger" : gap.priority === "High" ? "warning" : "default"}>
                            {gap.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#71717a]">Current level: {gap.currentLevel}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#71717a] flex-shrink-0">
                        <Clock size={11} /> {gap.estimatedWeeks}w
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-[#e4e4e7]">
                      <p className="text-[0.625rem] text-[#a1a1aa] uppercase tracking-wider font-medium mb-1.5">Build next</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#111111]">{gap.recommendedProject}</p>
                        <div className="flex items-center gap-1 text-xs text-[#16a34a] font-medium">
                          <ArrowRight size={11} /> {gap.expectedReadinessAfter}%
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{gap.difficulty}</Badge>
                        <span className="text-[0.625rem] text-[#a1a1aa]">
                          +{gap.expectedReadinessAfter - result.readiness}% improvement
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
          {/* Roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cn(activeTab === "roadmap" ? "block" : "hidden md:block")}
          >
            <Card variant="default" padding="md" className="space-y-6">
              {/* Onboarding & Gap Closure Progress Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Roadmap Completion</h4>
                    <p className="text-[10px] text-[#71717a] mt-0.5">Tasks resolved across weekly sprints</p>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#4F46E5]">{progress}%</span>
                    <span className="text-xs text-zinc-500">{doneTasks} / {totalTasks} milestones</span>
                  </div>
                  <div className="w-full h-1 bg-[#e4e4e7] rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-[#4F46E5] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-200/40 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Gap Closure</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Estimated portfolio deficits closed</p>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600">{progress}%</span>
                    <span className="text-xs text-zinc-500">closed</span>
                  </div>
                  <div className="w-full h-1 bg-[#e4e4e7] rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Readiness Over Time Timeline */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Readiness Over Time Timeline</h4>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Projected score trajectory as milestones are resolved</p>
                </div>
                <div className="flex items-center justify-between relative py-2">
                  {/* Line behind dots */}
                  <div className="absolute left-4 right-4 h-0.5 bg-[#e4e4e7] top-1/2 -translate-y-1/2 z-0" />
                  {/* Green completed line */}
                  <div className="absolute left-4 h-0.5 bg-emerald-500 top-1/2 -translate-y-1/2 z-0 transition-all duration-300" style={{ right: `${100 - progress}%`, maxWidth: "90%" }} />
                  
                  {[
                    { label: "Start", score: initialReadiness, pct: 0 },
                    { label: "W1", score: Math.round(initialReadiness + 0.25 * (targetReadiness - initialReadiness)), pct: 25 },
                    { label: "W2", score: Math.round(initialReadiness + 0.5 * (targetReadiness - initialReadiness)), pct: 50 },
                    { label: "W3", score: Math.round(initialReadiness + 0.75 * (targetReadiness - initialReadiness)), pct: 75 },
                    { label: "Target", score: targetReadiness, pct: 100 },
                  ].map((milestone, idx) => {
                    const isPassed = progress >= milestone.pct;
                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300",
                          isPassed 
                            ? "bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-100" 
                            : "bg-white border border-[#d4d4d8] text-[#71717a]"
                        )}>
                          {milestone.label}
                        </div>
                        <span className="text-[10px] font-bold text-[#111111] mt-1.5">{milestone.score}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-[10px] text-[#71717a]">
                  Current projected readiness: <strong className="text-[#4f46e5]">{currentReadiness}%</strong> (Started at {initialReadiness}%)
                </div>
              </div>

              {/* Timeline Checklist */}
              <div>
                <div className="relative pl-6 border-l border-[#e4e4e7] space-y-6">
                  {result.roadmap.map((week) => (
                    <div key={week.week} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-0 w-[18px] h-[18px] rounded-full bg-white border border-[#d4d4d8] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[#111111] mb-1">Week {week.week}: {week.title}</h3>
                        <p className="text-xs text-[#71717a] leading-relaxed mb-3">{week.description}</p>
                        
                        {/* Interactive Task Checklist */}
                        <div className="space-y-2 mb-4 bg-white/40 border border-[#e4e4e7]/60 p-3 rounded-xl">
                          <p className="text-[9px] text-[#a1a1aa] font-bold uppercase tracking-wider mb-2">Milestone Checklist</p>
                          {week.tasks.map((task) => {
                            const taskId = `${week.week}-${task}`;
                            const isDone = completedTasks.has(taskId);
                            return (
                              <button
                                key={taskId}
                                onClick={() => toggleTask(taskId)}
                                className="flex items-start gap-2.5 text-left w-full hover:bg-white p-2 -mx-2 rounded-lg transition-colors group border border-transparent hover:border-[#e4e4e7]/30"
                              >
                                {isDone ? (
                                  <CheckCircle2 size={14} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-[#d4d4d8] group-hover:border-[#a1a1aa] flex-shrink-0 mt-0.5" />
                                )}
                                <span className={cn("text-xs leading-relaxed", isDone ? "text-[#71717a] line-through font-normal" : "text-[#3f3f46]")}>
                                  {task}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef2ff] border border-[#e0e7ff]">
                          <CheckCircle2 size={10} className="text-[#4F46E5]" />
                          <span className="text-[0.625rem] font-medium text-[#4F46E5]">{week.milestone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Strong vs missing skills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn("grid md:grid-cols-2 gap-6", activeTab === "skills" ? "grid" : "hidden md:grid")}
          >
            <Card variant="default" padding="md">
              <h2 className="text-sm font-semibold text-[#111111] mb-4">Strong Skills</h2>
              <div className="flex flex-wrap gap-2">
                {result.strongSkills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-xs font-medium text-[#16a34a]">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
            <Card variant="default" padding="md">
              <h2 className="text-sm font-semibold text-[#111111] mb-4">Missing Skills</h2>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-[#fef2f2] border border-[#fecaca] text-xs font-medium text-[#dc2626]">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Shareable card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={cn(activeTab === "verdict" ? "block" : "hidden md:block")}
          >
            <div className="bg-[#111111] rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                  <p className="text-xs text-[#52525b] uppercase tracking-widest font-medium">Shareable Verdict Card</p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Showcase your verification results</p>
                </div>
                <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg">
                  {[
                    { id: "verdict", label: "Verdict" },
                    { id: "readiness", label: "Readiness" },
                    { id: "gaps", label: "Gaps" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setShareCardType(type.id as any)}
                      className={cn(
                        "px-3 py-1 rounded text-[10px] font-semibold transition-all",
                        shareCardType === type.id
                          ? "bg-white text-[#111111] shadow-sm"
                          : "text-[#a1a1aa] hover:text-white"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share Card Content View */}
              <div className="grid sm:grid-cols-2 gap-6 min-h-[160px] items-center">
                {shareCardType === "verdict" && (
                  <>
                    <div>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Target Tier</p>
                      <p className="text-sm font-bold text-white mb-2">{result.companyTier} {result.role}</p>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1.5">Recruiter Decision</p>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider mb-4",
                        result.recruiterVerdict.verdict === "Reject" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                        result.recruiterVerdict.verdict === "Maybe" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                        "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      )}>
                        {result.recruiterVerdict.verdict === "Reject" ? "✕ Would Not Shortlist" :
                         result.recruiterVerdict.verdict === "Maybe" ? "⚠️ Needs Review" :
                         "✓ Highly Competitive"}
                      </div>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Expected Improvement</p>
                      <div className="text-emerald-400 text-xs font-mono font-bold">
                        {initialReadiness}% → {result.careerGaps[0]?.expectedReadinessAfter || targetReadiness}%
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2.5">
                      <div>
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Top Rejection Reason</p>
                        <p className="text-xs text-[#d4d4d8] leading-relaxed line-clamp-3">
                          {result.recruiterVerdict.topGap || result.recruiterVerdict.reason}
                        </p>
                      </div>
                      {result.careerGaps[0] && (
                        <div className="pt-2 border-t border-white/5">
                          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Actionable Fix</p>
                          <p className="text-xs text-white font-semibold">
                            {result.careerGaps[0].recommendedProject}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {shareCardType === "readiness" && (
                  <>
                    <div>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Target Profile</p>
                      <p className="text-sm font-bold text-white mb-2">{result.role}</p>
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-[10px] text-[#a1a1aa]">
                          <span>Initial Readiness</span>
                          <span className="font-semibold">{initialReadiness}%</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                          <span>Current Progress</span>
                          <span>{currentReadiness}%</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>Target Goal</span>
                          <span>{targetReadiness}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider font-semibold">Roadmap Checklist</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-[#818cf8]">{doneTasks}</span>
                        <span className="text-xs text-[#71717a]">/ {totalTasks} Tasks Completed</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-[#a1a1aa]">
                          <span>Completion</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#818cf8] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {shareCardType === "gaps" && (
                  <>
                    <div>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Top Skill Deficit</p>
                      <p className="text-md font-bold text-white mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" /> {result.careerGaps[0]?.skill || "Backend APIs"}
                      </p>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Rejection Impact</p>
                      <div className="inline-flex px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">
                        {result.careerGaps[0]?.priority || "High"} Priority
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                      <div>
                        <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-0.5">Recommended Project Fix</p>
                        <p className="text-xs font-bold text-emerald-400">{result.careerGaps[0]?.recommendedProject || "Expense Tracker SaaS"}</p>
                        <p className="text-[10px] text-[#71717a] mt-0.5">{result.careerGaps[0]?.estimatedWeeks || 3} weeks estimated duration</p>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] text-[#a1a1aa]">Estimated Score Bump</span>
                        <span className="text-sm font-bold text-emerald-400">+{Math.max(1, (result.careerGaps[0]?.expectedReadinessAfter || targetReadiness) - initialReadiness)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="text-xs text-[#52525b]">gapl.in</span>
                </div>
                <Button variant="ghost" size="sm" className="text-[#71717a] hover:text-white hover:bg-white/10 gap-1.5" onClick={shareSummary}>
                  <Share2 size={12} /> {shared ? "Shared" : "Share card"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 pb-8"
          >
            <Link href="/tailor" className="flex-1">
              <Button variant="primary" size="lg" className="w-full gap-2">
                <Zap size={16} /> Tailor my CV for {result.companyTier}
              </Button>
            </Link>
            <Link href="/analyze" className="flex-shrink-0">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft size={16} /> New Analysis
              </Button>
            </Link>
          </motion.div>

        </div>
      </main>
    </>
  );
}
