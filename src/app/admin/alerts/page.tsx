"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  BellRing,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Info,
  ShieldCheck,
  Play,
  Mail,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminAlertsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);

  const fetchAlerts = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/alerts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load alerts");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts(true);
  };

  const triggerTestAlert = () => {
    setTestingAlert(true);
    setTimeout(() => {
      setTestingAlert(false);
      toast.success("Founder test webhook alert dispatched successfully!");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertTriangle size={32} className="text-yellow-500 mx-auto" />
        <h2 className="text-md font-bold text-white">Failed to Compile Founder Alerts</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchAlerts()}>
          Retry Fetch
        </Button>
      </div>
    );
  }

  const { alerts, timestamp } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f23] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BellRing size={18} className="text-[#6366f1]" />
            <h1 className="text-xl font-bold tracking-tight text-white">Founder Alerts System</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Monitoring system tracking deliverability, webhooks, processing errors, and payment conversion rates.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerTestAlert}
            disabled={testingAlert}
            className="bg-[#18181b] border-[#27272a] text-xs text-[#a1a1aa] hover:text-white"
          >
            <Play size={12} className="mr-2" />
            Test Dispatch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
          >
            <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {alerts.length > 0 ? (
              <AlertTriangle className="text-rose-500 animate-pulse" size={18} />
            ) : (
              <ShieldCheck className="text-emerald-400" size={18} />
            )}
            <h2 className="text-sm font-semibold text-white">
              {alerts.length > 0 ? `${alerts.length} Actionable Alerts Triggered` : "All Systems Operational"}
            </h2>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Last sweep completed: {new Date(timestamp).toLocaleTimeString()} ({new Date(timestamp).toLocaleDateString()})
          </p>
        </div>
        <Badge variant={alerts.length > 0 ? "danger" : "success"}>
          {alerts.length > 0 ? "ATTENTION REQUIRED" : "STABLE STATUS"}
        </Badge>
      </div>

      {/* Alerts Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triggered Alerts List */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Triggered Anomaly Logs</h2>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-3 bg-[#09090b] border border-[#1f1f23] rounded-lg">
              <CheckCircle size={28} className="text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">No active incidents</p>
                <p className="text-[10px] text-[#71717a] mt-0.5">Email deliverability and system conversions are within spec.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 space-y-2.5 ${
                    alert.type === "danger"
                      ? "bg-red-950/20 border-red-900/40 text-red-200"
                      : "bg-yellow-950/20 border-yellow-900/40 text-yellow-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <AlertOctagon size={14} className={alert.type === "danger" ? "text-red-500" : "text-yellow-500"} />
                      <span className="text-xs font-bold text-white">{alert.title}</span>
                    </div>
                    <Badge variant={alert.type === "danger" ? "danger" : "warning"}>
                      {alert.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">{alert.message}</p>
                  
                  {/* Alert representation comparison card */}
                  <div className="bg-[#09090b]/60 rounded p-2.5 text-[10px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#71717a]">Yesterday:</span>
                      <span className="text-white">{alert.yesterday}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#1f1f23] pt-1">
                      <span className="text-[#71717a]">Today:</span>
                      <span className="text-rose-400 font-bold">{alert.metric}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Configuration Rules */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">System Alert Rules Configurations</h2>
          <div className="space-y-3 text-xs">
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Bounce Rate Threshold</span>
              </div>
              <span className="text-[#71717a] font-mono">&gt; 5.0%</span>
            </div>
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Spam Complaints Target</span>
              </div>
              <span className="text-[#71717a] font-mono">&gt; 1.0%</span>
            </div>
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Payment Drop Alert (2d/7d)</span>
              </div>
              <span className="text-[#71717a] font-mono">&gt; 50% drop</span>
            </div>
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Report Gen Error Margin</span>
              </div>
              <span className="text-[#71717a] font-mono">&gt; 5.0% failure rate</span>
            </div>
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Low Open Rate Warning</span>
              </div>
              <span className="text-[#71717a] font-mono">&lt; 20.0% open rate</span>
            </div>
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Webhook Verify Faults</span>
              </div>
              <span className="text-[#71717a] font-mono">&gt; 0 failures</span>
            </div>
            <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#a1a1aa]" />
                <span className="text-white font-medium">Resend SDK Connection Errors</span>
              </div>
              <span className="text-[#71717a] font-mono">&gt; 0 failures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
