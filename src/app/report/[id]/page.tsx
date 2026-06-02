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
} from "lucide-react";
import Link from "next/link";
import { getReport } from "@/lib/firebase";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      // 1. Try session storage first for immediate access
      const stored = sessionStorage.getItem("gapl_last_report");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AnalysisResult;
          if (parsed.id === params.id) {
            setResult(parsed);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }

      // 2. Query Firestore if it's a valid ID or if session didn't match
      if (typeof params.id === "string") {
        try {
          const docData = await getReport(params.id);
          if (docData) {
            setResult(docData as unknown as AnalysisResult);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Error loading report from DB:", err);
        }
      }

      // 3. Fallback: redirect if not found
      router.push("/analyze");
    }

    loadReport();
  }, [params.id, router]);

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
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 size={14} /> Share
              </Button>
              <Button variant="primary" size="sm" className="gap-1.5">
                <Download size={14} /> Export PDF
              </Button>
            </div>
          </div>

          {/* Score cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { label: "ATS Score", value: result.atsScore, color: result.atsScore >= 70 ? "#16a34a" : "#f59e0b" },
              { label: "Readiness", value: result.readiness, color: "#111111" },
              { label: "Confidence", value: result.recruiterVerdict.confidence, color: "#111111" },
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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-[#111111]">Recruiter Simulation</h2>
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
                    Decision Reason
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
                    <p className="text-xs text-[#71717a]">Confidence</p>
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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card variant="default" padding="md">
                <h2 className="text-sm font-semibold text-[#111111] mb-1">Readiness Profile</h2>
                <p className="text-xs text-[#71717a] mb-4">AI-scored across five dimensions</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#E4E4E7" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#71717A" }} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #E4E4E7", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: any) => [`${v}%`, "Score"]}
                    />
                    <Radar name="Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.1} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </div>

          {/* Readiness breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card variant="default" padding="md">
              <h2 className="text-sm font-semibold text-[#111111] mb-1">4-Week Roadmap</h2>
              <p className="text-xs text-[#71717a] mb-6">Week-by-week plan to hit shortlistable readiness</p>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-[#e4e4e7]" />
                <div className="space-y-5">
                  {result.roadmap.map((week) => (
                    <div key={week.week} className="flex gap-4">
                      <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-[#e4e4e7] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#71717a]">{week.week}</span>
                      </div>
                      <div className="flex-1 pb-2">
                        <h3 className="text-sm font-semibold text-[#111111] mb-1">{week.title}</h3>
                        <p className="text-xs text-[#71717a] leading-relaxed mb-2">{week.description}</p>
                        <div className="space-y-1 mb-3">
                          {week.tasks.map((task) => (
                            <div key={task} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#d4d4d8] flex-shrink-0" />
                              <span className="text-xs text-[#3f3f46]">{task}</span>
                            </div>
                          ))}
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
            className="grid md:grid-cols-2 gap-6"
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <div className="bg-[#111111] rounded-2xl p-8">
              <p className="text-xs text-[#52525b] uppercase tracking-widest font-medium mb-4">Shareable Report Card</p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Role</p>
                  <p className="text-lg font-bold text-white mb-3">{result.role}</p>
                  <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Target</p>
                  <p className="text-sm text-[#a1a1aa] mb-3">{result.companyTier}</p>
                  <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1.5">Verdict</p>
                  <VerdictBadge verdict={result.recruiterVerdict.verdict} />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Readiness", value: result.readiness, color: "#4F46E5" },
                    { label: "ATS Score", value: result.atsScore, color: "#f59e0b" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-[#71717a]">{label}</span>
                        <span className="text-xs font-semibold text-white">{value}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Top Gap</p>
                    <p className="text-sm font-semibold text-white">{result.recruiterVerdict.topGap}</p>
                  </div>
                  {result.careerGaps[0] && (
                    <div>
                      <p className="text-[0.625rem] text-[#52525b] uppercase tracking-widest mb-1">Build Next</p>
                      <p className="text-sm font-semibold text-white">{result.careerGaps[0].recommendedProject}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="text-xs text-[#52525b]">gapl.in</span>
                </div>
                <Button variant="ghost" size="sm" className="text-[#71717a] hover:text-white hover:bg-white/10 gap-1.5">
                  <Download size={12} /> Save Card
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
