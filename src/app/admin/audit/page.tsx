"use client";

import { Loading } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import {
  Search,
} from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail?: string;
  adminRole?: string;
  action?: string;
  targetUser?: string;
  details?: string;
}

interface AuditLogsResponse {
  logs?: AuditLog[];
  error?: string;
}

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const res = await adminFetch("/api/admin/audit-logs");
        const data: AuditLogsResponse = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load audit logs");

        const sorted = (data.logs || []).sort(
          (a: AuditLog, b: AuditLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        if (!cancelled) setLogs(sorted);
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

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      (l.adminEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.details || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.targetUser || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Audit log</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Immutable tracking logs of all actions performed by administrators, super admins, and support agents</p>
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
            placeholder="Search audit trail by email, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-ink focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-DEFAULT bg-surface-subtle text-ink-muted font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target</th>
                <th className="px-5 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-DEFAULT">
              {filteredLogs.map((l) => {
                const dateStr = new Date(l.timestamp).toLocaleString();
                const act = l.action || "Unknown";

                return (
                  <tr key={l.id} className="hover:bg-surface-subtle transition-colors text-ink">
                    <td className="px-5 py-4 font-mono text-[0.6875rem] text-ink-muted">
                      {dateStr}
                    </td>
                    <td className="px-5 py-4 text-ink font-medium text-[0.6875rem]">
                      {l.adminEmail}
                    </td>
                    <td className="px-5 py-4 text-[0.6875rem]">
                      <span className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                        l.adminRole === "super_admin" ? "bg-primary-50 text-primary-600 border border-primary-100" :
                        "bg-surface-subtle text-ink-muted"
                      }`}>
                        {l.adminRole?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                        act.includes("Refund") ? "bg-warning-bg text-warning border border-warning-border" :
                        act.includes("Delete") ? "bg-danger-bg text-danger border border-danger-border" :
                        act.includes("Role") ? "bg-primary-50 text-primary-600 border border-primary-100" :
                        "bg-surface-subtle text-ink"
                      }`}>
                        {act}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[0.6875rem] text-ink-muted font-mono">
                      {l.targetUser || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-ink-muted max-w-sm truncate leading-relaxed">
                      {l.details}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-ink-muted">
                    No administrative audit logs registered in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
