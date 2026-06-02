"use client";

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
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Health & APIs</h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">Live status checking and resources usage dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePingServices} loading={pinging} className="text-xs text-white border-[#27272a] hover:bg-[#27272a]">
          Ping Services
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* API Latencies status */}
        <div className="md:col-span-2 space-y-4">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider block mb-1">
            API Health Status
          </span>
          <div className="grid gap-3">
            {PROVIDERS_LIST.map((p) => {
              const live = healthData.find((h) => h.provider?.toLowerCase() === p.key);
              const uptime = live ? live.uptime : null;
              const latency = live && live.requests > 0 ? Math.round(live.totalLatency / live.requests) : null;

              let status = "🟢 Healthy";
              let badgeColor = "bg-emerald-950/20 text-emerald-400 border-emerald-900/40";
              if (uptime === null) {
                status = "No data";
                badgeColor = "bg-[#27272a] text-[#a1a1aa] border-transparent";
              } else if (uptime < 90) {
                status = "🔴 Offline";
                badgeColor = "bg-red-950/20 text-red-400 border-red-900/40";
              } else if (uptime < 98) {
                status = "🟡 Degraded";
                badgeColor = "bg-amber-950/20 text-amber-400 border-amber-900/40";
              }

              return (
                <div
                  key={p.key}
                  className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#09090b] flex items-center justify-center border border-[#27272a]">
                      <Cpu size={14} className="text-[#6366f1]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">{p.name}</span>
                      <span className="text-[9px] text-[#71717a] font-mono">Response time: {latency !== null ? `${latency}ms` : "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-[#a1a1aa]">Uptime: {uptime !== null ? `${uptime}%` : "N/A"}</span>
                    <Badge className={`${badgeColor} text-[9px] font-semibold flex items-center gap-1`}>
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
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider block mb-1">
            Resource Usage
          </span>
          <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
            <div className="text-center py-12 text-[#71717a] text-xs border border-dashed border-[#27272a] rounded-xl">
              Resource telemetry not available. Requires infrastructure monitoring integration.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
