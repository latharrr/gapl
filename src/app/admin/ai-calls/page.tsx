"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Cpu,
  Coins,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Loader2,
} from "lucide-react";

export default function AdminAICallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState<any | null>(null);

  const fetchCalls = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-calls", {
        headers: { "x-admin-uid": user.uid },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load AI logs");
      
      // Sort chronologically by timestamp
      const sorted = (data.calls || []).sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setCalls(sorted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [user]);

  // Aggregate stats
  const totalCost = calls.reduce((acc, c) => acc + (c.cost || 0), 0);
  const totalTokens = calls.reduce((acc, c) => acc + (c.tokensInput || 0) + (c.tokensOutput || 0), 0);
  const failureCount = calls.filter((c) => c.status === "error").length;
  const failureRate = calls.length > 0 ? (failureCount / calls.length) * 100 : 0;

  // Filtered list
  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      (c.userId || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.model || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.prompt || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <h1 className="text-xl font-bold text-white tracking-tight">AI Calls Tracker</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Real-time observability and cost metrics across Groq and OpenAI providers</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Accumulated AI Spend</span>
          <p className="text-lg font-bold text-white mt-1.5">${totalCost.toFixed(4)}</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Estimated API cost (USD)</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Total Tokens Billed</span>
          <p className="text-lg font-bold text-white mt-1.5">{totalTokens.toLocaleString()}</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Input + Output token sums</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Provider Failure Rate</span>
          <p className="text-lg font-bold text-red-400 mt-1.5">{failureRate.toFixed(1)}%</p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">AI invocation timeouts/limits</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-[#18181b] border-[#27272a]">
          <span className="text-[10px] text-[#a1a1aa] font-semibold uppercase tracking-wider block">Average Latency</span>
          <p className="text-lg font-bold text-white mt-1.5">
            {(calls.reduce((acc, c) => acc + (c.latency || 0), 0) / (calls.length || 1) / 1000).toFixed(2)}s
          </p>
          <span className="text-[9px] text-[#71717a] mt-0.5 block">Mean call roundtrip response time</span>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 min-w-[240px] max-w-md items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5">
          <Search size={14} className="text-[#71717a]" />
          <input
            type="text"
            placeholder="Search by User UID, model, prompt content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-[#71717a] focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white">
          <span className="text-[#71717a]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs font-medium text-white cursor-pointer"
          >
            <option value="all">All States</option>
            <option value="success">Success</option>
            <option value="error">Failure</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Calls logs */}
        <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#1c1c1f] text-[#71717a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredCalls.map((c) => {
                  const date = new Date(c.timestamp).toLocaleTimeString();
                  const isSuccess = c.status === "success";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCall(c)}
                      className={`cursor-pointer hover:bg-[#202024] transition-colors text-white ${
                        selectedCall?.id === c.id ? "bg-[#202024]" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-[#71717a] font-mono text-[10px]">
                        {date}
                      </td>
                      <td className="px-4 py-3.5 max-w-[120px] truncate font-mono text-[10px]">
                        {c.model?.replace("openai/", "")}
                      </td>
                      <td className="px-4 py-3.5 text-[#a1a1aa] text-[10px] truncate max-w-[80px]">
                        {c.userId}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-amber-400 text-[10px]">
                        ${c.cost?.toFixed(5)}
                      </td>
                      <td className="px-4 py-3.5 text-[#71717a] font-mono text-[10px]">
                        {(c.latency / 1000).toFixed(2)}s
                      </td>
                      <td className="px-4 py-3.5">
                        {isSuccess ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                            <CheckCircle size={10} /> Success
                          </span>
                        ) : (
                          <span className="text-red-400 font-semibold flex items-center gap-1 text-[10px]">
                            <AlertTriangle size={10} /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Eye size={12} className="inline text-[#71717a]" />
                      </td>
                    </tr>
                  );
                })}
                {filteredCalls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#71717a]">
                      No AI call logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1/3: Payload inspector */}
        <div>
          {selectedCall ? (
            <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
              <div>
                <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider block">
                  AI Log Inspector
                </span>
                <span className="text-[10px] text-white font-mono block mt-1">ID: {selectedCall.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#09090b] border border-[#27272a] p-3 rounded-lg font-mono">
                <div>
                  <span className="text-[#71717a] block">INPUT TOKENS</span>
                  <span className="text-white">{selectedCall.tokensInput || 0}</span>
                </div>
                <div>
                  <span className="text-[#71717a] block">OUTPUT TOKENS</span>
                  <span className="text-white">{selectedCall.tokensOutput || 0}</span>
                </div>
              </div>

              {/* Prompt template */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#a1a1aa] font-bold uppercase tracking-wider block">
                  Prompt Sent to LLM
                </span>
                <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded-lg max-h-36 overflow-y-auto font-mono text-[9px] text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">
                  {selectedCall.prompt}
                </div>
              </div>

              {/* LLM output response */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#a1a1aa] font-bold uppercase tracking-wider block">
                  Response Received
                </span>
                {selectedCall.status === "success" ? (
                  <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded-lg max-h-40 overflow-y-auto font-mono text-[9px] text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">
                    {selectedCall.response}
                  </div>
                ) : (
                  <div className="bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-semibold leading-relaxed">
                    Error Log: {selectedCall.error || "No crash log recorded."}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-[#27272a] rounded-xl text-center py-20 text-[#71717a] text-xs">
              Select an AI transaction log to inspect prompt-response details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
