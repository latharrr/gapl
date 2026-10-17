"use client";

import { useEffect, useState } from "react";
import { type AnalysisResult } from "@/types/analysis";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet, PageHeader, EmptyChart, LoadingChart, APP_PAGE } from "@/components/ui/Sheet";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";

export default function RoadmapsPage() {
  const { user } = useAuth();

  // Logged-out result comes straight from sessionStorage — derived during render, no effect.
  const [result, setResult] = useState<AnalysisResult | null>(() => {
    if (user) return null;
    try {
      const stored = sessionStorage.getItem("gapl_last_report");
      return stored ? (JSON.parse(stored) as AnalysisResult) : null;
    } catch {
      return null;
    }
  });
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [loading, setLoading] = useState(() => !!user);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const reports = await getUserReports(user.uid);
        if (!cancelled && reports.length > 0) {
          setResult(reports[0] as unknown as AnalysisResult);
        }
      } catch (err) {
        console.error("Error loading roadmap:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  if (loading) return <LoadingChart text="LOADING ROUTE" />;

  if (!result) {
    return (
      <div className={APP_PAGE}>
        <PageHeader title="Roadmap" />
        <Sheet>
          <EmptyChart
            led="NO ROUTE YET"
            title="No roadmap yet"
            action={
              <Link href="/analyze">
                <Button size="lg"><Plus size={17} strokeWidth={2.5} /> Run an analysis</Button>
              </Link>
            }
          >
            Run an analysis to get your week-by-week route to close your gaps.
          </EmptyChart>
        </Sheet>
      </div>
    );
  }

  const totalTasks = result.roadmap.reduce((acc, w) => acc + w.tasks.length, 0);
  const doneTasks = completedTasks.size;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const expected = result.careerGaps[0]?.expectedReadinessAfter ?? result.readiness + 15;

  return (
    <div className={APP_PAGE}>
      <PageHeader
        title="Roadmap"
        description="Your route, week by week. Tick tasks as you finish them."
        meta={`${result.role} · ${result.companyTier} · ${result.roadmap.length} weeks`}
      />

      <div className="led-board rounded-[6px] px-4 sm:px-5 py-3.5 grid grid-cols-3 gap-4 text-sm">
        <span>
          TASKS<span className="block text-2xl leading-none mt-1">{doneTasks}/{totalTasks}</span>
        </span>
        <span>
          DONE<span className="block text-2xl leading-none mt-1">{progress}%</span>
        </span>
        <span className="text-right">
          READINESS<span className="block text-2xl leading-none mt-1">{result.readiness}→{expected}</span>
        </span>
      </div>

      <Sheet title="Route">
        <ol className="divide-y divide-border-DEFAULT">
          {result.roadmap.map((week) => {
            const weekDone = week.tasks.filter((t) => completedTasks.has(`${week.week}-${t}`)).length;
            const complete = weekDone === week.tasks.length;
            const isExpanded = expandedWeek === week.week;
            return (
              <li key={week.week}>
                <button
                  className="w-full text-left px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-surface-muted"
                  onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                  aria-expanded={isExpanded}
                >
                  <span
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-full border-[3px] grid place-items-center chart-data text-xs font-bold",
                      complete ? "border-success bg-success text-white" : "border-ink bg-surface-DEFAULT"
                    )}
                  >
                    {complete ? <Check size={17} strokeWidth={3} /> : `W${week.week}`}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold">{week.title}</span>
                    <span className="block text-sm text-ink-muted truncate">{week.description}</span>
                  </span>
                  <span className="chart-data text-xs text-ink-muted shrink-0">
                    {weekDone}/{week.tasks.length}
                  </span>
                  <ChevronDown size={18} className={cn("shrink-0 text-ink-muted transition-transform duration-300", isExpanded && "rotate-180")} />
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 sm:pl-[5.5rem]">
                    <ul className="border-y border-border-DEFAULT divide-y divide-border-DEFAULT">
                      {week.tasks.map((task) => {
                        const taskId = `${week.week}-${task}`;
                        const done = completedTasks.has(taskId);
                        return (
                          <li key={taskId}>
                            <button
                              onClick={() => toggleTask(taskId)}
                              aria-pressed={done}
                              className="group w-full text-left flex items-start gap-3 py-2.5 hover:bg-surface-muted"
                            >
                              <span
                                className={cn(
                                  "mt-0.5 h-5 w-5 shrink-0 rounded-[3px] border-[1.5px] grid place-items-center",
                                  done ? "border-success bg-success text-white" : "border-ink-muted group-hover:border-ink"
                                )}
                              >
                                {done && <Check size={13} strokeWidth={3.5} />}
                              </span>
                              <span className={cn("text-[0.9375rem]", done ? "text-ink-muted line-through" : "text-ink")}>{task}</span>
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
                )}
              </li>
            );
          })}
        </ol>
      </Sheet>
    </div>
  );
}
