"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function AdminReportsPage() {
  const { user, userDoc } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState("");

  const isSuperAdmin = userDoc?.role === "super_admin";

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reports", {
        headers: { "x-admin-uid": user.uid },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reports");
      setReports(data.reports || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const handleDeleteReport = async (reportId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to permanently delete this report?")) return;
    
    setDeletingId(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": user.uid,
        },
        body: JSON.stringify({ action: "delete", reportId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete report");
      
      // Update local state
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReport?.id === reportId) setSelectedReport(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingId("");
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      (r.role || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.id || "").toLowerCase().includes(search.toLowerCase());
    
    const verdict = r.recruiterVerdict?.verdict || "Maybe";
    const matchesVerdict = verdictFilter === "all" || verdict === verdictFilter;
    const matchesTier = tierFilter === "all" || r.companyTier === tierFilter;

    return matchesSearch && matchesVerdict && matchesTier;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Reports Analytics</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Audit every resume evaluation, parsed text structure, and recruiter simulation</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 min-w-[240px] max-w-md items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5">
          <Search size={14} className="text-[#71717a]" />
          <input
            type="text"
            placeholder="Search by role or report ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-[#71717a] focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white">
            <span className="text-[#71717a]">Verdict:</span>
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-medium text-white cursor-pointer"
            >
              <option value="all">All Verdicts</option>
              <option value="Shortlist">Shortlist</option>
              <option value="Maybe">Maybe</option>
              <option value="Reject">Reject</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white">
            <span className="text-[#71717a]">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-medium text-white cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="Top Product">Top Product</option>
              <option value="Product Startup">Product Startup</option>
              <option value="Mass Recruiter">Mass Recruiter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Reports list */}
        <div className="lg:col-span-2 space-y-3">
          {filteredReports.map((r) => {
            const verdict = r.recruiterVerdict?.verdict || "Maybe";
            return (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className={`bg-[#18181b] border rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#202024] transition-all ${
                  selectedReport?.id === r.id ? "border-[#6366f1] bg-[#18181b]/80" : "border-[#27272a]"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{r.role}</span>
                    <Badge className={`text-[9px] border font-semibold ${
                      verdict === "Shortlist" ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" :
                      verdict === "Reject" ? "bg-red-950/20 text-red-400 border-red-900/40" :
                      "bg-amber-950/20 text-amber-400 border-amber-900/40"
                    }`}>
                      {verdict}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#71717a]">
                    <span>ID: {r.id}</span>
                    <span>·</span>
                    <span>Tier: {r.companyTier}</span>
                    <span>·</span>
                    <span>Score: {r.atsScore}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={!isSuperAdmin}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReport(r.id);
                    }}
                    className={`p-2 rounded-lg hover:bg-red-950/20 border border-transparent hover:border-red-900/40 text-red-500 hover:text-red-400 transition-colors ${
                      deletingId === r.id ? "animate-pulse" : ""
                    }`}
                    title={isSuperAdmin ? "Delete report" : "Super Admin privileges required"}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={14} className="text-[#71717a]" />
                </div>
              </div>
            );
          })}

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-[#71717a] border border-dashed border-[#27272a] rounded-xl text-xs">
              No reports found matching selection filters.
            </div>
          )}
        </div>

        {/* Right 1/3: Report inspector panel */}
        <div>
          {selectedReport ? (
            <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-6">
              <div>
                <span className="text-[10px] text-[#71717a] font-semibold uppercase tracking-wider block mb-1">
                  Report Inspector
                </span>
                <h2 className="text-sm font-bold text-white">{selectedReport.role}</h2>
                <span className="text-[10px] text-[#71717a]">ID: {selectedReport.id}</span>
              </div>

              {/* Recruiter Verdict block */}
              <div className="p-3.5 bg-[#09090b] border border-[#27272a] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#a1a1aa] font-medium">Recruiter Verdict</span>
                  <span className="text-[10px] font-mono text-[#6366f1]">
                    Conf: {selectedReport.recruiterVerdict?.confidence || 80}%
                  </span>
                </div>
                <p className="text-xs text-white leading-relaxed">
                  {selectedReport.recruiterVerdict?.reason || "No verdict description was compiled."}
                </p>
              </div>

              {/* Core Skill scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#71717a] block mb-0.5">ATS SCORE</span>
                  <span className="text-lg font-bold text-[#6366f1]">{selectedReport.atsScore}%</span>
                </div>
                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#71717a] block mb-0.5">READINESS</span>
                  <span className="text-lg font-bold text-emerald-400">{selectedReport.readiness}%</span>
                </div>
              </div>

              {/* Skills checklist */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-[#a1a1aa] font-bold uppercase tracking-wider block mb-1">
                    Missing Skills Identified
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReport.missingSkills?.map((s: string) => (
                      <Badge key={s} className="bg-red-950/20 text-red-400 border-red-900/40 text-[9px]">
                        {s}
                      </Badge>
                    )) || <span className="text-[10px] text-[#71717a]">None</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#a1a1aa] font-bold uppercase tracking-wider block mb-1">
                    Validated Strengths
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReport.strongSkills?.map((s: string) => (
                      <Badge key={s} className="bg-emerald-950/20 text-emerald-400 border-emerald-900/40 text-[9px]">
                        {s}
                      </Badge>
                    )) || <span className="text-[10px] text-[#71717a]">None</span>}
                  </div>
                </div>
              </div>

              {/* PDF Actions / Impersonation */}
              <div className="pt-2 border-t border-[#27272a]">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-[#18181b] border-[#27272a] hover:bg-[#202024] text-xs py-2 rounded-lg"
                  onClick={() => window.open(`/report/${selectedReport.id}`, "_blank")}
                >
                  Open Report Details Card
                </Button>
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-[#27272a] rounded-xl text-center py-20 text-[#71717a] text-xs">
              Select an analysis report to inspect detailed resume metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
