"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { toast } from "sonner";

export default function PricingPage() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          setSelectedProductId(data.products[0].id);
        }
      } catch {
        // ignore
      }
    }
    fetchProducts();
  }, []);

  const handleCheckout = async (plan: "launch_kit" | "done_for_you" | "growth") => {
    setLoadingCheckout(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          productId: selectedProductId || undefined,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success(`Plan ${plan} unlocked successfully!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Checkout error occurred.");
    } finally {
      setLoadingCheckout(null);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
          Distribution Plans
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Simple, transparent pricing for indie devs
        </h1>
        <p className="text-base text-muted-foreground">
          One-time payments unlock features per product. The Growth subscription is per account.
        </p>

        {/* Currency Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl border border-border bg-card/60 mt-4">
          <button
            onClick={() => setCurrency("USD")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currency === "USD"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            USD ($ Stripe)
          </button>
          <button
            onClick={() => setCurrency("INR")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currency === "INR"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            INR (₹ Razorpay)
          </button>
        </div>

        {/* Product Selector if available */}
        {products.length > 0 && (
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Applying plan to:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-background/80 border border-border rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* FREE */}
        <div className="p-6 rounded-2xl border border-border/80 bg-card/40 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Free</h3>
            <p className="text-xs text-muted-foreground mt-1">Test audience fit</p>
            <div className="text-3xl font-extrabold text-white mt-4">$0</div>
            <ul className="space-y-3 text-xs text-muted-foreground mt-6">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Submit product free
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Top 5 platform matches
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> 2 tailored copy samples
              </li>
              <li className="flex items-center gap-2 text-muted-foreground/40">
                <span className="w-3.5 h-3.5 text-center">•</span> Launch tracker locked
              </li>
              <li className="flex items-center gap-2 text-muted-foreground/40">
                <span className="w-3.5 h-3.5 text-center">•</span> Big Launch Kit locked
              </li>
            </ul>
          </div>
          <Button asChild variant="outline" className="w-full mt-8 text-xs">
            <Link href="/submit">Submit Free</Link>
          </Button>
        </div>

        {/* LAUNCH KIT */}
        <div className="p-6 rounded-2xl border border-indigo-500/40 bg-card/60 shadow-lg shadow-indigo-500/5 flex flex-col justify-between relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="brand" className="text-[10px] uppercase font-bold py-0.5">
              Self-Submit
            </Badge>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Launch Kit</h3>
            <p className="text-xs text-muted-foreground mt-1">Founder submits themselves</p>
            <div className="text-3xl font-extrabold text-white mt-4">
              {currency === "INR" ? "₹1,999" : "$29"}
              <span className="text-xs font-normal text-muted-foreground ml-1">one-time</span>
            </div>
            <ul className="space-y-3 text-xs text-foreground/90 mt-6">
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
                <Check className="w-3.5 h-3.5 text-indigo-400" /> Hour-by-hour launch checklist
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400" /> Launch Tracker &amp; UTM links
              </li>
            </ul>
          </div>
          <Button
            variant="brand"
            disabled={loadingCheckout === "launch_kit"}
            onClick={() => handleCheckout("launch_kit")}
            className="w-full mt-8 text-xs"
          >
            {loadingCheckout === "launch_kit" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Get Launch Kit"
            )}
          </Button>
        </div>

        {/* DONE-FOR-YOU */}
        <div className="p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-950/20 to-card/60 flex flex-col justify-between relative shadow-xl">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="outline" className="border-purple-400 text-purple-300 bg-purple-900/40 text-[10px] uppercase font-bold py-0.5">
              Best ROI
            </Badge>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Done-For-You</h3>
            <p className="text-xs text-muted-foreground mt-1">Our team submits to eligible sites</p>
            <div className="text-3xl font-extrabold text-white mt-4">
              {currency === "INR" ? "₹6,999" : "$99"}
              <span className="text-xs font-normal text-muted-foreground ml-1">one-time</span>
            </div>
            <ul className="space-y-3 text-xs text-foreground/90 mt-6">
              <li className="flex items-center gap-2 font-medium text-purple-300">
                <Check className="w-3.5 h-3.5 text-purple-400" /> Everything in Launch Kit
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" /> Submissions to eligible platforms
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" /> 7-day turnaround guarantee
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" /> Proof screenshots uploaded
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400" /> Dedicated team submission
              </li>
            </ul>
          </div>
          <Button
            variant="default"
            disabled={loadingCheckout === "done_for_you"}
            onClick={() => handleCheckout("done_for_you")}
            className="w-full mt-8 text-xs bg-purple-600 hover:bg-purple-700"
          >
            {loadingCheckout === "done_for_you" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Get Done-For-You"
            )}
          </Button>
        </div>

        {/* GROWTH */}
        <div className="p-6 rounded-2xl border border-border/80 bg-card/40 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Growth</h3>
            <p className="text-xs text-muted-foreground mt-1">Continuous monthly distribution</p>
            <div className="text-3xl font-extrabold text-white mt-4">
              {currency === "INR" ? "₹1,999" : "$29"}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
            </div>
            <ul className="space-y-3 text-xs text-muted-foreground mt-6">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Monthly resubmissions
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> New directories automatically added
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Feature release launch copy
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Account-wide coverage
              </li>
            </ul>
          </div>
          <Button
            variant="outline"
            disabled={loadingCheckout === "growth"}
            onClick={() => handleCheckout("growth")}
            className="w-full mt-8 text-xs"
          >
            {loadingCheckout === "growth" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Subscribe to Growth"
            )}
          </Button>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="pt-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Feature Comparison
        </h2>

        <div className="rounded-2xl border border-border/80 bg-card/50 overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-4">Feature</th>
                <th className="p-4 text-center">Free</th>
                <th className="p-4 text-center">Launch Kit ($29)</th>
                <th className="p-4 text-center text-purple-300">Done-For-You ($99)</th>
                <th className="p-4 text-center">Growth ($29/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-4 font-medium text-white">Platform Fit Scoring</td>
                <td className="p-4 text-center text-muted-foreground">Top 5</td>
                <td className="p-4 text-center text-emerald-400">All 35</td>
                <td className="p-4 text-center text-emerald-400">All 35</td>
                <td className="p-4 text-center text-emerald-400">All 35 + New</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Tailored Copy Blocks</td>
                <td className="p-4 text-center text-muted-foreground">2 Samples</td>
                <td className="p-4 text-center text-emerald-400">All 35</td>
                <td className="p-4 text-center text-emerald-400">All 35</td>
                <td className="p-4 text-center text-emerald-400">All 35</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Big Launch Kit (PH, HN, Reddit)</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Manual Submissions by Our Team</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center font-bold text-purple-400">Eligible directories</td>
                <td className="p-4 text-center font-bold text-purple-400">Eligible directories &amp; monthly</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Proof Screenshots &amp; Live URLs</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Unique UTM Link Attribution</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
