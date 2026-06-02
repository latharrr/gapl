"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  History,
  Search,
  Shield,
  Loader2,
  Calendar,
  Info,
} from "lucide-react";

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/audit-logs", {
        headers: { "x-admin-uid": user.uid },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load audit logs");
      
      const sorted = (data.logs || []).sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLogs(sorted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Audit Logs Trail</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Immutable tracking logs of all actions performed by administrators, super admins, and support agents</p>
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
            placeholder="Search audit trail by email, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-[#71717a] focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#1c1c1f] text-[#71717a] font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target</th>
                <th className="px-5 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredLogs.map((l) => {
                const dateStr = new Date(l.timestamp).toLocaleString();
                const act = l.action || "Unknown";

                return (
                  <tr key={l.id} className="hover:bg-[#202024] transition-colors text-white">
                    <td className="px-5 py-4 font-mono text-[10px] text-[#71717a]">
                      {dateStr}
                    </td>
                    <td className="px-5 py-4 text-white font-medium text-[10px]">
                      {l.adminEmail}
                    </td>
                    <td className="px-5 py-4 text-[10px]">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        l.adminRole === "super_admin" ? "bg-purple-950/20 text-purple-400 border border-purple-900/40" :
                        "bg-[#27272a] text-[#a1a1aa]"
                      }`}>
                        {l.adminRole?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        act.includes("Refund") ? "bg-amber-950/20 text-amber-400 border border-amber-900/40" :
                        act.includes("Delete") ? "bg-red-950/20 text-red-400 border border-red-900/40" :
                        act.includes("Role") ? "bg-blue-950/20 text-blue-400 border border-blue-900/40" :
                        "bg-[#27272a] text-white"
                      }`}>
                        {act}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[10px] text-[#a1a1aa] font-mono">
                      {l.targetUser || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-[#a1a1aa] max-w-sm truncate leading-relaxed">
                      {l.details}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#71717a]">
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
