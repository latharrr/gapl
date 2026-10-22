"use client";

import { Loading } from "@/components/ui/Sheet";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  Copy,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface FirestoreTimestamp {
  toDate: () => Date;
}

interface ShortLink {
  id: string;
  name?: string;
  targetUrl?: string;
  campaignId?: string;
  clickCount?: number;
  uniqueClicks?: number;
  createdAt?: string | FirestoreTimestamp | null;
}

interface LinkCampaign {
  id: string;
  name?: string;
  linksCount?: number;
  clicks?: number;
  unique?: number;
}

interface LinkMetrics {
  totalClicks?: number;
  totalUniqueClicks?: number;
}

interface LinksData {
  links?: ShortLink[];
  metrics?: LinkMetrics;
  campaigns?: LinkCampaign[];
}

interface LinksResponse extends LinksData {
  error?: string;
}

async function loadLinks(): Promise<LinksResponse> {
  const res = await adminFetch("/api/admin/links");
  const json: LinksResponse = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load shortlinks");
  return json;
}

function formatShortLinkDate(createdAt: ShortLink["createdAt"]): string {
  if (typeof createdAt === "string") return new Date(createdAt).toLocaleDateString();
  if (createdAt && typeof createdAt.toDate === "function") {
    return createdAt.toDate().toLocaleDateString();
  }
  return "N/A";
}

export default function AdminLinksPage() {
  const { user } = useAuth();
  const [data, setData] = useState<LinksResponse | null>(null);
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
      setData(await loadLinks());
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
        const result = await loadLinks();
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
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
        <Loading />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <AlertTriangle size={32} className="text-warning mx-auto" />
        <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">Failed to Compile Shortlink Metrics</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" size="sm" onClick={() => fetchLinks()}>
            Retry Fetch
          </Button>
        </div>
      </div>
    );
  }

  const { links = [], metrics = {}, campaigns = [] } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-DEFAULT pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="display text-[clamp(1.9rem,4vw,2.6rem)]">Trackable links</h1>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">
            Redirect and attribution manager for links routing from links.gapl.in custom domains.
          </p>
        </div>
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

      {/* Main Grid: Generator + Analytics Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Card */}
        <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-6 h-fit space-y-5">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-primary-600" />
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Create Shortlink</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Link Name</label>
              <Input
                placeholder="e.g. Welcome Start Analysis Button"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surface-muted border-border-DEFAULT text-xs text-ink"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Target URL Path</label>
              <Input
                placeholder="e.g. /analyze or /report/123"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-surface-muted border-border-DEFAULT text-xs text-ink"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Campaign ID</label>
                <Input
                  placeholder="e.g. welcome_email"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="bg-surface-muted border-border-DEFAULT text-xs text-ink"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Custom Slug (Opt)</label>
                <Input
                  placeholder="e.g. start"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="bg-surface-muted border-border-DEFAULT text-xs text-ink"
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
            <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 flex flex-col justify-between">
              <span className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Total Click Events</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-ink">{metrics.totalClicks}</span>
                <span className="text-xs text-ink-muted">raw actions</span>
              </div>
            </div>
            <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 flex flex-col justify-between">
              <span className="text-[0.6875rem] uppercase font-bold text-ink-muted tracking-wider">Unique Visitors</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-extrabold text-ink text-success">{metrics.totalUniqueClicks}</span>
                <span className="text-xs text-ink-muted">
                  {metrics.totalClicks ? ((metrics.totalUniqueClicks ?? 0) / metrics.totalClicks * 100).toFixed(0) : 0}% unique
                </span>
              </div>
            </div>
          </div>

          {/* Campaigns Click breakdown */}
          <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Clicks by Campaign Source</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.length === 0 ? (
                <div className="text-xs text-ink-muted col-span-2">No campaigns loaded.</div>
              ) : (
                campaigns.map((c: LinkCampaign) => (
                  <div key={c.id} className="bg-surface-muted border border-border-DEFAULT rounded-[5px] p-3 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-ink capitalize">{c.name}</div>
                      <div className="text-[0.6875rem] text-ink-muted mt-0.5">{c.linksCount} shortlinks registered</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-ink">{c.clicks} clicks</div>
                      <div className="text-[0.6875rem] text-success font-medium">{c.unique} unique</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tracked Shortlinks Directory */}
      <div className="bg-surface-DEFAULT border border-border-DEFAULT rounded-[6px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border-DEFAULT flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-ink">Shortlinks Directory</h2>
          <Badge variant="primary">{links.length} total active</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-surface-muted text-[0.6875rem] uppercase font-bold text-ink-muted border-b border-border-DEFAULT">
              <tr>
                <th className="px-6 py-3">Link Info</th>
                <th className="px-6 py-3">Short Redirect URL</th>
                <th className="px-6 py-3 text-center">Clicks</th>
                <th className="px-6 py-3 text-center">Unique Clicks</th>
                <th className="px-6 py-3 text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-DEFAULT">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-ink-muted">
                    No links tracked. Create one above to get started.
                  </td>
                </tr>
              ) : (
                links.map((link: ShortLink) => {
                  const trackingDomain = process.env.NEXT_PUBLIC_TRACKING_DOMAIN || "links.gapl.in";
                  const shortUrl = `https://${trackingDomain}/${link.id}`;
                  return (
                    <tr key={link.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{link.name}</div>
                        <div className="text-[0.6875rem] text-ink-muted mt-0.5 font-mono">
                          Targets: <span className="text-ink hover:underline">{link.targetUrl}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-ink text-xs font-semibold">{shortUrl}</span>
                          <button
                            onClick={() => copyToClipboard(shortUrl)}
                            className="p-1 hover:text-ink text-ink-muted transition-colors rounded hover:bg-surface-subtle"
                            title="Copy link"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="text-[0.6875rem] text-ink-muted mt-0.5">
                          Campaign: <span className="font-medium text-primary-600">{link.campaignId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-ink">{link.clickCount}</td>
                      <td className="px-6 py-4 text-center font-bold text-success">{link.uniqueClicks}</td>
                      <td className="px-6 py-4 text-right text-ink-muted">
                        {formatShortLinkDate(link.createdAt)}
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
