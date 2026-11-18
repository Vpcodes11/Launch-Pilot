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
import type { CheckoutResult } from "@/lib/payments/types";
import { openCheckout } from "@/lib/payments/client-checkout";

export default function PricingPage() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [productState, setProductState] = useState<"loading" | "signed-out" | "ready" | "error">("loading");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (response.status === 401) {
          setProductState("signed-out");
          return;
        }
        if (!response.ok) throw new Error();
        const data = await response.json();
        const list: Product[] = data.products;
        const requested = new URLSearchParams(window.location.search).get("product");
        setProducts(list);
        setSelectedProductId(requested ? list.find((product) => product.id === requested)?.id ?? "" : list[0]?.id ?? "");
        setProductState("ready");
      } catch {
        setProductState("error");
      }
    }
    void fetchProducts();
  }, []);

  async function handleCheckout(plan: "launch_kit" | "done_for_you") {
    if (!selectedProductId || loadingCheckout) return;
    setLoadingCheckout(plan);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, productId: selectedProductId, currency }),
      });
      const checkout: CheckoutResult & { error?: string; successUrl: string } = await response.json();
      if (!response.ok) throw new Error(checkout.error || "Could not start checkout.");
      await openCheckout(checkout);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setLoadingCheckout(null);
    }
  }

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
          Choose a one-time purchase for the product you want to launch.
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

        <div id="checkout" className="scroll-mt-24" />
        {productState === "loading" && <p role="status" className="text-sm text-slate-300">Loading products…</p>}
        {productState === "signed-out" && <Button asChild variant="outline"><Link href="/dashboard">Sign in to purchase</Link></Button>}
        {productState === "ready" && products.length === 0 && <Button asChild variant="outline"><Link href="/submit">Add a product to purchase</Link></Button>}
        {productState === "error" && <p role="alert" className="text-sm text-rose-300">Could not load your products. Refresh the page to try again.</p>}
        {/* Product Selector if available */}
        {products.length > 0 && (
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Applying plan to:</span>
            <select
              aria-label="Product for checkout"
              disabled={loadingCheckout !== null}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-background/80 border border-border rounded-lg px-2.5 py-1 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>Choose a product</option>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Check className="w-3.5 h-3.5 text-indigo-400" /> Full shortlist platform matches
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
            disabled={!selectedProductId || loadingCheckout !== null}
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
              Hands-on submission
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
                <Check className="w-3.5 h-3.5 text-purple-400" /> Target: 7 business days for submissions
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
            disabled={!selectedProductId || loadingCheckout !== null}
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

      </div>

      <section aria-labelledby="delivery-scope" className="rounded-2xl border border-indigo-400/25 bg-indigo-400/5 p-6 sm:p-8">
        <h2 id="delivery-scope" className="text-xl font-semibold text-white">What Done-For-You delivers</h2>
        <div className="mt-5 grid gap-5 text-sm leading-relaxed text-slate-300 md:grid-cols-3">
          <div><h3 className="mb-1 font-semibold text-white">Directory eligibility</h3>We review your product against directory requirements. Community posts stay with the founder.</div>
          <div><h3 className="mb-1 font-semibold text-white">Submission window</h3>We aim to submit to eligible directories within seven business days. Each directory sets its own review timeline.</div>
          <div><h3 className="mb-1 font-semibold text-white">Proof in your tracker</h3>Follow submission status, see proof where available, and open listings once a directory approves them.</div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <div className="pt-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Feature Comparison
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/50 shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-4">Feature</th>
                <th className="p-4 text-center">Free</th>
                <th className="p-4 text-center">Launch Kit</th>
                <th className="p-4 text-center text-purple-300">Done-For-You</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-4 font-medium text-white">Platform Fit Scoring</td>
                <td className="p-4 text-center text-muted-foreground">Top 5</td>
                <td className="p-4 text-center text-emerald-400">Full shortlist</td>
                <td className="p-4 text-center text-emerald-400">Full shortlist</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Tailored Copy Blocks</td>
                <td className="p-4 text-center text-muted-foreground">2 Samples</td>
                <td className="p-4 text-center text-emerald-400">Full shortlist</td>
                <td className="p-4 text-center text-emerald-400">Full shortlist</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Big Launch Kit (PH, HN, Reddit)</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Manual Submissions by Our Team</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center font-bold text-purple-400">Eligible directories</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Proof Screenshots &amp; Live URLs</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
                <td className="p-4 text-center text-emerald-400">✓ Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Unique UTM Link Attribution</td>
                <td className="p-4 text-center text-muted-foreground">—</td>
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
