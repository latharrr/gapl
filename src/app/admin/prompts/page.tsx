"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { adminFetch } from "@/lib/admin-fetch";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  History,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
} from "lucide-react";

export default function AdminPromptsPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPromptId, setSelectedPromptId] = useState("resume-parser");
  const [promptContent, setPromptContent] = useState("");
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Sandbox testing state
  const [sandboxResume, setSandboxResume] = useState("Name: John Doe\nEducation: B.Tech Computer Science\nSkills: Java, Spring Boot, Git, SQL\nExperience:\n- Built microservices using Spring Boot, increasing speed by 25%.\nProjects:\n- Deployed a REST API with authentication, PostgreSQL, and CI/CD.");
  const [sandboxRole, setSandboxRole] = useState("Senior Backend Engineer");
  const [sandboxTier, setSandboxTier] = useState("Product Startup");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [testing, setTesting] = useState(false);

  const fetchPrompts = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/prompts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load prompts");
      setPrompts(data.prompts || []);
      setHistory(data.history || []);

      // Load active prompt content
      const active = (data.prompts || []).find((p: any) => p.id === selectedPromptId);
      if (active) setPromptContent(active.content || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user]);

  // Sync content when selecting different prompt
  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    const active = prompts.find((p) => p.id === id);
    if (active) setPromptContent(active.content || "");
    setSuccessMsg("");
  };

  const handleUpdatePrompt = async () => {
    if (!user) return;
    setUpdating(true);
    setSuccessMsg("");
    setError("");
    try {
      const res = await adminFetch("/api/admin/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          promptId: selectedPromptId,
          content: promptContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save prompt");
      
      setSuccessMsg(`Successfully saved prompt. Version elevated to ${data.nextVersion}!`);
      await fetchPrompts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRollback = async (targetVersion: number) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to rollback to version ${targetVersion}?`)) return;

    setUpdating(true);
    setSuccessMsg("");
    setError("");
    try {
      const res = await adminFetch("/api/admin/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "rollback",
          promptId: selectedPromptId,
          targetVersion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute rollback");
      
      setSuccessMsg(`Successfully rolled back to version ${targetVersion}. Released new version ${data.nextVersion}!`);
      await fetchPrompts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  // Run test sandbox directly against the analyze API using custom prompt payload
  const handleTestSandbox = async () => {
    setTesting(true);
    setSandboxOutput("");
    try {
      const formData = new FormData();
      formData.append("resumeText", sandboxResume);
      formData.append("role", sandboxRole);
      formData.append("tier", sandboxTier);
      formData.append("userId", user?.uid || "");
      
      const res = await authFetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sandbox analysis failed");
      setSandboxOutput(JSON.stringify(data.result, null, 2));
    } catch (e: any) {
      setSandboxOutput(`ERROR: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
  const promptVersions = history
    .filter((h) => h.promptId === selectedPromptId)
    .sort((a, b) => b.version - a.version);

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
        <h1 className="text-xl font-bold text-white tracking-tight">Prompt Library & Versioning</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Optimize LLM instructions, inspect changes, rollback deployments, and run sandboxed tests</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Prompts Selection */}
        <div className="space-y-2">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider block mb-1">
            Prompt Templates
          </span>
          {prompts.map((p) => {
            const isSelected = p.id === selectedPromptId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPrompt(p.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-[#18181b] border-[#6366f1] text-white"
                    : "bg-transparent border-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50"
                }`}
              >
                <span>{p.name}</span>
                <Badge className="bg-[#27272a] text-[#a1a1aa] text-[9px]">v{p.version}</Badge>
              </button>
            );
          })}
        </div>

        {/* Center: Active Prompt Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPrompt ? (
            <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-white">{selectedPrompt.name}</h2>
                  <span className="text-[10px] text-[#71717a]">
                    Active Version: v{selectedPrompt.version} · Last updated: {new Date(selectedPrompt.lastUpdated).toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpdatePrompt}
                  loading={updating}
                  className="bg-[#6366f1] text-white gap-1.5 py-1.5"
                >
                  <Save size={13} /> Save & Release v{selectedPrompt.version + 1}
                </Button>
              </div>

              <div>
                <textarea
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  rows={14}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-xs text-white font-mono placeholder-[#71717a] focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-[#27272a] rounded-xl text-center py-20 text-[#71717a] text-xs">
              Select a prompt template to edit instructions.
            </div>
          )}

          {/* Test Sandbox */}
          <Card variant="default" padding="md" className="bg-[#18181b] border-[#27272a] space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Play size={14} className="text-[#6366f1]" /> Prompt Sandbox
              </h2>
              <p className="text-[10px] text-[#71717a] mt-0.5">Test output evaluations locally against the active Groq model</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Target Role</label>
                  <input
                    type="text"
                    value={sandboxRole}
                    onChange={(e) => setSandboxRole(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Company Tier</label>
                  <input
                    type="text"
                    value={sandboxTier}
                    onChange={(e) => setSandboxTier(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-[#a1a1aa] uppercase block mb-1">Mock Resume Text</label>
                <textarea
                  value={sandboxResume}
                  onChange={(e) => setSandboxResume(e.target.value)}
                  rows={4}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none resize-none"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full bg-[#18181b] border-[#27272a] hover:bg-[#202024] text-xs py-2"
                onClick={handleTestSandbox}
                loading={testing}
              >
                Execute Sandboxed Analysis
              </Button>

              {sandboxOutput && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-[#a1a1aa] uppercase block">Analysis Output Payload</span>
                  <pre className="bg-[#09090b] border border-[#27272a] p-3 rounded-lg max-h-56 overflow-y-auto text-[9px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {sandboxOutput}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Version History & Rollback */}
        <div className="space-y-3">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider block mb-1">
            Version History
          </span>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {promptVersions.map((v) => (
              <div key={v.id} className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-[#27272a] text-[#a1a1aa] text-[9px]">v{v.version}</Badge>
                    <span className="text-[9px] text-[#71717a] block mt-1">
                      {new Date(v.savedAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 py-0.5 h-auto text-[9px] border-[#27272a] text-[#a1a1aa] hover:text-white"
                    onClick={() => handleRollback(v.version)}
                    loading={updating}
                  >
                    <RotateCcw size={10} className="mr-1" /> Rollback
                  </Button>
                </div>
                <div className="bg-[#09090b] p-2 rounded text-[9px] text-[#71717a] font-mono line-clamp-3 leading-relaxed">
                  {v.content}
                </div>
                <span className="text-[8px] text-[#71717a] block">Released by {v.savedBy || "System"}</span>
              </div>
            ))}

            {promptVersions.length === 0 && (
              <div className="text-center py-10 border border-dashed border-[#27272a] rounded-xl text-[#71717a] text-[10px]">
                No historical revisions exist for this template.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
