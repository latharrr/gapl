"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Link as LinkIcon,
  Plus,
  MousePointer,
  Sparkles,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLinksPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchLinks = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/links");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load shortlinks");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLinks(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl || !name) {
      toast.error("Link Name and Target URL are required");
      return;
    }
    setCreating(true);
    try {
      const res = await adminFetch("/api/admin/links", {
        method: "POST",
        body: JSON.stringify({
          targetUrl,
          name,
          campaignId: campaignId || "manual_campaign",
          customSlug: customSlug || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create shortlink");

      toast.success("Shortlink generated successfully!");
      // Reset form
      setName("");
      setTargetUrl("");
      setCampaignId("");
      setCustomSlug("");
      fetchLinks(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Shortlink copied to clipboard");
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
        <h2 className="text-md font-bold text-white">Failed to Compile Shortlink Metrics</h2>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" size="sm" onClick={() => fetchLinks()}>
            Retry Fetch
          </Button>
        </div>
      </div>
    );
  }

  const { links, metrics, campaigns } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f23] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LinkIcon size={18} className="text-[#6366f1]" />
            <h1 className="text-xl font-bold tracking-tight text-white">Trackable Shortlinks</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Redirect and attribution manager for links routing from links.gapl.in custom domains.
          </p>
        </div>
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

      {/* Main Grid: Generator + Analytics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 h-fit space-y-5">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-[#6366f1]" />
            <h2 className="text-sm font-semibold text-white">Create Shortlink</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Link Name</label>
              <Input
                placeholder="e.g. Welcome Start Analysis Button"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#09090b] border-[#27272a] text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Target URL Path</label>
              <Input
                placeholder="e.g. /analyze or /report/123"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-[#09090b] border-[#27272a] text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Campaign ID</label>
                <Input
                  placeholder="e.g. welcome_email"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="bg-[#09090b] border-[#27272a] text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Custom Slug (Opt)</label>
                <Input
                  placeholder="e.g. start"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="bg-[#09090b] border-[#27272a] text-xs text-white"
                />
              </div>
            </div>
            <Button type="submit" disabled={creating} className="w-full text-xs font-semibold">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate Redirect Link"
              )}
            </Button>
          </form>
        </div>

        {/* Clicks Stats Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Total Click Events</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-white">{metrics.totalClicks}</span>
                <span className="text-xs text-[#a1a1aa]">raw actions</span>
              </div>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">Unique Visitors</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-white text-emerald-400">{metrics.totalUniqueClicks}</span>
                <span className="text-xs text-[#a1a1aa]">
                  {metrics.totalClicks > 0 ? ((metrics.totalUniqueClicks / metrics.totalClicks) * 100).toFixed(0) : 0}% unique
                </span>
              </div>
            </div>
          </div>

          {/* Campaigns Click breakdown */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Clicks by Campaign Source</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.length === 0 ? (
                <div className="text-xs text-[#71717a] col-span-2">No campaigns loaded.</div>
              ) : (
                campaigns.map((c: any) => (
                  <div key={c.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white capitalize">{c.name}</div>
                      <div className="text-[10px] text-[#71717a] mt-0.5">{c.linksCount} shortlinks registered</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-white">{c.clicks} clicks</div>
                      <div className="text-[10px] text-emerald-400 font-medium">{c.unique} unique</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracked Shortlinks Directory */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Shortlinks Directory</h2>
          <Badge variant="primary">{links.length} total active</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#a1a1aa]">
            <thead className="bg-[#09090b] text-[10px] uppercase font-bold text-[#71717a] border-b border-[#27272a]">
              <tr>
                <th className="px-6 py-3">Link Info</th>
                <th className="px-6 py-3">Short Redirect URL</th>
                <th className="px-6 py-3 text-center">Clicks</th>
                <th className="px-6 py-3 text-center">Unique Clicks</th>
                <th className="px-6 py-3 text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#71717a]">
                    No links tracked. Create one above to get started.
                  </td>
                </tr>
              ) : (
                links.map((link: any) => {
                  const shortUrl = `https://links.gapl.in/${link.id}`;
                  return (
                    <tr key={link.id} className="hover:bg-[#18181b]/55 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{link.name}</div>
                        <div className="text-[10px] text-[#71717a] mt-0.5 font-mono">
                          Targets: <span className="text-white hover:underline">{link.targetUrl}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white text-[11px] font-semibold">{shortUrl}</span>
                          <button
                            onClick={() => copyToClipboard(shortUrl)}
                            className="p-1 hover:text-white text-[#71717a] transition-colors rounded hover:bg-[#27272a]"
                            title="Copy link"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="text-[10px] text-[#71717a] mt-0.5">
                          Campaign: <span className="font-medium text-[#6366f1]">{link.campaignId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-white">{link.clickCount}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-400">{link.uniqueClicks}</td>
                      <td className="px-6 py-4 text-right text-[#71717a]">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
