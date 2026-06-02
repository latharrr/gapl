"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserCVs, type SavedCV } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Wand2, Plus, TrendingUp, Calendar, Building2, Loader2, FileText } from "lucide-react";

function formatDate(val: SavedCV["createdAt"]): string {
  try {
    const d = typeof val === "object" && "toDate" in val ? val.toDate() : new Date(val as unknown as string);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function MyCVsPage() {
  const { user } = useAuth();
  const [cvs, setCVs] = useState<SavedCV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserCVs(user.uid)
      .then(setCVs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-ink">
            My CVs
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-ink-muted mt-0.5">
            All your AI-built resumes, saved automatically
          </motion.p>
        </div>
        <Link href="/cv-builder">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus size={14} /> Build New CV
          </Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-ink-muted" />
        </div>
      ) : cvs.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 bg-surface-subtle border border-border-DEFAULT rounded-2xl flex items-center justify-center mb-4">
            <Wand2 size={20} className="text-ink-muted" />
          </div>
          <h2 className="text-sm font-semibold text-ink mb-1">No CVs yet</h2>
          <p className="text-xs text-ink-muted mb-6 max-w-xs">
            Build your first AI-optimised resume targeting 90+ ATS score.
          </p>
          <Link href="/cv-builder">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Wand2 size={14} /> Build your first CV
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cvs.map((cv, i) => {
            const improvement = cv.atsScore - cv.originalAtsScore;
            return (
              <motion.div
                key={cv.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-[#e4e4e7] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#a1a1aa] transition-colors"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 bg-[#f4f4f5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-[#71717a]" />
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    cv.atsScore >= 90 ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fefce8] text-[#b45309]"
                  )}>
                    ATS {cv.atsScore}%
                  </span>
                </div>

                {/* Info */}
                <div>
                  <p className="text-sm font-semibold text-[#111] truncate">{cv.name || "Unnamed"}</p>
                  <p className="text-xs text-[#71717a] mt-0.5 truncate">{cv.role}</p>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 text-xs text-[#71717a]">
                    <Building2 size={10} /> {cv.companyType}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#71717a]">
                    <TrendingUp size={10} /> +{improvement}% ATS
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#71717a]">
                    <Calendar size={10} /> {formatDate(cv.createdAt)}
                  </span>
                </div>

                {/* Action */}
                <Link href="/cv-builder" className="mt-auto">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <Wand2 size={12} /> Rebuild with updates
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
