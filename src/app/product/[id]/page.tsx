"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  Sparkles,
  BarChart3,
  Copy,
  RefreshCw,
  Check,
  Lock,
  ChevronRight,
  Flame,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Product } from "@/types";
import { toast } from "sonner";

export default function ProductReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Tabs: 'matches' | 'copy' | 'launch_kit'
  const [activeTab, setActiveTab] = useState<"matches" | "copy" | "launch_kit">("matches");
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | "all">("all");

  // Single-platform copy regeneration state
  const [regeneratingSlug, setRegeneratingSlug] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Paywall state: check if product is paid or user unlocked
  const [isUnlocked, setIsUnlocked] = useState(false);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setAnalysisProgress(15);

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const res = await fetch(`/api/analyze/${productId}`, { method: "POST" });
      const data = await res.json();

      if (data.analysis) {
        setProduct((prev) => (prev ? { ...prev, ai_analysis: data.analysis, status: "analyzed" } : prev));
        setAnalysisProgress(100);
        toast.success("AI analysis complete!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Analysis generation failed. Please retry.");
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  }, [productId]);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);

          // Check if paid or has unlock flag
          const isPaid =
            data.product.status === "paid" ||
            data.product.status === "in_progress" ||
            data.product.status === "launched" ||
            localStorage.getItem(`unlocked_${productId}`) === "true";

          setIsUnlocked(isPaid);

          // If no analysis yet, run it
          if (!data.product.ai_analysis) {
            runAnalysis();
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId, runAnalysis]);

  // Handle payment redirect parameter
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setIsUnlocked(true);
      localStorage.setItem(`unlocked_${productId}`, "true");
      toast.success("Payment successful! Full Launch Kit and all 50+ platforms unlocked.");
    }
  }, [searchParams, productId]);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerateCopy = async (platformSlug: string) => {
    setRegeneratingSlug(platformSlug);
    try {
      const res = await fetch("/api/regenerate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          platformSlug,
        }),
      });
      const data = await res.json();

      if (data.success && data.copy) {
        setProduct((prev) => {
          if (!prev || !prev.ai_analysis) return prev;
          return {
            ...prev,
            ai_analysis: {
              ...prev.ai_analysis,
              tailored_copies: {
                ...prev.ai_analysis.tailored_copies,
                [platformSlug]: data.copy,
              },
            },
          };
        });
        toast.success(`Tailored copy regenerated for ${platformSlug}!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to regenerate copy.");
    } finally {
      setRegeneratingSlug(null);
    }
  };

  const handleUnlockPlan = async (plan: "launch_kit" | "done_for_you") => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          productId,
          currency: "USD",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback for instant unlock in demo mode
        setIsUnlocked(true);
        localStorage.setItem(`unlocked_${productId}`, "true");
        toast.success("Unlocked successfully!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Checkout failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading product report...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Product not found</h2>
        <Button asChild variant="outline">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const analysis = product.ai_analysis;
  const matches = analysis?.top_matches || [];
  const copies = analysis?.tailored_copies || {};
  const launchKit = analysis?.big_launch_kit;

  // Filter matches by tier if chosen
  const filteredMatches = matches.filter(
    (m) => selectedTierFilter === "all" || m.tier === selectedTierFilter
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Product Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border/60 gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg shadow-indigo-500/20 shrink-0">
            {product.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {product.name}
              </h1>
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
                {product.category}
              </Badge>
              {isUnlocked ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Full Kit Unlocked
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="w-3 h-3" /> Free Preview
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{product.tagline}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href={`/product/${product.id}/tracker`}>
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Launch Tracker
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={analyzing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "Analyzing..." : "Re-run Analysis"}
          </Button>

          {!isUnlocked && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => handleUnlockPlan("launch_kit")}
              className="gap-1.5 text-xs shadow-md shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Unlock All 50+ Platforms ($29)
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Progress Banner if in progress */}
      {analyzing && (
        <div className="p-5 rounded-2xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              Evaluating product against 50+ launch platforms &amp; generating tailored copy...
            </span>
            <span className="font-mono">{analysisProgress}%</span>
          </div>
          <Progress value={analysisProgress} />
        </div>
      )}

      {/* Strategic Executive Summary Card */}
      {analysis && (
        <div className="p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl space-y-4 glow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Strategic Positioning Angle
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Recommended Launch Window: {analysis.recommended_launch_day}
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {analysis.executive_summary}
          </p>
          <div className="pt-3 border-t border-border/40 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-white">Target Hook:</span> {analysis.positioning_angle}
            </div>
          </div>
        </div>
      )}

      {/* Core Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/60 pb-3 gap-4">
        <div className="flex items-center gap-2 bg-secondary/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "matches"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Platform Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab("copy")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "copy"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Tailored Copy ({Object.keys(copies).length})
          </button>
          <button
            onClick={() => setActiveTab("launch_kit")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "launch_kit"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Big Launch Kit
            {!isUnlocked && <Lock className="w-3 h-3 text-amber-400" />}
          </button>
        </div>

        {activeTab === "matches" && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1">Filter Tier:</span>
            {[
              { id: "all", label: "All" },
              { id: 1, label: "T1 Big Launches" },
              { id: 2, label: "T2 Directories" },
              { id: 3, label: "T3 SEO" },
              { id: 4, label: "T4 Niche" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTierFilter(t.id as "all" | 1 | 2 | 3 | 4)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedTierFilter === t.id
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: PLATFORM MATCHES */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((match, index) => {
              const isLocked = !isUnlocked && index >= 5;
              const tierBadge =
                match.tier === 1
                  ? "tier1"
                  : match.tier === 2
                  ? "tier2"
                  : match.tier === 3
                  ? "tier3"
                  : "tier4";

              return (
                <div
                  key={match.platform_slug}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isLocked
                      ? "border-border/40 bg-card/20 select-none filter blur-[3px]"
                      : "border-border/80 bg-card/50 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">
                            {match.platform_name}
                          </h4>
                          <Badge variant={tierBadge} className="text-[10px]">
                            Tier {match.tier}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400">
                          {match.score}
                        </span>
                        <span className="text-[10px] text-muted-foreground block -mt-1 font-mono">
                          / 100 FIT
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {match.reason}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Platform #{index + 1}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab("copy");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                    >
                      View Tailored Copy <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paywall Banner for Matches */}
          {!isUnlocked && matches.length > 5 && (
            <div className="p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-card/80 to-indigo-950/30 backdrop-blur-xl text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Unlock 15+ more high-fit launch platforms
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                Free preview displays your top 5 matches. Upgrade to the Launch Kit to reveal all 50+ scored platforms, domain ratings, and full tailored copy blocks.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={() => handleUnlockPlan("launch_kit")}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Unlock Full Launch Kit ($29 / ₹1,999)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TAILORED COPY */}
      {activeTab === "copy" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {matches.map((match, idx) => {
              const copy = copies[match.platform_slug];
              const isLocked = !isUnlocked && idx >= 2;

              if (!copy && !isLocked) return null;

              return (
                <div
                  key={match.platform_slug}
                  className={`p-6 rounded-2xl border transition-all relative ${
                    isLocked
                      ? "border-border/40 bg-card/20 select-none filter blur-[4px]"
                      : "border-border/80 bg-card/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-white text-sm uppercase">
                        {match.platform_name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          {match.platform_name}
                          <Badge variant="outline" className="text-[10px] text-indigo-300 border-indigo-500/30">
                            Fit: {match.score}%
                          </Badge>
                        </h4>
                        <span className="text-[11px] text-muted-foreground">
                          Tone applied: {copy?.tone_applied || "Platform-tailored"}
                        </span>
                      </div>
                    </div>

                    {!isLocked && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={regeneratingSlug === match.platform_slug}
                          onClick={() => handleRegenerateCopy(match.platform_slug)}
                          className="h-8 text-xs gap-1"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              regeneratingSlug === match.platform_slug ? "animate-spin" : ""
                            }`}
                          />
                          Regenerate
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleCopyText(
                              `${copy.title_or_tagline}\n\n${copy.body_or_description}${
                                copy.maker_comment ? `\n\n[First Comment]:\n${copy.maker_comment}` : ""
                              }`,
                              `copy-${match.platform_slug}`
                            )
                          }
                          className="h-8 text-xs gap-1"
                        >
                          {copiedKey === `copy-${match.platform_slug}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy Listing
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isLocked && copy && (
                    <div className="space-y-4 pt-4">
                      {/* Title / Tagline */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Title / Tagline:
                          </span>
                          <span className="font-mono text-[10px]">
                            {copy.title_or_tagline.length} chars
                          </span>
                        </div>
                        <div className="p-3 rounded-lg border border-border/80 bg-background/50 text-sm text-white font-medium flex items-center justify-between">
                          <span>{copy.title_or_tagline}</span>
                          <button
                            onClick={() => handleCopyText(copy.title_or_tagline, `title-${match.platform_slug}`)}
                            className="text-muted-foreground hover:text-white p-1"
                          >
                            {copiedKey === `title-${match.platform_slug}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Body / Description */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Description / Post Body:
                          </span>
                          <span className="font-mono text-[10px]">
                            {copy.body_or_description.length} chars
                          </span>
                        </div>
                        <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                          {copy.body_or_description}
                        </div>
                      </div>

                      {/* Maker first comment if applicable */}
                      {copy.maker_comment && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold text-purple-300">
                              Maker First Comment (Pinned):
                            </span>
                          </div>
                          <div className="p-3.5 rounded-lg border border-purple-500/20 bg-purple-950/10 text-xs sm:text-sm text-purple-200/90 whitespace-pre-wrap leading-relaxed">
                            {copy.maker_comment}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paywall Banner for Copy */}
          {!isUnlocked && (
            <div className="p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-card/80 to-indigo-950/30 backdrop-blur-xl text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Unlock All 50+ Platform Copy Blocks
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                Free plan includes 2 copy samples. Upgrade to Launch Kit to unlock full tailored copy for Product Hunt, Hacker News, Reddit, BetaList, DevHunt, and 45+ other directories.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={() => handleUnlockPlan("launch_kit")}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Unlock Full Launch Kit ($29 / ₹1,999)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BIG LAUNCH KIT (PAID ONLY) */}
      {activeTab === "launch_kit" && (
        <div className="space-y-8">
          {!isUnlocked ? (
            /* Blurred Paywall for Launch Kit */
            <div className="p-12 rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-card/90 to-indigo-950/40 backdrop-blur-2xl text-center space-y-6 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Big Launch Kit is locked
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Big Launch Kit provides everything needed to conquer the 3 biggest channels: Product Hunt, Show HN, and Reddit, with hour-by-hour checklists and maker comments.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left text-xs">
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
                  <div className="font-semibold text-white">Product Hunt Kit</div>
                  <p className="text-muted-foreground">3 tagline variations, 4 gallery slide drafts, maker comment &amp; timeline.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
                  <div className="font-semibold text-white">Show HN Kit</div>
                  <p className="text-muted-foreground">Zero-hype technical post title, architecture explanation, HN founder etiquette.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
                  <div className="font-semibold text-white">Reddit Launch Kit</div>
                  <p className="text-muted-foreground">3 subreddit-specific drafts (r/SideProject, r/SaaS, r/indiehackers) + rules alerts.</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={() => handleUnlockPlan("launch_kit")}
                  className="gap-2 px-8"
                >
                  <Sparkles className="w-4 h-4" />
                  Unlock Launch Kit for $29 / ₹1,999
                </Button>

                <Button
                  variant="default"
                  size="lg"
                  onClick={() => handleUnlockPlan("done_for_you")}
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Let Our Team Submit (Done-For-You $99)
                </Button>
              </div>
            </div>
          ) : launchKit ? (
            /* Unlocked Big Launch Kit View */
            <div className="space-y-8 animate-fade-in">
              {/* SECTION A: PRODUCT HUNT */}
              <div className="p-6 rounded-2xl border border-orange-500/30 bg-card/60 backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                      P
                    </span>
                    Product Hunt Launch Kit
                  </h3>
                  <Badge variant="outline" className="border-orange-500/40 text-orange-300">
                    Tier 1 Big Launch
                  </Badge>
                </div>

                {/* Tagline Options */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tagline Options (Under 60 chars)
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {launchKit.product_hunt.tagline_options.map((tagline, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-border/80 bg-background/50 flex items-center justify-between text-sm"
                      >
                        <span className="text-white font-medium">{tagline}</span>
                        <button
                          onClick={() => handleCopyText(tagline, `ph-tag-${i}`)}
                          className="text-muted-foreground hover:text-white p-1"
                        >
                          {copiedKey === `ph-tag-${i}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maker First Comment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Maker First Comment (Post at 12:01 AM PST)
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText(launchKit.product_hunt.maker_first_comment, "ph-maker-comm")
                      }
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedKey === "ph-maker-comm" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy Comment
                    </button>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-background/50 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                    {launchKit.product_hunt.maker_first_comment}
                  </div>
                </div>

                {/* Hour-by-Hour Launch Day Checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Hour-by-Hour Launch Day Timeline
                  </span>
                  <div className="space-y-2">
                    {launchKit.product_hunt.launch_day_checklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border/60 bg-background/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-indigo-400 font-semibold shrink-0">
                            {item.time}
                          </span>
                          <span className="text-white font-medium">{item.action}</span>
                        </div>
                        <span className="text-muted-foreground">{item.tips}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION B: SHOW HN */}
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-card/60 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                      Y
                    </span>
                    Show HN Launch Kit (Hacker News)
                  </h3>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                    Strict Zero Hype
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90 leading-relaxed">
                  <strong>HN Community Rule:</strong> Never ask colleagues to upvote. Keep answers hyper-technical. Admit limitations candidly.
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Post Title:</span>
                  <div className="p-3 rounded-lg border border-border/80 bg-background/50 font-mono text-sm text-white flex items-center justify-between">
                    <span>{launchKit.show_hn.title}</span>
                    <button
                      onClick={() => handleCopyText(launchKit.show_hn.title, "hn-title")}
                      className="text-muted-foreground hover:text-white"
                    >
                      {copiedKey === "hn-title" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Post Body:</span>
                    <button
                      onClick={() => handleCopyText(launchKit.show_hn.post_body, "hn-body")}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedKey === "hn-body" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy Show HN Text
                    </button>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-background/50 text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-mono">
                    {launchKit.show_hn.post_body}
                  </div>
                </div>
              </div>

              {/* SECTION C: REDDIT LAUNCH DRAFTS */}
              <div className="p-6 rounded-2xl border border-blue-500/30 bg-card/60 backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                      r/
                    </span>
                    Reddit Launch Kit (3 Subreddits)
                  </h3>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-300">
                    Self-Promo Rules Checked
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {launchKit.reddit.map((redditPost, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          Subreddit: {redditPost.subreddit}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyText(
                              `${redditPost.title}\n\n${redditPost.post_body}`,
                              `reddit-${index}`
                            )
                          }
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {copiedKey === `reddit-${index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy Draft
                        </button>
                      </div>

                      <div className="text-xs p-2 rounded bg-red-950/20 border border-red-500/20 text-red-300 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{redditPost.rules_warning}</span>
                      </div>

                      <div className="text-xs font-semibold text-white">
                        Title: {redditPost.title}
                      </div>

                      <div className="p-3 rounded-lg border border-border/60 bg-background/60 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {redditPost.post_body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
