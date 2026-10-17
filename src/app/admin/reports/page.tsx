"use client";

import { LoadingChart } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface RecruiterVerdict {
  verdict?: string;
  confidence?: number;
  reason?: string;
}

interface AdminReport {
  id: string;
  role?: string;
  companyTier?: string;
  atsScore?: number;
  readiness?: number;
  recruiterVerdict?: RecruiterVerdict;
  missingSkills?: string[];
  strongSkills?: string[];
}

export default function AdminReportsPage() {
  const { user, userDoc } = useAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [deletingId, setDeletingId] = useState("");

  const isSuperAdmin = userDoc?.role === "super_admin";

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const res = await adminFetch("/api/admin/reports");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load reports");
        if (!cancelled) setReports(data.reports || []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDeleteReport = async (reportId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to permanently delete this report?")) return;
    
    setDeletingId(reportId);
    try {
      const res = await adminFetch("/api/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "delete", reportId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete report");
      
      // Update local state
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReport?.id === reportId) setSelectedReport(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
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
        <LoadingChart />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Reports</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Audit every resume evaluation, parsed text structure, and recruiter simulation</p>
      </div>

      {error && (
        <div className="bg-danger-bg border border-danger-border text-danger p-4 rounded-[6px] text-xs">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 min-w-[240px] max-w-md items-center gap-2 bg-surface-DEFAULT border border-border-DEFAULT rounded-[5px] px-3 py-1.5">
          <Search size={14} className="text-ink-muted" />
          <input
            type="text"
            placeholder="Search by role or report ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-ink focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-DEFAULT border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink">
            <span className="text-ink-muted">Verdict:</span>
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-medium text-ink cursor-pointer"
            >
              <option value="all">All Verdicts</option>
              <option value="Shortlist">Shortlist</option>
              <option value="Maybe">Maybe</option>
              <option value="Reject">Reject</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-DEFAULT border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink">
            <span className="text-ink-muted">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-medium text-ink cursor-pointer"
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
                className={`bg-surface-DEFAULT border rounded-[6px] p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-subtle transition-all ${
                  selectedReport?.id === r.id ? "border-primary-600 bg-surface-DEFAULT" : "border-border-DEFAULT"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{r.role}</span>
                    <Badge className={`text-[0.6875rem] border font-semibold ${
                      verdict === "Shortlist" ? "bg-success-bg text-success border-success-border" :
                      verdict === "Reject" ? "bg-danger-bg text-danger border-danger-border" :
                      "bg-warning-bg text-warning border-warning-border"
                    }`}>
                      {verdict}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[0.6875rem] text-ink-muted">
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
                    className={`p-2 rounded-[5px] hover:bg-danger-bg border border-transparent hover:border-danger-border text-danger hover:text-danger transition-colors ${
                      deletingId === r.id ? "animate-pulse" : ""
                    }`}
                    title={isSuperAdmin ? "Delete report" : "Super Admin privileges required"}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={14} className="text-ink-muted" />
                </div>
              </div>
            );
          })}

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-ink-muted border border-dashed border-border-DEFAULT rounded-[6px] text-xs">
              No reports found matching selection filters.
            </div>
          )}
        </div>

        {/* Right 1/3: Report inspector panel */}
        <div>
          {selectedReport ? (
            <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-6">
              <div>
                <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block mb-1">
                  Report Inspector
                </span>
                <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">{selectedReport.role}</h2>
                <span className="text-[0.6875rem] text-ink-muted">ID: {selectedReport.id}</span>
              </div>

              {/* Recruiter Verdict block */}
              <div className="p-3.5 bg-surface-muted border border-border-DEFAULT rounded-[6px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] text-ink-muted font-medium">Recruiter Verdict</span>
                  <span className="text-[0.6875rem] font-mono text-primary-600">
                    Conf: {selectedReport.recruiterVerdict?.confidence || 80}%
                  </span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  {selectedReport.recruiterVerdict?.reason || "No verdict description was compiled."}
                </p>
              </div>

              {/* Core Skill scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-muted border border-border-DEFAULT p-3 rounded-[5px] text-center">
                  <span className="text-[0.6875rem] text-ink-muted block mb-0.5">ATS SCORE</span>
                  <span className="text-lg font-bold text-primary-600">{selectedReport.atsScore}%</span>
                </div>
                <div className="bg-surface-muted border border-border-DEFAULT p-3 rounded-[5px] text-center">
                  <span className="text-[0.6875rem] text-ink-muted block mb-0.5">READINESS</span>
                  <span className="text-lg font-bold text-success">{selectedReport.readiness}%</span>
                </div>
              </div>

              {/* Skills checklist */}
              <div className="space-y-3">
                <div>
                  <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block mb-1">
                    Missing Skills Identified
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReport.missingSkills?.map((s: string) => (
                      <Badge key={s} className="bg-danger-bg text-danger border-danger-border text-[0.6875rem]">
                        {s}
                      </Badge>
                    )) || <span className="text-[0.6875rem] text-ink-muted">None</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block mb-1">
                    Validated Strengths
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReport.strongSkills?.map((s: string) => (
                      <Badge key={s} className="bg-success-bg text-success border-success-border text-[0.6875rem]">
                        {s}
                      </Badge>
                    )) || <span className="text-[0.6875rem] text-ink-muted">None</span>}
                  </div>
                </div>
              </div>

              {/* PDF Actions / Impersonation */}
              <div className="pt-2 border-t border-border-DEFAULT">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-surface-DEFAULT border-border-DEFAULT hover:bg-surface-subtle text-xs py-2 rounded-[5px]"
                  onClick={() => window.open(`/report/${selectedReport.id}`, "_blank")}
                >
                  Open Report Details Card
                </Button>
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-border-DEFAULT rounded-[6px] text-center py-20 text-ink-muted text-xs">
              Select an analysis report to inspect detailed resume metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
