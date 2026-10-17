"use client";

import { LoadingChart } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Eye,
} from "lucide-react";

interface AICall {
  id: string;
  timestamp: string;
  model?: string;
  userId?: string;
  cost?: number;
  tokensInput?: number;
  tokensOutput?: number;
  latency: number;
  status: string;
  prompt?: string;
  response?: string;
  error?: string;
}

interface AICallsResponse {
  calls?: AICall[];
  error?: string;
}

export default function AdminAICallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<AICall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState<AICall | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const res = await adminFetch("/api/admin/ai-calls");
        const data: AICallsResponse = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load AI logs");

        // Sort chronologically by timestamp
        const sorted = (data.calls || []).sort(
          (a: AICall, b: AICall) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        if (!cancelled) setCalls(sorted);
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
        <LoadingChart />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">AI calls</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Real-time observability and cost metrics across Groq and OpenAI providers</p>
      </div>

      {error && (
        <div className="bg-danger-bg border border-danger-border text-danger p-4 rounded-[6px] text-xs">
          {error}
        </div>
      )}

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Accumulated AI Spend</span>
          <p className="text-lg font-bold text-ink mt-1.5">${totalCost.toFixed(4)}</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Estimated API cost (USD)</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Total Tokens Billed</span>
          <p className="text-lg font-bold text-ink mt-1.5">{totalTokens.toLocaleString()}</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Input + Output token sums</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Provider Failure Rate</span>
          <p className="text-lg font-bold text-danger mt-1.5">{failureRate.toFixed(1)}%</p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">AI invocation timeouts/limits</span>
        </Card>
        <Card variant="default" padding="sm" className="bg-surface-DEFAULT border-border-DEFAULT">
          <span className="text-[0.6875rem] text-ink-muted font-semibold uppercase tracking-wider block">Average Latency</span>
          <p className="text-lg font-bold text-ink mt-1.5">
            {(calls.reduce((acc, c) => acc + (c.latency || 0), 0) / (calls.length || 1) / 1000).toFixed(2)}s
          </p>
          <span className="text-[0.6875rem] text-ink-muted mt-0.5 block">Mean call roundtrip response time</span>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-1 min-w-[240px] max-w-md items-center gap-2 bg-surface-DEFAULT border border-border-DEFAULT rounded-[5px] px-3 py-1.5">
          <Search size={14} className="text-ink-muted" />
          <input
            type="text"
            placeholder="Search by User UID, model, prompt content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-ink focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-surface-DEFAULT border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink">
          <span className="text-ink-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs font-medium text-ink cursor-pointer"
          >
            <option value="all">All States</option>
            <option value="success">Success</option>
            <option value="error">Failure</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Calls logs */}
        <div className="lg:col-span-2 bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-DEFAULT bg-surface-subtle text-ink-muted font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-DEFAULT">
                {filteredCalls.map((c) => {
                  const date = new Date(c.timestamp).toLocaleTimeString();
                  const isSuccess = c.status === "success";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCall(c)}
                      className={`cursor-pointer hover:bg-surface-subtle transition-colors text-ink ${
                        selectedCall?.id === c.id ? "bg-surface-subtle" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-ink-muted font-mono text-[0.6875rem]">
                        {date}
                      </td>
                      <td className="px-4 py-3.5 max-w-[120px] truncate font-mono text-[0.6875rem]">
                        {c.model?.replace("openai/", "")}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted text-[0.6875rem] truncate max-w-[80px]">
                        {c.userId}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-warning text-[0.6875rem]">
                        ${c.cost?.toFixed(5)}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted font-mono text-[0.6875rem]">
                        {(c.latency / 1000).toFixed(2)}s
                      </td>
                      <td className="px-4 py-3.5">
                        {isSuccess ? (
                          <span className="text-success font-semibold flex items-center gap-1 text-[0.6875rem]">
                            <CheckCircle size={10} /> Success
                          </span>
                        ) : (
                          <span className="text-danger font-semibold flex items-center gap-1 text-[0.6875rem]">
                            <AlertTriangle size={10} /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Eye size={12} className="inline text-ink-muted" />
                      </td>
                    </tr>
                  );
                })}
                {filteredCalls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-ink-muted">
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
            <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
              <div>
                <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block">
                  AI Log Inspector
                </span>
                <span className="text-[0.6875rem] text-ink font-mono block mt-1">ID: {selectedCall.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[0.6875rem] bg-surface-muted border border-border-DEFAULT p-3 rounded-[5px] font-mono">
                <div>
                  <span className="text-ink-muted block">INPUT TOKENS</span>
                  <span className="text-ink">{selectedCall.tokensInput || 0}</span>
                </div>
                <div>
                  <span className="text-ink-muted block">OUTPUT TOKENS</span>
                  <span className="text-ink">{selectedCall.tokensOutput || 0}</span>
                </div>
              </div>

              {/* Prompt template */}
              <div className="space-y-1.5">
                <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block">
                  Prompt Sent to LLM
                </span>
                <div className="bg-surface-muted border border-border-DEFAULT p-2.5 rounded-[5px] max-h-36 overflow-y-auto font-mono text-[0.6875rem] text-ink-muted whitespace-pre-wrap leading-relaxed">
                  {selectedCall.prompt}
                </div>
              </div>

              {/* LLM output response */}
              <div className="space-y-1.5">
                <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block">
                  Response Received
                </span>
                {selectedCall.status === "success" ? (
                  <div className="bg-surface-muted border border-border-DEFAULT p-2.5 rounded-[5px] max-h-40 overflow-y-auto font-mono text-[0.6875rem] text-ink-muted whitespace-pre-wrap leading-relaxed">
                    {selectedCall.response}
                  </div>
                ) : (
                  <div className="bg-danger-bg border border-danger-border p-2.5 rounded-[5px] text-[0.6875rem] text-danger font-semibold leading-relaxed">
                    Error Log: {selectedCall.error || "No crash log recorded."}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-border-DEFAULT rounded-[6px] text-center py-20 text-ink-muted text-xs">
              Select an AI transaction log to inspect prompt-response details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
