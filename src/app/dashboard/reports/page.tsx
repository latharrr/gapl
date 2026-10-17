"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { type AnalysisResult } from "@/types/analysis";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/Badge";
import { Plus, ArrowRight, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserReports } from "@/lib/firebase";

export default function ReportsPage() {
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
      .catch((err) => console.error("Failed to load user reports:", err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-ink">
            Reports
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-ink-muted mt-0.5">
            All your resume analyses
          </motion.p>
        </div>
        <Link href="/analyze">
          <Button size="sm" variant="primary" className="gap-1.5">
            <Plus size={14} /> New Analysis
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : reports.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-10 h-10 bg-surface-subtle border border-border-DEFAULT rounded-[6px] flex items-center justify-center mx-auto mb-3">
            <FileText size={18} className="text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink mb-1">No reports yet</p>
          <p className="text-xs text-ink-muted mb-4">Run your first analysis to see results here.</p>
          <Link href="/analyze">
            <Button size="sm" variant="outline" className="gap-1.5"><Plus size={14} /> New Analysis</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card variant="default" padding="none" className="hover:shadow-md transition-shadow duration-200">
                <Link href={`/report/${r.id}`}>
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[6px] bg-surface-subtle border border-border-DEFAULT flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-ink-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-ink">{r.role}</p>
                        <span className="text-ink-faint">·</span>
                        <p className="text-xs text-ink-muted">{r.companyTier}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-muted">ATS: {r.atsScore}%</span>
                        <span className="text-ink-faint">·</span>
                        <span className="text-xs text-ink-muted">Readiness: {r.readiness}%</span>
                        <span className="text-ink-faint">·</span>
                        <span className="text-xs text-ink-muted">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <VerdictBadge verdict={r.recruiterVerdict.verdict} />
                      <ArrowRight size={14} className="text-ink-faint" />
                    </div>
                  </div>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="p-8 rounded-[6px] border-2 border-dashed border-border-DEFAULT text-center">
          <p className="text-sm font-medium text-ink-muted mb-1">Run another analysis</p>
          <p className="text-xs text-ink-faint mb-4">Upload a new version of your resume to track improvement.</p>
          <Link href="/analyze">
            <Button size="sm" variant="outline" className="gap-1.5"><Plus size={14} /> New Analysis</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
