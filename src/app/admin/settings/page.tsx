"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Settings,
  Shield,
  Save,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [maintenance, setMaintenance] = useState(false);
  const [registrations, setRegistrations] = useState(true);
  const [shortlistCutoff, setShortlistCutoff] = useState(80);

  // Per-task routing configurations
  const [modelParsing, setModelParsing] = useState("openai/gpt-oss-120b");
  const [modelJd, setModelJd] = useState("openai/gpt-oss-120b");
  const [modelOptimization, setModelOptimization] = useState("claude-3-5-sonnet");
  const [modelAts, setModelAts] = useState("openai/gpt-oss-120b");
  const [modelRecruiter, setModelRecruiter] = useState("claude-3-opus");
  const [modelGap, setModelGap] = useState("claude-3-opus");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const routeRef = doc(db, "settings", "routing");
        const snap = await getDoc(routeRef);
        if (snap.exists()) {
          const data = snap.data();
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
      const routeRef = doc(db, "settings", "routing");
      await setDoc(routeRef, {
        shortlistCutoff,
        maintenance,
        registrations,
        "resume-parsing": { model: modelParsing, provider: modelParsing.includes("claude") ? "Anthropic" : "Groq" },
        "jd-analysis": { model: modelJd, provider: modelJd.includes("claude") ? "Anthropic" : "Groq" },
        "resume-optimization": { model: modelOptimization, provider: modelOptimization.includes("claude") ? "Anthropic" : "Groq" },
        "ats-evaluation": { model: modelAts, provider: modelAts.includes("claude") ? "Anthropic" : "Groq" },
        "recruiter-simulation": { model: modelRecruiter, provider: modelRecruiter.includes("claude") ? "Anthropic" : "Groq" },
        "career-gap": { model: modelGap, provider: modelGap.includes("claude") ? "Anthropic" : "Groq" },
      });
      setSuccess("Dynamic model routing and platform flags saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Settings</h1>
          <p className="text-xs text-[#a1a1aa] mt-0.5">Control live feature flags, model routing, and system maintenance switches</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} className="bg-[#6366f1] text-white py-1.5 gap-1">
          <Save size={13} /> Save Settings
        </Button>
      </div>

      {success && (
        <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Flags & General Settings */}
        <div className="space-y-6">
          <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white">System Feature Flags</h2>
              <p className="text-[10px] text-[#71717a]">Instantly toggle critical routes and portal access</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 py-2 border-b border-[#27272a]">
                <div>
                  <span className="text-xs font-semibold text-white block">Maintenance Lockout</span>
                  <span className="text-[10px] text-[#71717a]">Redirect users to a status lockout screen</span>
                </div>
                <button onClick={() => setMaintenance(!maintenance)} className="text-[#a1a1aa] hover:text-white transition-colors">
                  {maintenance ? <ToggleRight className="text-[#6366f1] w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <span className="text-xs font-semibold text-white block">New Registrations</span>
                  <span className="text-[10px] text-[#71717a]">Allow new user email creations on signup page</span>
                </div>
                <button onClick={() => setRegistrations(!registrations)} className="text-[#a1a1aa] hover:text-white transition-colors">
                  {registrations ? <ToggleRight className="text-emerald-400 w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white">ATS Evaluations Settings</h2>
              <p className="text-[10px] text-[#71717a]">Define cutoff ranges for shortlist verdicts</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#a1a1aa] uppercase block mb-1.5">
                Shortlist Score Cutoff Threshold
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={shortlistCutoff}
                  onChange={(e) => setShortlistCutoff(parseInt(e.target.value))}
                  className="flex-1 accent-[#6366f1]"
                />
                <span className="font-mono text-xs font-bold text-white bg-[#09090b] border border-[#27272a] px-3 py-1.5 rounded-lg shrink-0">
                  {shortlistCutoff}%
                </span>
              </div>
              <span className="text-[9px] text-[#71717a] mt-1.5 block">
                Minimum ATS score required to trigger a "Shortlist" verdict in reports.
              </span>
            </div>
          </Card>
        </div>

        {/* Smart Model Routing Table */}
        <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white">Smart Model Routing</h2>
            <p className="text-[10px] text-[#71717a]">Map platform parser features to specialized LLM configurations</p>
          </div>

          <div className="space-y-4">
            {/* Parsing */}
            <div>
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Resume Parsing</label>
              <select
                value={modelParsing}
                onChange={(e) => setModelParsing(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white w-full cursor-pointer focus:outline-none"
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Production Default)</option>
                <option value="gpt-4o">gpt-4o (High Precision)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              </select>
            </div>

            {/* JD Analysis */}
            <div>
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">JD Analysis</label>
              <select
                value={modelJd}
                onChange={(e) => setModelJd(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white w-full cursor-pointer focus:outline-none"
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Production Default)</option>
                <option value="gpt-4o">gpt-4o (High Precision)</option>
              </select>
            </div>

            {/* Resume Optimization */}
            <div>
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Resume Optimization</label>
              <select
                value={modelOptimization}
                onChange={(e) => setModelOptimization(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white w-full cursor-pointer focus:outline-none"
              >
                <option value="claude-3-5-sonnet">claude-3-5-sonnet (High Precision)</option>
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              </select>
            </div>

            {/* ATS Evaluation */}
            <div>
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">ATS Evaluation</label>
              <select
                value={modelAts}
                onChange={(e) => setModelAts(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white w-full cursor-pointer focus:outline-none"
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Production Default)</option>
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>

            {/* Recruiter Simulation */}
            <div>
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Recruiter Simulation</label>
              <select
                value={modelRecruiter}
                onChange={(e) => setModelRecruiter(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white w-full cursor-pointer focus:outline-none"
              >
                <option value="claude-3-opus">claude-3-opus (High Precision)</option>
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
              </select>
            </div>

            {/* Career Gap */}
            <div>
              <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Career Gap Analysis</label>
              <select
                value={modelGap}
                onChange={(e) => setModelGap(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white w-full cursor-pointer focus:outline-none"
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
