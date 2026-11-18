"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Search,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProductPlatform, Product, SubmissionStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function LaunchTrackerPage() {
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<ProductPlatform[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedUtm, setCopiedUtm] = useState<string | null>(null);

  useEffect(() => {
    async function loadTracker() {
      try {
        const res = await fetch(`/api/tracker/${productId}`);
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
          setProduct(data.product);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      loadTracker();
    }
  }, [productId]);

  const updateItemStatus = async (platformId: string, newStatus: SubmissionStatus) => {
    try {
      const res = await fetch(`/api/tracker/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId,
          status: newStatus,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.platform_id === platformId || item.id === platformId
              ? { ...item, status: newStatus, submitted_at: new Date().toISOString() }
              : item
          )
        );
        toast.success(`Status updated to "${newStatus}"`);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const updateLiveUrl = async (platformId: string, liveUrl: string) => {
    try {
      await fetch(`/api/tracker/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId,
          live_url: liveUrl,
        }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.platform_id === platformId || item.id === platformId
            ? { ...item, live_url: liveUrl }
            : item
        )
      );
      toast.success("Live URL saved!");
    } catch {
      toast.error("Failed to save live URL");
    }
  };

  const copyUtm = (utm: string, id: string) => {
    navigator.clipboard.writeText(utm);
    setCopiedUtm(id);
    toast.success("Unique UTM link copied to clipboard!");
    setTimeout(() => setCopiedUtm(null), 2000);
  };

  // Stats
  const total = items.length;
  const liveCount = items.filter((i) => i.status === "live").length;
  const submittedCount = items.filter(
    (i) => i.status === "submitted" || i.status === "pending review"
  ).length;
  const progressPercent = total > 0 ? Math.round(((liveCount + submittedCount * 0.5) / total) * 100) : 0;

  const filteredItems = items.filter((item) => {
    const name = item.platform?.name || item.platform_id;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading launch tracker...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-white">
              <Link href={`/product/${productId}`}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Report
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              Distribution Engine
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {product?.name || "Product"} Launch Tracker
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track live directory listings, submission statuses, proof screenshots, and UTM link performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
            <Link href={`/product/${productId}`}>
              <Sparkles className="w-4 h-4 text-purple-400" />
              View Copy &amp; Launch Kit
            </Link>
          </Button>
        </div>
      </div>

      {/* Progress & Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Card */}
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-card/60 backdrop-blur-md md:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-white flex items-center gap-1.5">
              <Rocket className="w-4 h-4 text-indigo-400" />
              Overall Launch Progress
            </span>
            <span className="text-indigo-300 font-mono text-sm">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>{liveCount} Live Listings</span>
            <span>{submittedCount} Pending Review</span>
            <span>{total} Total Targeted</span>
          </div>
        </div>

        {/* Live Card */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md">
          <div className="text-xs text-muted-foreground mb-1">Live Listings</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {liveCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Approved &amp; indexing</div>
        </div>

        {/* In Progress Card */}
        <div className="p-5 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md">
          <div className="text-xs text-muted-foreground mb-1">Pending / Review</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {submittedCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Awaiting directory moderation</div>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search platform name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-border bg-background/50 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {["all", "live", "submitted", "pending review", "not started", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tracker Table */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground border-b border-border/80 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Platform</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Status</th>
                <th className="p-4">Live URL / Proof</th>
                <th className="p-4">Unique UTM Link</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No platforms matching current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const platName = item.platform?.name || item.platform_id;
                  const tier = item.platform?.tier || 2;
                  const submitUrl = item.platform?.submit_url || item.platform?.url || "#";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-secondary/30 transition-colors group"
                    >
                      {/* Platform */}
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{platName}</span>
                          {item.platform?.domain_rating && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              (DR {item.platform.domain_rating})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="p-4">
                        <Badge
                          variant={
                            tier === 1
                              ? "tier1"
                              : tier === 2
                              ? "tier2"
                              : tier === 3
                              ? "tier3"
                              : "tier4"
                          }
                          className="text-[10px]"
                        >
                          Tier {tier}
                        </Badge>
                      </td>

                      {/* Status Selector */}
                      <td className="p-4">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateItemStatus(item.platform_id, e.target.value as SubmissionStatus)
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold focus:outline-none border ${
                            item.status === "live"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              : item.status === "submitted" || item.status === "pending review"
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                              : item.status === "rejected"
                              ? "border-red-500/40 bg-red-500/10 text-red-400"
                              : "border-border bg-background/50 text-muted-foreground"
                          }`}
                        >
                          <option value="not started">Not Started</option>
                          <option value="submitted">Submitted</option>
                          <option value="pending review">Pending Review</option>
                          <option value="live">Live</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Live URL */}
                      <td className="p-4">
                        {item.live_url ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={item.live_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline max-w-[160px] truncate block"
                            >
                              {item.live_url}
                            </a>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </div>
                        ) : (
                          <input
                            type="url"
                            placeholder="Paste live URL..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateLiveUrl(item.platform_id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim().length > 0) {
                                updateLiveUrl(item.platform_id, e.target.value);
                              }
                            }}
                            className="w-36 px-2 py-0.5 rounded border border-border/80 bg-background/50 text-[11px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      </td>

                      {/* Unique UTM Link */}
                      <td className="p-4">
                        <button
                          onClick={() => copyUtm(item.utm_link, item.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/80 border border-border hover:bg-secondary text-[11px] text-muted-foreground hover:text-white transition-colors"
                          title="Click to copy unique UTM link"
                        >
                          {copiedUtm === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="font-mono">
                            {copiedUtm === item.id ? "Copied!" : "Copy UTM Link"}
                          </span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-muted-foreground font-mono text-[11px]">
                        {formatDate(item.submitted_at)}
                      </td>

                      {/* Submit action */}
                      <td className="p-4 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] gap-1 hover:text-white">
                          <a href={submitUrl} target="_blank" rel="noreferrer">
                            Submit <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
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
