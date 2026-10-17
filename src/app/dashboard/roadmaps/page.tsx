"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type AnalysisResult } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronDown, Plus, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";

export default function RoadmapsPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
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
      .catch((e) => console.error("Error loading roadmap:", e))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto text-center py-20">
        <h1 className="text-xl font-bold text-ink mb-2">No Roadmap Yet</h1>
        <p className="text-sm text-ink-muted mb-6">Run an analysis to get your personalized week-by-week roadmap.</p>
        <Link href="/analyze"><Button size="lg" variant="primary" className="gap-2"><Plus size={16} /> Run Analysis</Button></Link>
      </div>
    );
  }

  const totalTasks = result.roadmap.reduce((acc, w) => acc + w.tasks.length, 0);
  const doneTasks = completedTasks.size;
  const progress = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-ink">
          Roadmap
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-ink-muted mt-0.5">
          {result.role} · {result.companyTier} · AI-generated 4-week plan
        </motion.p>
      </div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-ink">{doneTasks}/{totalTasks} tasks completed</p>
              <p className="text-xs text-ink-muted mt-0.5">Expected readiness after: {result.careerGaps[0]?.expectedReadinessAfter ?? result.readiness + 15}%</p>
            </div>
            <span className="text-2xl font-bold text-primary-600">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-border-DEFAULT rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-primary-600 rounded-full"
            />
          </div>
        </Card>
      </motion.div>

      {/* Weeks */}
      <div className="space-y-3">
        {result.roadmap.map((week, i) => {
          const weekTasks = week.tasks.map((t) => `${week.week}-${t}`);
          const weekDone = weekTasks.filter((id) => completedTasks.has(id)).length;
          const weekProgress = Math.round((weekDone / week.tasks.length) * 100);
          const isExpanded = expandedWeek === week.week;

          return (
            <motion.div key={week.week} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.08 }}>
              <Card variant="default" padding="none">
                <button className="w-full text-left p-5 flex items-center gap-4" onClick={() => setExpandedWeek(isExpanded ? null : week.week)}>
                  <div className={cn(
                    "w-10 h-10 rounded-[6px] flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                    weekDone === week.tasks.length ? "bg-success text-white" : "bg-surface-subtle text-ink-muted border border-border-DEFAULT"
                  )}>
                    {weekDone === week.tasks.length ? <Check size={18} strokeWidth={3} /> : `W${week.week}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-ink">{week.title}</p>
                      <Badge variant={weekDone === week.tasks.length ? "success" : "default"}>{weekDone}/{week.tasks.length}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted truncate">{week.description}</p>
                  </div>
                  <ChevronDown size={16} className={cn("text-ink-faint flex-shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
                </button>

                <div className="px-5 pb-3">
                  <div className="w-full h-1 bg-border-DEFAULT rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all duration-300" style={{ width: `${weekProgress}%` }} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-2 border-t border-border-DEFAULT pt-4">
                    <p className="text-[0.625rem] text-ink-faint uppercase tracking-wider font-medium mb-3">Tasks</p>
                    {week.tasks.map((task) => {
                      const taskId = `${week.week}-${task}`;
                      const done = completedTasks.has(taskId);
                      return (
                        <button
                          key={taskId}
                          onClick={() => toggleTask(taskId)}
                          className={cn(
                            "w-full text-left flex items-center gap-3 p-3 rounded-[6px] transition-all duration-150",
                            done ? "bg-success-bg" : "hover:bg-surface-subtle"
                          )}
                        >
                          {done ? <CheckCircle2 size={16} className="text-success flex-shrink-0" /> : <Circle size={16} className="text-border-strong flex-shrink-0" />}
                          <span className={cn("text-sm", done ? "text-ink-muted line-through" : "text-ink-secondary")}>{task}</span>
                        </button>
                      );
                    })}
                    <div className="mt-3 p-3 bg-primary-50 rounded-[6px] border border-primary-100">
                      <p className="text-[0.625rem] text-primary-600/60 uppercase tracking-wider font-medium mb-1">Milestone</p>
                      <p className="text-xs font-semibold text-primary-700">{week.milestone}</p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
