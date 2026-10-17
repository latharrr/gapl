"use client";

import { LoadingChart } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Database,
  Cloud,
  Cpu,
  Server,
} from "lucide-react";

const PROVIDERS_LIST = [
  { key: "groq", name: "Groq API" },
  { key: "openai", name: "OpenAI API" },
  { key: "anthropic", name: "Anthropic API" },
  { key: "gemini", name: "Gemini API" },
  { key: "deepseek", name: "DeepSeek API" },
  { key: "mistral", name: "Mistral API" },
  { key: "openrouter", name: "OpenRouter" },
];

export default function AdminHealthPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [healthData, setHealthData] = useState<any[]>([]);

  const fetchHealth = async () => {
    if (!user) return;
    try {
      const res = await adminFetch("/api/admin/stats");
      const data = await res.ok ? await res.json() : null;
      if (data && data.providerHealth) {
        setHealthData(data.providerHealth);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [user]);

  const handlePingServices = async () => {
    setPinging(true);
    await fetchHealth();
    setTimeout(() => {
      setPinging(false);
    }, 1000);
  };

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
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">System health</h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Live status checking and resources usage dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePingServices} loading={pinging} className="text-xs text-ink border-border-DEFAULT hover:bg-surface-subtle">
          Ping Services
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* API Latencies status */}
        <div className="md:col-span-2 space-y-4">
          <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block mb-1">
            API Health Status
          </span>
          <div className="grid gap-3">
            {PROVIDERS_LIST.map((p) => {
              const live = healthData.find((h) => h.provider?.toLowerCase() === p.key);
              const uptime = live ? live.uptime : null;
              const latency = live && live.requests > 0 ? Math.round(live.totalLatency / live.requests) : null;

              let status = "🟢 Healthy";
              let badgeColor = "bg-success-bg text-success border-success-border";
              if (uptime === null) {
                status = "No data";
                badgeColor = "bg-surface-subtle text-ink-muted border-transparent";
              } else if (uptime < 90) {
                status = "🔴 Offline";
                badgeColor = "bg-danger-bg text-danger border-danger-border";
              } else if (uptime < 98) {
                status = "🟡 Degraded";
                badgeColor = "bg-warning-bg text-warning border-warning-border";
              }

              return (
                <div
                  key={p.key}
                  className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[5px] bg-surface-muted flex items-center justify-center border border-border-DEFAULT">
                      <Cpu size={14} className="text-primary-600" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ink block">{p.name}</span>
                      <span className="text-[0.6875rem] text-ink-muted font-mono">Response time: {latency !== null ? `${latency}ms` : "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[0.6875rem] font-mono text-ink-muted">Uptime: {uptime !== null ? `${uptime}%` : "N/A"}</span>
                    <Badge className={`${badgeColor} text-[0.6875rem] font-semibold flex items-center gap-1`}>
                      {status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System parameters */}
        <div className="space-y-4">
          <span className="text-[0.6875rem] text-ink-muted font-bold uppercase tracking-wider block mb-1">
            Resource Usage
          </span>
          <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
            <div className="text-center py-12 text-ink-muted text-xs border border-dashed border-border-DEFAULT rounded-[6px]">
              Resource telemetry not available. Requires infrastructure monitoring integration.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
