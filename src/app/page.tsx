"use client";

import Link from "next/link";
import { LaunchPreview } from "@/components/launch-preview";
import { useState } from "react";
import {
  Rocket,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_PLATFORMS } from "@/lib/data/platforms-seed";

export default function LandingPage() {
  const [selectedTier, setSelectedTier] = useState<number | "all">("all");
  const [platformSearch, setPlatformSearch] = useState("");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [freeOnly, setFreeOnly] = useState(false);
  const searchTerm = platformSearch.trim().toLowerCase();

  const filteredPlatforms = SEED_PLATFORMS.filter((p) => {
    const matchesTier = selectedTier === "all" || p.tier === selectedTier;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      p.categories.some((c) => c.toLowerCase().includes(searchTerm));
    return matchesTier && matchesSearch && (!freeOnly || p.is_free);
  });

  const faqs = [
    {
      q: "How does the AI analysis actually work?",
      a: "We evaluate your product's category, pricing model, tech stack, and target audience against our database of 35 launch platforms. The AI scores each platform's fit from 0 to 100, writes one-line strategic reasoning, and generates listings that strictly observe that platform's character limits and community tone rules.",
    },
    {
      q: "Can I publish drafts on Reddit or Hacker News as-is?",
      a: "Review the draft, add your own context, and check the community’s current rules before you post. Moderators decide what stays up. LaunchPilot provides drafts and guidance for each channel.",
    },
    {
      q: "What is included in the Done-For-You ($99 / ₹6,999) plan?",
      a: "Everything in the Launch Kit, plus our experienced team aims to submit your product to eligible directories within 7 business days. Your tracker records submission proof and live URLs when a listing is approved. Each directory decides whether to accept a submission.",
    },
    {
      q: "Can I try it for free?",
      a: "Yes! Submitting your product is 100% free with no credit card required. You'll immediately receive your top 5 platform matches with fit scores and 2 complete copy samples.",
    },
    {
      q: "Do you use automated bots to submit to directories?",
      a: "No bots. Automated bot submissions often trigger CAPTCHA failures or immediate account bans. On our Done-For-You plan, every submission is done by human operators who format screenshots, create verified maker accounts where required, and follow submission guidelines.",
    },
    {
      q: "Can I track my launch results?",
      a: "Yes. Every platform matched in your Launch Tracker comes with an auto-generated unique UTM link (`?utm_source={platform}&utm_campaign=launchpilot`) so you can track exact referral traffic and signups in your own Google Analytics, Plausible, or PostHog.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="gradient-mesh border-b border-white/5">
        <div className="container mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-8 lg:py-28">
          <div className="space-y-6">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Sparkles aria-hidden="true" className="h-4 w-4" /> Launch planning for indie founders
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl">
              You shipped it.{" "}
              <span className="block bg-gradient-to-r from-indigo-300 to-violet-200 bg-clip-text text-transparent">
                Now get it seen.
              </span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-300">
              Tailored launches on 35 platforms. Find where your product fits, get copy for each community,
              and track your submissions in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="brand" size="lg" className="gap-2">
                <Link href="/submit">Submit Your Product Free <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#platforms">Explore platforms</Link>
              </Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-400" />
              No credit card required for the free preview
            </p>
          </div>
          <LaunchPreview />
        </div>
      </section>

      {/* 2. HOW IT WORKS (3 STEPS) */}
      <section id="how-it-works" className="py-20 border-t border-border/60 bg-background/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 mb-3">
              Frictionless Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              From fresh build to everywhere in 3 steps
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Enter your product details once and reuse them across your launch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl mb-5">
                  01
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Submit Product Free</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your product URL, tagline, tech stack, and audience. We save your draft automatically with no credit card required.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" /> Multi-step form with character counters
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" /> Instant draft persistence
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl border border-indigo-500/30 bg-card/50 backdrop-blur-md shadow-lg shadow-indigo-500/5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl mb-5">
                  02
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Analyzes &amp; Tailors Copy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our engine matches your product against 35 platforms across 4 tiers. It generates custom listings respecting each platform&apos;s limits and community rules.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" /> HN technical / PH punchy / Reddit story
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400" /> Never invents fake metrics or quotes
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl mb-5">
                  03
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Launch Solo or Done-For-You</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use our Launch Tracker and hour-by-hour checklists to submit yourself, or upgrade to Done-For-You and let our team manually submit to eligible platforms.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/40 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" /> Live submission proofs &amp; status tracker
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" /> Unique UTM attribution links per channel
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORMS DIRECTORY (35 COVERED) */}
      <section id="platforms" className="scroll-mt-20 py-20 border-t border-border/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Platforms We Cover &amp; Tailor For
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Every platform has distinct culture, character limits, and audience expectations. We map and score every single one.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                aria-label="Search platforms"
                placeholder="Search platform or category..."
                value={platformSearch}
                onChange={(e) => setPlatformSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card/60 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              aria-pressed={selectedTier === "all"}
              onClick={() => setSelectedTier("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              All Platforms ({SEED_PLATFORMS.length})
            </button>
            <button
              aria-pressed={selectedTier === 1}
              onClick={() => setSelectedTier(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === 1
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              Tier 1: Big Launches (PH, HN, Reddit)
            </button>
            <button
              aria-pressed={selectedTier === 2}
              onClick={() => setSelectedTier(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === 2
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              Tier 2: Launch Directories
            </button>
            <button
              aria-pressed={selectedTier === 3}
              onClick={() => setSelectedTier(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === 3
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              Tier 3: SEO &amp; Backlinks (DR 70-90+)
            </button>
            <button
              aria-pressed={selectedTier === 4}
              onClick={() => setSelectedTier(4)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === 4
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              Tier 4: Niche (AI, Dev, Content)
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p aria-live="polite" className="text-sm text-slate-300">
              {filteredPlatforms.length} of {SEED_PLATFORMS.length} platforms
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} className="accent-indigo-400" />
              Free submission available
            </label>
          </div>
          {filteredPlatforms.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
              <p className="mb-4 text-sm text-slate-300">No platforms match your filters.</p>
              <Button variant="outline" size="sm" onClick={() => { setSelectedTier("all"); setPlatformSearch(""); setFreeOnly(false); }}>
                Clear filters
              </Button>
            </div>
          )}

          {/* Platforms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlatforms.map((platform) => {
              const tierVariant =
                platform.tier === 1
                  ? "tier1"
                  : platform.tier === 2
                  ? "tier2"
                  : platform.tier === 3
                  ? "tier3"
                  : "tier4";

              return (
                <div
                  key={platform.slug}
                  className="p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center font-bold text-xs text-white uppercase">
                          {platform.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                            {platform.name}
                            <a
                              href={platform.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-white"
                              title="Visit platform"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </h4>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            DR {platform.domain_rating} • {platform.is_free ? "Free" : "Paid"}
                          </span>
                        </div>
                      </div>
                      <Badge variant={tierVariant} className="text-[10px]">
                        Tier {platform.tier}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                      {platform.tone_notes}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      {platform.tagline_limit ? `Tagline ≤${platform.tagline_limit}c` : "No tag limit"}
                    </span>
                    <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      manual verify
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/submit">
                <span>Have a product ready? Match all {SEED_PLATFORMS.length} platforms free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. THE INDIE DEV REALITY (COMPARISON TABLE) */}
      <section className="py-20 border-t border-border/60 bg-background/30">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 mb-2">
              Why LaunchPilot?
            </Badge>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Doing it alone vs. with LaunchPilot
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Hard Way */}
            <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-4">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <span className="text-lg">❌</span> The Painful DIY Way
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Time spent researching directories, checking links, and filling out signup forms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Accidentally copy-pasting promotional marketing hype into Show HN and getting flagged.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Ignoring subreddit self-promo rules and getting banned from r/SideProject or r/SaaS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>No UTM links — zero idea which platform brought the paying users.</span>
                </li>
              </ul>
            </div>

            {/* The LaunchPilot Way */}
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="text-lg">✅</span> The LaunchPilot Way
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-foreground/90">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Submit once in 2 minutes. Instant audience fit scoring across 35 platforms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tone-matched listings (Show HN plain technical, PH punchy, Reddit authentic).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hour-by-hour launch day checklists and maker comment templates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Optional Done-For-You submission by human specialists with proof screenshots.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION PREVIEW */}
      <section id="pricing" className="py-20 border-t border-border/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 mb-2">
              Transparent Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Start free, upgrade when you want distribution scale
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              One-time payments unlock features per product. The Growth subscription is account-wide.
            </p>

            {/* Currency Switcher */}
            <div className="inline-flex items-center p-1 rounded-xl border border-border bg-card/60 mt-6">
              <button
                onClick={() => setCurrency("USD")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currency === "USD"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency("INR")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currency === "INR"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card/40 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Free</h3>
                <p className="text-xs text-muted-foreground mt-1">Test the fit for your product</p>
                <div className="text-3xl font-extrabold text-white mt-4">$0</div>
                <ul className="space-y-2.5 text-xs text-muted-foreground mt-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Submit product free
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Top 5 platform matches
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 2 tailored copy samples
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/50">
                    <span className="w-3.5 h-3.5 text-center">•</span> Launch tracker locked
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full mt-6 text-xs">
                <Link href="/submit">Submit Product Free</Link>
              </Button>
            </div>

            {/* Launch Kit */}
            <div className="p-6 rounded-2xl border border-indigo-500/40 bg-card/60 shadow-lg shadow-indigo-500/5 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="brand" className="text-[10px] uppercase font-bold py-0.5">
                  Most Popular
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Launch Kit</h3>
                <p className="text-xs text-muted-foreground mt-1">For founders submitting themselves</p>
                <div className="text-3xl font-extrabold text-white mt-4">
                  {currency === "INR" ? "₹1,999" : "$29"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">one-time</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground/90 mt-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" /> All 35 platform matches
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" /> All tailored copy blocks
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" /> Big Launch Kit (PH, HN, Reddit)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" /> Hour-by-hour launch day checklist
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" /> Interactive Launch Tracker
                  </li>
                </ul>
              </div>
              <Button asChild variant="brand" className="w-full mt-6 text-xs">
                <Link href="/pricing">Get Launch Kit</Link>
              </Button>
            </div>

            {/* Done-For-You */}
            <div className="p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-950/20 to-card/60 flex flex-col justify-between relative">
              <div>
                <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-[10px] mb-2">
                  Full Service
                </Badge>
                <h3 className="text-lg font-bold text-white">Done-For-You</h3>
                <p className="text-xs text-muted-foreground mt-1">We manually submit for you</p>
                <div className="text-3xl font-extrabold text-white mt-4">
                  {currency === "INR" ? "₹6,999" : "$99"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">one-time</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground/90 mt-6">
                  <li className="flex items-center gap-2 font-medium text-purple-300">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Everything in Launch Kit
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> We submit to eligible platforms
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Target: 7 business days for submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Proof screenshots uploaded
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Live submission report
                  </li>
                </ul>
              </div>
              <Button asChild variant="default" className="w-full mt-6 text-xs bg-purple-600 hover:bg-purple-700">
                <Link href="/pricing">Get Done-For-You</Link>
              </Button>
            </div>

            {/* Growth */}
            <div className="p-6 rounded-2xl border border-border/80 bg-card/40 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Growth</h3>
                <p className="text-xs text-muted-foreground mt-1">Continuous monthly distribution</p>
                <div className="text-3xl font-extrabold text-white mt-4">
                  {currency === "INR" ? "₹1,999" : "$29"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground mt-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Monthly resubmissions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> New directories added monthly
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Feature release launch copy
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Account-wide coverage
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full mt-6 text-xs">
                <Link href="/pricing">Subscribe to Growth</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="py-20 border-t border-border/60 bg-background/40">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 mb-2">
              Got Questions?
            </Badge>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border/80 bg-card/40 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-indigo-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "transform rotate-180 text-indigo-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. HIGH-CONVERTING BOTTOM CTA */}
      <section className="py-20 border-t border-border/60 gradient-mesh relative">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Stop launching to an empty room.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Get your product in front of thousands of early adopters, get real backlinks, and start growing today.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" variant="brand" className="gap-2 px-8 py-6 text-base shadow-xl shadow-indigo-500/30">
              <Link href="/submit">
                <Rocket className="w-5 h-5" />
                Submit Your Product Free
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            No credit card required • Instant AI analysis &amp; top matches
          </p>
        </div>
      </section>
    </div>
  );
}
