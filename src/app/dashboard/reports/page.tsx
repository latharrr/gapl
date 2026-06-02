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
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-[#111111]">
            Reports
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-[#71717a] mt-0.5">
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
          <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5]" />
        </div>
      ) : reports.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-10 h-10 bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText size={18} className="text-[#71717a]" />
          </div>
          <p className="text-sm font-medium text-[#111111] mb-1">No reports yet</p>
          <p className="text-xs text-[#71717a] mb-4">Run your first analysis to see results here.</p>
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
                    <div className="w-10 h-10 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[#71717a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-[#111111]">{r.role}</p>
                        <span className="text-[#a1a1aa]">·</span>
                        <p className="text-xs text-[#71717a]">{r.companyTier}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#71717a]">ATS: {r.atsScore}%</span>
                        <span className="text-[#a1a1aa]">·</span>
                        <span className="text-xs text-[#71717a]">Readiness: {r.readiness}%</span>
                        <span className="text-[#a1a1aa]">·</span>
                        <span className="text-xs text-[#71717a]">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <VerdictBadge verdict={r.recruiterVerdict.verdict} />
                      <ArrowRight size={14} className="text-[#a1a1aa]" />
                    </div>
                  </div>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="p-8 rounded-xl border-2 border-dashed border-[#e4e4e7] text-center">
          <p className="text-sm font-medium text-[#71717a] mb-1">Run another analysis</p>
          <p className="text-xs text-[#a1a1aa] mb-4">Upload a new version of your resume to track improvement.</p>
          <Link href="/analyze">
            <Button size="sm" variant="outline" className="gap-1.5"><Plus size={14} /> New Analysis</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
