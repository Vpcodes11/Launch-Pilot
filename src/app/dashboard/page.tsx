"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Compass, FileText,
  Layers3, LockKeyhole, LogOut, Plus, Radio, Rocket, Search, Sparkles,
} from "lucide-react";
import { EmailSignIn } from "@/components/email-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/demo";
import { formatDate } from "@/lib/utils";
import type { Product, ProductStatus } from "@/types";

const stages: Record<ProductStatus, { label: string; style: string }> = {
  draft: { label: "Draft", style: "text-slate-300 bg-slate-400/10 ring-slate-400/25" },
  analyzed: { label: "Report ready", style: "text-indigo-200 bg-indigo-400/10 ring-indigo-400/25" },
  paid: { label: "Paid", style: "text-violet-200 bg-violet-400/10 ring-violet-400/25" },
  in_progress: { label: "In progress", style: "text-amber-200 bg-amber-400/10 ring-amber-400/25" },
  launched: { label: "Launched", style: "text-emerald-200 bg-emerald-400/10 ring-emerald-400/25" },
};

const filters: { label: string; value: "all" | "preparing" | "in_progress" | "launched" }[] = [
  { label: "All products", value: "all" },
  { label: "Preparing", value: "preparing" },
  { label: "In progress", value: "in_progress" },
  { label: "Launched", value: "launched" },
];

const isPreparing = (product: Product) => product.status === "draft" || product.status === "analyzed" || product.status === "paid";

type Workspace = { status: "loading" | "signed-out" | "error" } | { status: "ready"; products: Product[] };

function ProductRow({ product }: { product: Product }) {
  const stage = stages[product.status] ?? stages.draft;
  const report = "/product/" + product.id;
  const matchCount = product.ai_analysis?.top_matches?.length ?? 0;

  return (
    <li className="grid min-w-0 gap-4 border-t border-white/10 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-400/15 font-semibold text-indigo-200">
          {product.name.trim().slice(0, 1).toUpperCase() || <Rocket className="size-5" />}
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="min-w-0 break-words font-semibold text-white">
              <Link href={report} className="hover:text-indigo-200">{product.name}</Link>
            </h3>
            <span className={"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ring-1 ring-inset " + stage.style}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {stage.label}
            </span>
          </div>
          <p className="break-words text-sm text-slate-300">{product.tagline}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>{product.category}</span>
            <span>Updated {formatDate(product.updated_at || product.created_at)}</span>
            {matchCount > 0 && <span>{matchCount} platform {matchCount === 1 ? "match" : "matches"}</span>}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:pl-14 lg:pl-0">
        {product.status !== "draft" && (
          <Button asChild size="sm" variant="ghost" className="min-h-9 gap-1.5 text-slate-300">
            <Link href={report + "/tracker"} aria-label={"Track " + product.name}>
              <Radio aria-hidden="true" className="size-3.5" /> Tracker
            </Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline" className="min-h-9 gap-1.5">
          <Link href={report} aria-label={product.status === "draft" ? "Open draft for " + product.name : "Open report for " + product.name}>
            {product.status === "draft" ? "Open draft" : "Open report"} <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </Button>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const [workspace, setWorkspace] = useState<Workspace>({ status: "loading" });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [sort, setSort] = useState("recent");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store", signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          setWorkspace({ status: "signed-out" });
          return;
        }
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data.products)) throw new Error();
        if (!controller.signal.aborted) setWorkspace({ status: "ready", products: data.products });
      } catch {
        if (!controller.signal.aborted) setWorkspace({ status: "error" });
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, [loadAttempt]);

  function refresh() {
    setWorkspace({ status: "loading" });
    setLoadAttempt((value) => value + 1);
  }

  async function signOut() {
    const client = createClient();
    if (!client || signingOut) return;
    setSigningOut(true);
    setSignOutError(false);
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      setSearch("");
      setFilter("all");
      setWorkspace({ status: "signed-out" });
    } catch {
      setSignOutError(true);
    } finally {
      setSigningOut(false);
    }
  }

  const products = workspace.status === "ready" ? workspace.products : [];
  const query = search.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesStatus = filter === "all" || (filter === "preparing" ? isPreparing(product) : product.status === filter);
    const matchesQuery = [product.name, product.tagline, product.category].some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  }).sort((first, second) => sort === "name"
    ? first.name.localeCompare(second.name)
    : Date.parse(second.updated_at || second.created_at) - Date.parse(first.updated_at || first.created_at));

  const stats = [
    { label: "Total products", count: products.length, icon: Layers3, color: "text-indigo-200 bg-indigo-400/15" },
    { label: "Preparing", count: products.filter(isPreparing).length, icon: FileText, color: "text-violet-200 bg-violet-400/15" },
    { label: "In progress", count: products.filter((product) => product.status === "in_progress").length, icon: Radio, color: "text-amber-200 bg-amber-400/15" },
    { label: "Launched", count: products.filter((product) => product.status === "launched").length, icon: CheckCircle2, color: "text-emerald-200 bg-emerald-400/15" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1020]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="relative isolate overflow-hidden rounded-3xl border border-indigo-300/20 bg-gradient-to-br from-indigo-950 via-[#151e38] to-slate-950 p-6 sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-indigo-200">
            <Link href="/" className="hover:text-white">LaunchPilot</Link>
            <span aria-hidden="true" className="text-slate-500">/</span>
            <span aria-current="page" className="text-slate-300">Workspace</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">Founder Dashboard</h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
                Manage products, open launch reports, and follow submissions in one place.
              </p>
            </div>
            <Button asChild size="lg" variant="brand" className="w-full gap-2 sm:w-auto">
              <Link href="/submit"><Plus aria-hidden="true" className="size-5" /> New product</Link>
            </Button>
          </div>
        </header>

        {workspace.status === "loading" && (
          <section aria-busy="true" aria-label="Loading products" className="mt-6">
            <p role="status" className="sr-only">Loading products…</p>
            <div aria-hidden="true" className="grid grid-cols-2 gap-3 motion-safe:animate-pulse lg:grid-cols-4">
              {stats.map(({ label }) => <div key={label} className="h-24 rounded-2xl border border-white/5 bg-white/5" />)}
            </div>
            <div aria-hidden="true" className="mt-6 h-48 rounded-2xl border border-white/5 bg-white/5 motion-safe:animate-pulse" />
          </section>
        )}

        {workspace.status === "signed-out" && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-7">
            <LockKeyhole aria-hidden="true" className="mb-3 size-5 text-indigo-300" />
            <h2 className="text-xl font-semibold text-white">Sign in to your workspace</h2>
            <p className="mb-5 mt-1.5 text-sm text-slate-300">Use your email to access saved products and track launches.</p>
            <EmailSignIn onSignedIn={refresh} />
          </section>
        )}

        {workspace.status === "error" && (
          <section className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-400/5 p-6">
            <h2 role="alert" className="font-semibold text-white">We couldn’t load your products.</h2>
            <Button type="button" variant="outline" className="mt-3" onClick={refresh}>Try again</Button>
          </section>
        )}

        {workspace.status === "ready" && (
          <>
            <dl aria-label="Launch overview" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 sm:p-4">
                  <div aria-hidden="true" className={"grid size-9 shrink-0 place-items-center rounded-xl sm:size-11 " + color}>
                    <Icon className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs leading-tight text-slate-300 sm:text-sm">{label}</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-white sm:text-2xl">{count}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
              <section aria-labelledby="products-title" className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70">
                <div className="space-y-4 p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id="products-title" className="text-xl font-semibold text-white">Your products</h2>
                    <p aria-live="polite" className="text-xs tabular-nums text-slate-400">{visible.length} of {products.length} products</p>
                  </div>
                  {products.length > 0 && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-0 flex-1 basis-32">
                          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
                          <Input type="search" aria-label="Search products" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
                        </div>
                        <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 max-w-full rounded-lg border border-input bg-[#111a30] px-3 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                          <option value="recent">Recently updated</option>
                          <option value="name">Product name</option>
                        </select>
                      </div>
                      <div role="group" aria-label="Filter by launch status" className="flex flex-wrap gap-1.5">
                        {filters.map(({ label, value }) => (
                          <Button key={value} type="button" size="sm" variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)} className={"min-h-9 " + (filter === value ? "bg-indigo-400/15 text-indigo-100 hover:bg-indigo-400/20" : "text-slate-300")}>
                            {label}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="border-t border-white/10 px-5 py-12 text-center">
                    <Rocket aria-hidden="true" className="mx-auto mb-3 size-6 text-indigo-300" />
                    <h3 className="font-semibold text-white">Launch your first product</h3>
                    <p className="mx-auto mb-4 mt-1 max-w-sm text-sm text-slate-300">Add a product to get platform recommendations and start a submission tracker.</p>
                    <Button asChild variant="brand"><Link href="/submit">Start a launch</Link></Button>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="border-t border-white/10 px-5 py-12 text-center">
                    <h3 className="font-semibold text-white">No matching products</h3>
                    <p className="mb-4 mt-1 text-sm text-slate-300">Try another search or status.</p>
                    <Button type="button" variant="outline" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</Button>
                  </div>
                ) : (
                  <ul>{visible.map((product) => <ProductRow key={product.id} product={product} />)}</ul>
                )}
              </section>

              <aside aria-label="Workspace resources" className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
                <h2 className="mb-3 font-semibold text-white">Launch resources</h2>
                <div className="space-y-1">
                  <Link href="/#platforms" className="flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    <Compass aria-hidden="true" className="size-4 text-indigo-300" /> Browse platforms <ArrowUpRight aria-hidden="true" className="ml-auto size-3.5" />
                  </Link>
                  <Link href="/pricing" className="flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    <Sparkles aria-hidden="true" className="size-4 text-indigo-300" /> Compare plans <ArrowUpRight aria-hidden="true" className="ml-auto size-3.5" />
                  </Link>
                  <Link href="/#how-it-works" className="flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    <ArrowDownRight aria-hidden="true" className="size-4 text-indigo-300" /> How it works <ArrowRight aria-hidden="true" className="ml-auto size-3.5" />
                  </Link>
                </div>
                {!isDemoMode() && (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <Button type="button" variant="ghost" disabled={signingOut} onClick={signOut} className="gap-2 text-slate-300">
                      <LogOut aria-hidden="true" className="size-4" /> {signingOut ? "Signing out…" : "Sign out"}
                    </Button>
                    {signOutError && <p role="alert" className="text-sm text-rose-300">Couldn’t sign out. Try again.</p>}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
