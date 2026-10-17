"use client";

import { LoadingChart } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import {
  Save,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [maintenance, setMaintenance] = useState(false);
  const [registrations, setRegistrations] = useState(true);
  const [shortlistCutoff, setShortlistCutoff] = useState(80);

  // Per-task routing configurations
  const [modelParsing, setModelParsing] = useState("openai/gpt-oss-120b");
  const [modelJd, setModelJd] = useState("openai/gpt-oss-120b");
  const [modelOptimization, setModelOptimization] = useState("openai/gpt-oss-120b");
  const [modelAts, setModelAts] = useState("openai/gpt-oss-120b");
  const [modelRecruiter, setModelRecruiter] = useState("openai/gpt-oss-120b");
  const [modelGap, setModelGap] = useState("openai/gpt-oss-120b");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await adminFetch("/api/admin/settings");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const data = json.settings;
        if (data) {
          setShortlistCutoff(data.shortlistCutoff || 80);
          setMaintenance(data.maintenance || false);
          setRegistrations(data.registrations !== false);
          
          if (data["resume-parsing"]) setModelParsing(data["resume-parsing"].model);
          if (data["jd-analysis"]) setModelJd(data["jd-analysis"].model);
          if (data["resume-optimization"]) setModelOptimization(data["resume-optimization"].model);
          if (data["ats-evaluation"]) setModelAts(data["ats-evaluation"].model);
          if (data["recruiter-simulation"]) setModelRecruiter(data["recruiter-simulation"].model);
          if (data["career-gap"]) setModelGap(data["career-gap"].model);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess("");
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortlistCutoff,
          maintenance,
          registrations,
          modelRouting: {
            "resume-parsing": { model: modelParsing },
            "jd-analysis": { model: modelJd },
            "resume-optimization": { model: modelOptimization },
            "ats-evaluation": { model: modelAts },
            "recruiter-simulation": { model: modelRecruiter },
            "career-gap": { model: modelGap },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(json.message || "Settings saved successfully!");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : undefined;
      setSuccess(`Error: ${message || "Failed to save settings"}`);
    } finally {
      setSaving(false);
    }
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
          <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Settings</h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">Control live feature flags, model routing, and system maintenance switches</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} className="gap-1">
          <Save size={13} /> Save Settings
        </Button>
      </div>

      {success && (
        <div className="bg-success-bg border border-success-border text-success p-4 rounded-[6px] text-xs flex items-center gap-2">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Flags & General Settings */}
        <div className="space-y-6">
          <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-6">
            <div>
              <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">System Feature Flags</h2>
              <p className="text-[0.6875rem] text-ink-muted">Instantly toggle critical routes and portal access</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border-DEFAULT">
                <div>
                  <span className="text-xs font-semibold text-ink block">Maintenance Lockout</span>
                  <span className="text-[0.6875rem] text-ink-muted">Redirect users to a status lockout screen</span>
                </div>
                <button onClick={() => setMaintenance(!maintenance)} className="text-ink-muted hover:text-ink transition-colors">
                  {maintenance ? <ToggleRight className="text-primary-600 w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <span className="text-xs font-semibold text-ink block">New Registrations</span>
                  <span className="text-[0.6875rem] text-ink-muted">Allow new user email creations on signup page</span>
                </div>
                <button onClick={() => setRegistrations(!registrations)} className="text-ink-muted hover:text-ink transition-colors">
                  {registrations ? <ToggleRight className="text-success w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-4">
            <div>
              <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">ATS Evaluations Settings</h2>
              <p className="text-[0.6875rem] text-ink-muted">Define cutoff ranges for shortlist verdicts</p>
            </div>

            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1.5">
                Shortlist Score Cutoff Threshold
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={shortlistCutoff}
                  onChange={(e) => setShortlistCutoff(parseInt(e.target.value))}
                  className="flex-1 accent-[#1d2b6b]"
                />
                <span className="font-mono text-xs font-bold text-ink bg-surface-muted border border-border-DEFAULT px-3 py-1.5 rounded-[5px] shrink-0">
                  {shortlistCutoff}%
                </span>
              </div>
              <span className="text-[0.6875rem] text-ink-muted mt-1.5 block">
                Minimum ATS score required to trigger a &quot;Shortlist&quot; verdict in reports.
              </span>
            </div>
          </Card>
        </div>

        {/* Smart Model Routing Table */}
        <Card variant="default" padding="md" className="bg-surface-DEFAULT border-border-DEFAULT space-y-6">
          <div>
            <h2 className="text-sm font-[800] uppercase tracking-[0.06em] text-ink">Smart Model Routing</h2>
            <p className="text-[0.6875rem] text-ink-muted">Map platform parser features to specialized LLM configurations</p>
          </div>

          <div className="space-y-4">
            {/* Parsing */}
            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1">Resume Parsing</label>
              <select
                value={modelParsing}
                onChange={(e) => setModelParsing(e.target.value)}
                className="bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink w-full cursor-pointer focus:outline-none"
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Production Default)</option>
                <option value="gpt-4o">gpt-4o (High Precision)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              </select>
            </div>

            {/* JD Analysis */}
            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1">JD Analysis</label>
              <select
                value={modelJd}
                onChange={(e) => setModelJd(e.target.value)}
                className="bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink w-full cursor-pointer focus:outline-none"
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Production Default)</option>
                <option value="gpt-4o">gpt-4o (High Precision)</option>
              </select>
            </div>

            {/* Resume Optimization */}
            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1">Resume Optimization</label>
              <select
                value={modelOptimization}
                onChange={(e) => setModelOptimization(e.target.value)}
                className="bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink w-full cursor-pointer focus:outline-none"
              >
                <option value="claude-3-5-sonnet">claude-3-5-sonnet (High Precision)</option>
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              </select>
            </div>

            {/* ATS Evaluation */}
            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1">ATS Evaluation</label>
              <select
                value={modelAts}
                onChange={(e) => setModelAts(e.target.value)}
                className="bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink w-full cursor-pointer focus:outline-none"
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Production Default)</option>
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>

            {/* Recruiter Simulation */}
            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1">Recruiter Simulation</label>
              <select
                value={modelRecruiter}
                onChange={(e) => setModelRecruiter(e.target.value)}
                className="bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink w-full cursor-pointer focus:outline-none"
              >
                <option value="claude-3-opus">claude-3-opus (High Precision)</option>
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              </select>
            </div>

            {/* Career Gap */}
            <div>
              <label className="text-[0.6875rem] font-bold text-ink-muted uppercase block mb-1">Career Gap Analysis</label>
              <select
                value={modelGap}
                onChange={(e) => setModelGap(e.target.value)}
                className="bg-surface-muted border border-border-DEFAULT rounded-[5px] px-3 py-1.5 text-xs text-ink w-full cursor-pointer focus:outline-none"
              >
                <option value="claude-3-opus">claude-3-opus (High Precision)</option>
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
