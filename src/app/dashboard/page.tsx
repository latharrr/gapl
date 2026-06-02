"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type AnalysisResult } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { VerdictBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus, ArrowRight, AlertTriangle, FileText, Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const stored = sessionStorage.getItem("gapl_last_report");
      if (stored) {
        try {
          setReports([JSON.parse(stored)]);
        } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserReports(user.uid)
      .then((data) => {
        setReports(data as unknown as AnalysisResult[]);
      })
      .catch((err) => console.error("Error loading dashboard reports:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  if (reports.length === 0) {
    return <EmptyState />;
  }

  // Most recent report is the primary one displayed
  const latestReport = reports[0];

  return <DashboardWithData result={latestReport} allReports={reports} />;
}

function EmptyState() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-xl font-bold text-[#111111]">Dashboard</h1>
          <p className="text-sm text-[#71717a] mt-0.5">Your application readiness hub</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24 px-4 bg-white border border-[#e4e4e7] rounded-3xl"
      >
        <div className="w-12 h-12 bg-[#f4f4f5] border border-[#e4e4e7] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText size={20} className="text-[#71717a]" />
        </div>
        <h2 className="text-lg font-bold text-[#111111] mb-2">No analysis yet</h2>
        <p className="text-sm text-[#71717a] mb-6 max-w-sm mx-auto">
          Upload your resume and let AI tell you exactly why you&apos;re not getting shortlisted — and how to fix it.
        </p>
        <Link href="/analyze">
          <Button size="lg" variant="primary" className="gap-2">
            <Plus size={16} /> Run First Analysis
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

function DashboardWithData({
  result: r,
  allReports,
}: {
  result: AnalysisResult;
  allReports: AnalysisResult[];
}) {
  // Format progress timeline from all user reports (oldest to newest)
  const progressData = [...allReports]
    .reverse()
    .map((item) => ({
      date: new Date(item.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      readiness: item.readiness,
      ats: item.atsScore,
    }));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-[#111111]">
            Dashboard
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-[#71717a] mt-0.5">
            Last analysis: {r.role} · {r.companyTier}
          </motion.p>
        </div>
        <Link href="/analyze">
          <Button size="sm" variant="primary" className="gap-1.5 flex-shrink-0">
            <Plus size={14} /> New Analysis
          </Button>
        </Link>
      </div>

      {/* Top stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card variant="default" padding="md">
          <p className="text-xs text-[#71717a] font-medium mb-2">ATS Score</p>
          <span className={`text-2xl font-bold ${r.atsScore >= 70 ? "text-[#16a34a]" : "text-[#f59e0b]"}`}>{r.atsScore}</span>
          <span className="text-sm text-[#71717a]">%</span>
          <p className="text-[0.625rem] text-[#a1a1aa] mt-1">Keyword & format compliance</p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-xs text-[#71717a] font-medium mb-2">Readiness</p>
          <span className="text-2xl font-bold text-[#111111]">{r.readiness}</span>
          <span className="text-sm text-[#71717a]">%</span>
          <p className="text-[0.625rem] text-[#a1a1aa] mt-1">Composite recruiter signal</p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-xs text-[#71717a] font-medium mb-2">Recruiter Verdict</p>
          <VerdictBadge verdict={r.recruiterVerdict.verdict} />
          <p className="text-[0.625rem] text-[#a1a1aa] mt-2">{r.recruiterVerdict.confidence}% confidence</p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-xs text-[#71717a] font-medium mb-2">Missing Skills</p>
          <span className="text-2xl font-bold text-[#111111]">{r.missingSkills.length}</span>
          <p className="text-[0.625rem] text-[#a1a1aa] mt-1">
            {r.careerGaps.filter((g) => g.priority === "Critical").length} critical
          </p>
        </Card>
      </motion.div>

      {/* Readiness breakdown + chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
          <Card variant="default" padding="md" className="h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-[#111111]">Readiness Breakdown</h2>
                <p className="text-xs text-[#71717a] mt-0.5">What&apos;s pulling your score</p>
              </div>
              <Badge variant="default">{r.readiness}% overall</Badge>
            </div>
            <div className="space-y-4">
              {[
                { label: "Skill Match", score: r.readinessBreakdown.skillMatch.score, weight: "40%", color: "primary" as const },
                { label: "Project Complexity", score: r.readinessBreakdown.projectComplexity.score, weight: "30%", color: "warning" as const },
                { label: "Deployment Evidence", score: r.readinessBreakdown.deploymentEvidence.score, weight: "20%", color: "danger" as const },
                { label: "Team Collaboration", score: r.readinessBreakdown.teamCollaboration.score, weight: "10%", color: "success" as const },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#111111]">{item.label}</span>
                      <span className="text-[0.625rem] text-[#a1a1aa]">{item.weight}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#111111]">{item.score}%</span>
                  </div>
                  <Progress value={item.score} color={item.color} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="default" padding="md" className="h-full">
            <h2 className="text-sm font-semibold text-[#111111] mb-1">Readiness Trend</h2>
            <p className="text-xs text-[#71717a] mb-4">Your application capability growth</p>
            <div className="flex items-center justify-center h-44">
              {progressData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        borderRadius: "8px",
                        border: "none",
                      }}
                      labelStyle={{ color: "#aaa", fontSize: "10px" }}
                      itemStyle={{ color: "#fff", fontSize: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="readiness"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <span className="text-5xl font-bold text-[#4F46E5]">{r.readiness}</span>
                  <span className="text-xl text-[#71717a]">%</span>
                  <p className="text-xs text-[#71717a] mt-2">{r.role}</p>
                  <p className="text-[0.625rem] text-[#a1a1aa]">{r.companyTier}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top gaps */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[#111111]">Critical Gaps</h2>
              <p className="text-xs text-[#71717a] mt-0.5">AI-identified blockers</p>
            </div>
            <Link href={`/report/${r.id}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-[#71717a]">
                Full report <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {r.careerGaps.slice(0, 3).map((gap) => (
              <div key={gap.skill} className="flex items-center gap-4 p-3 rounded-xl bg-[#f4f4f5]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#111111]">{gap.skill}</span>
                    <Badge variant={gap.priority === "Critical" ? "danger" : gap.priority === "High" ? "warning" : "default"}>
                      {gap.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#71717a] truncate">Build: {gap.recommendedProject}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-[#111111]">{gap.estimatedWeeks}w</p>
                  <p className="text-[0.625rem] text-[#a1a1aa]">+{gap.expectedReadinessAfter - r.readiness}% readiness</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recruiter verdict callout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="p-5 rounded-xl border border-[#fecaca] bg-[#fef2f2]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#dc2626] mb-1">Recruiter&apos;s top concern</p>
              <p className="text-sm text-[#3f3f46] leading-relaxed">{r.recruiterVerdict.reason}</p>
              <p className="text-xs font-medium text-[#3f3f46] mt-3">
                <span className="text-[#16a34a]">Fix: </span>{r.recruiterVerdict.whatWouldChangeDecision}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
