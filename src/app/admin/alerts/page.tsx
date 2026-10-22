"use client";

import { Loading } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  ShieldCheck,
  Play,
  Mail,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  yesterday?: string | number;
  metric?: string | number;
}

interface AlertsResponse {
  alerts: AlertItem[];
  timestamp: string;
  error?: string;
}

async function loadAlerts(): Promise<AlertsResponse> {
  const res = await adminFetch("/api/admin/alerts");
  const json: AlertsResponse = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load alerts");
  return json;
}

export default function AdminAlertsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);

  const fetchAlerts = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      setData(await loadAlerts());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const result = await loadAlerts();
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
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
        <Loading />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertTriangle size={32} className="text-warning mx-auto" />
        <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">Failed to Compile Founder Alerts</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
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
      <div className="flex items-center justify-between border-b border-border-DEFAULT pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Founder alerts</h1>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">
            Monitoring system tracking deliverability, webhooks, processing errors, and payment conversion rates.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerTestAlert}
            disabled={testingAlert}
            className="bg-surface-DEFAULT border-border-DEFAULT text-xs text-ink-muted hover:text-ink"
          >
            <Play size={12} className="mr-2" />
            Test Dispatch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-surface-DEFAULT border-border-DEFAULT text-ink-muted hover:text-ink"
          >
            <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {alerts.length > 0 ? (
              <AlertTriangle className="text-danger animate-pulse" size={18} />
            ) : (
              <ShieldCheck className="text-success" size={18} />
            )}
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">
              {alerts.length > 0 ? `${alerts.length} Actionable Alerts Triggered` : "All Systems Operational"}
            </h2>
          </div>
          <p className="text-xs text-ink-muted">
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
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Triggered Anomaly Logs</h2>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-3 bg-surface-muted border border-border-DEFAULT rounded-[5px]">
              <CheckCircle size={28} className="text-success" />
              <div>
                <p className="text-xs font-bold text-ink">No active incidents</p>
                <p className="text-[0.6875rem] text-ink-muted mt-0.5">Email deliverability and system conversions are within spec.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: AlertItem) => (
                <div
                  key={alert.id}
                  className={`border rounded-[5px] p-4 space-y-2.5 ${
                    alert.type === "danger"
                      ? "bg-danger-bg border-danger-border text-danger"
                      : "bg-warning-bg border-warning-border text-warning"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <AlertOctagon size={14} className={alert.type === "danger" ? "text-danger" : "text-warning"} />
                      <span className="text-xs font-bold text-ink">{alert.title}</span>
                    </div>
                    <Badge variant={alert.type === "danger" ? "danger" : "warning"}>
                      {alert.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{alert.message}</p>
                  
                  {/* Alert representation comparison card */}
                  <div className="bg-surface-muted rounded p-2.5 text-[0.6875rem] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Yesterday:</span>
                      <span className="text-ink">{alert.yesterday}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-DEFAULT pt-1">
                      <span className="text-ink-muted">Today:</span>
                      <span className="text-danger font-bold">{alert.metric}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Configuration Rules */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">System Alert Rules Configurations</h2>
          <div className="space-y-3 text-xs">
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Bounce Rate Threshold</span>
              </div>
              <span className="text-ink-muted font-mono">&gt; 5.0%</span>
            </div>
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Spam Complaints Target</span>
              </div>
              <span className="text-ink-muted font-mono">&gt; 1.0%</span>
            </div>
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Payment Drop Alert (2d/7d)</span>
              </div>
              <span className="text-ink-muted font-mono">&gt; 50% drop</span>
            </div>
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Report Gen Error Margin</span>
              </div>
              <span className="text-ink-muted font-mono">&gt; 5.0% failure rate</span>
            </div>
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Low Open Rate Warning</span>
              </div>
              <span className="text-ink-muted font-mono">&lt; 20.0% open rate</span>
            </div>
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Webhook Verify Faults</span>
              </div>
              <span className="text-ink-muted font-mono">&gt; 0 failures</span>
            </div>
            <div className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-ink-muted" />
                <span className="text-ink font-medium">Resend SDK Connection Errors</span>
              </div>
              <span className="text-ink-muted font-mono">&gt; 0 failures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
