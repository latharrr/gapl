"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type AnalysisResult } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Plus, TrendingUp, Award, Target, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";

export default function ProgressPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const stored = sessionStorage.getItem("gapl_last_report");
      if (stored) {
        try { setResult(JSON.parse(stored)); } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserReports(user.uid)
      .then((reports) => {
        if (reports.length > 0) {
          setResult(reports[0] as unknown as AnalysisResult);
        }
      })
      .catch((e) => console.error("Error loading progress:", e))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center py-20">
        <h1 className="text-xl font-bold text-ink mb-2">No Progress Data Yet</h1>
        <p className="text-sm text-ink-muted mb-6">Run your first analysis to start tracking your readiness growth.</p>
        <Link href="/analyze"><Button size="lg" variant="primary" className="gap-2"><Plus size={16} /> Run Analysis</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-ink">
          Progress
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-ink-muted mt-0.5">
          Track your readiness improvement over time
        </motion.p>
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
        {[
          { label: "Current readiness", value: `${result.readiness}%`, icon: TrendingUp, color: "text-primary-600" },
          { label: "ATS Score", value: `${result.atsScore}%`, icon: Target, color: result.atsScore >= 70 ? "text-success" : "text-warning" },
          { label: "Gaps identified", value: `${result.careerGaps.length}`, icon: Award, color: "text-danger" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} variant="default" padding="md" className="text-center">
            <Icon size={16} className={`mx-auto mb-2 ${color}`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-ink-muted mt-1">{label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Readiness breakdown comparison */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card variant="default" padding="md">
          <h2 className="text-sm font-semibold text-ink mb-1">Readiness Components</h2>
          <p className="text-xs text-ink-muted mb-5">Estimated from the evidence visible in your resume</p>
          <div className="space-y-4">
            {[
              { label: "Skill Match (40%)", score: result.readinessBreakdown.skillMatch.score, color: "primary" as const },
              { label: "Project Complexity (30%)", score: result.readinessBreakdown.projectComplexity.score, color: "warning" as const },
              { label: "Deployment Evidence (20%)", score: result.readinessBreakdown.deploymentEvidence.score, color: "danger" as const },
              { label: "Team Collaboration (10%)", score: result.readinessBreakdown.teamCollaboration.score, color: "success" as const },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-ink-secondary">{item.label}</span>
                  <span className="text-xs font-semibold text-ink">{item.score}%</span>
                </div>
                <Progress value={item.score} color={item.color} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Skills */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="default" padding="md">
            <h2 className="text-sm font-semibold text-ink mb-4">Strong Skills</h2>
            <div className="flex flex-wrap gap-2">
              {result.strongSkills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full bg-success-bg border border-success-border text-xs font-medium text-success">{skill}</span>
              ))}
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card variant="default" padding="md">
            <h2 className="text-sm font-semibold text-ink mb-4">Skills to Build</h2>
            <div className="flex flex-wrap gap-2">
              {result.missingSkills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full bg-danger-bg border border-danger-border text-xs font-medium text-danger">○ {skill}</span>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Prompt to run again */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="p-5 bg-primary-50 rounded-[6px] border border-primary-100 text-center">
          <p className="text-sm font-semibold text-primary-700 mb-1">Ready to improve?</p>
          <p className="text-xs text-primary-600/70 mb-4">Once you&apos;ve worked on your gaps, re-analyze to see your readiness grow.</p>
          <Link href="/analyze"><Button size="sm" variant="secondary" className="gap-1.5"><Plus size={14} /> Re-analyze</Button></Link>
        </div>
      </motion.div>
    </div>
  );
}
