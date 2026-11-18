"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Copy, Globe2, Radio, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import type { Product, ProductPlatform, SubmissionStatus } from "@/types";

const statusLabels: Record<SubmissionStatus, string> = {
  "not started": "Not started",
  submitted: "Submitted",
  "pending review": "Pending review",
  live: "Live",
  rejected: "Rejected",
};
const statuses = Object.keys(statusLabels) as SubmissionStatus[];

type Tracker = { status: "loading" | "error" | "missing" } | { status: "ready"; product: Product; items: ProductPlatform[] };

function publicUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function TrackerRow({
  item,
  productId,
  onSave,
}: {
  item: ProductPlatform;
  productId: string;
  onSave: (item: ProductPlatform) => void;
}) {
  const [listing, setListing] = useState(item.live_url ?? "");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const name = item.platform?.name ?? item.platform_id;
  const submitUrl = publicUrl(item.platform?.submit_url) ?? publicUrl(item.platform?.url);
  const liveUrl = publicUrl(item.live_url);
  const proofUrl = publicUrl(item.proof_url);
  const trackingUrl = publicUrl(item.utm_link);

  async function save(changes: { status?: SubmissionStatus; live_url?: string | null }) {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/tracker/" + productId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId: item.platform_id, ...changes }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!data.success || !data.item) throw new Error();
      onSave(data.item);
      toast.success(changes.status ? "Submission status saved" : "Listing URL saved");
    } catch {
      toast.error("Couldn’t save " + name + ". Try again.");
    } finally {
      setPending(false);
    }
  }

  function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = listing.trim();
    const url = publicUrl(draft);
    if (draft && !url) {
      toast.error("Enter an HTTP or HTTPS listing URL.");
      return;
    }
    void save({ live_url: draft || null });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(item.utm_link);
      setCopied(true);
      toast.success("Tracking link copied");
    } catch {
      toast.error("Couldn’t copy the link. Open it to copy the address.");
    }
  }

  return (
    <li className="grid min-w-0 gap-4 border-t border-white/10 p-4 sm:p-5 lg:grid-cols-[minmax(9rem,0.85fr)_minmax(12rem,1.3fr)_minmax(9rem,auto)] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="break-words font-semibold text-white">{name}</h3>
          {item.platform?.tier && <Badge variant="outline" className="text-slate-300">Tier {item.platform.tier}</Badge>}
        </div>
        {item.submitted_at && <p className="mt-1 text-xs text-slate-400">Submitted {formatDate(item.submitted_at)}</p>}
        {submitUrl && (
          <a href={submitUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-200 hover:underline">
            Visit submission page <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <form onSubmit={saveListing} className="flex items-center gap-2">
          <Input type="url" aria-label={"Listing URL for " + name} placeholder="Enter listing URL" value={listing} disabled={pending} onChange={(event) => setListing(event.target.value)} />
          <Button type="submit" variant="outline" disabled={pending || listing.trim() === (item.live_url ?? "")} aria-label={"Save listing URL for " + name}>Save</Button>
        </form>
        <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200">
          {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" className="hover:underline">Open live listing</a>}
          {proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer" className="hover:underline">View proof</a>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <select
          aria-label={"Status for " + name}
          className="min-h-10 max-w-full rounded-lg border border-input bg-[#111a30] px-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          value={item.status}
          disabled={pending}
          onChange={(event) => void save({ status: event.target.value as SubmissionStatus })}
        >
          {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
        {item.utm_link && (
          <div className="flex flex-wrap items-center gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={copyLink} className="min-h-9 gap-1.5 text-slate-300">
              {copied ? <Check aria-hidden="true" className="size-3.5 text-emerald-300" /> : <Copy aria-hidden="true" className="size-3.5" />}
              {copied ? "Copied!" : "Copy UTM link"}
            </Button>
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noreferrer" aria-label={"Open tracking link for " + name} className="grid size-9 place-items-center rounded-lg text-indigo-200 hover:bg-white/10">
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function LaunchTrackerPage() {
  const { id: productId } = useParams<{ id: string }>();
  const [tracker, setTracker] = useState<Tracker>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SubmissionStatus>("all");
  const report = "/product/" + productId;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/tracker/" + productId, { cache: "no-store", signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 404) {
          setTracker({ status: "missing" });
          return;
        }
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!data.product || !Array.isArray(data.items)) throw new Error();
        if (!controller.signal.aborted) setTracker({ status: "ready", product: data.product, items: data.items });
      } catch {
        if (!controller.signal.aborted) setTracker({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [productId, attempt]);

  const items = tracker.status === "ready" ? tracker.items : [];
  const live = items.filter((item) => item.status === "live").length;
  const inReview = items.filter((item) => item.status === "submitted" || item.status === "pending review").length;
  const visible = items.filter((item) =>
    (filter === "all" || item.status === filter) &&
    (item.platform?.name ?? item.platform_id).toLowerCase().includes(search.trim().toLowerCase())
  );

  function saveItem(updated: ProductPlatform) {
    setTracker((current) => current.status === "ready" && current.product.id === updated.product_id
      ? { ...current, items: current.items.map((item) => item.id === updated.id ? { ...item, ...updated } : item) }
      : current);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1020]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="rounded-3xl border border-indigo-300/20 bg-gradient-to-br from-indigo-950 via-[#151e38] to-slate-950 p-6 sm:p-9">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-indigo-200">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft aria-hidden="true" className="size-4" /> Workspace</Link>
            {tracker.status === "ready" && <><span aria-hidden="true" className="text-slate-500">/</span><Link href={report} className="hover:text-white">{tracker.product.name}</Link></>}
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">Launch Tracker</h1>
              <p className="mt-3 text-sm text-slate-300 sm:text-base">Track submissions, save live listings, and copy referral links.</p>
            </div>
            {tracker.status === "ready" && <Button asChild variant="outline"><Link href={report}>Open launch report</Link></Button>}
          </div>
        </header>

        {tracker.status === "loading" && <p role="status" className="rounded-2xl border border-white/10 p-6 text-sm text-slate-300">Loading launch tracker…</p>}

        {tracker.status === "missing" && (
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="font-semibold text-white">Tracker unavailable</h2>
            <p className="mt-2 text-sm text-slate-300">Open your workspace and choose a product you have access to.</p>
            <Button asChild variant="outline" className="mt-4"><Link href="/dashboard">Go to workspace</Link></Button>
          </section>
        )}

        {tracker.status === "error" && (
          <section className="rounded-2xl border border-rose-400/25 bg-rose-400/5 p-6">
            <h2 role="alert" className="font-semibold text-white">We couldn’t load this tracker.</h2>
            <Button type="button" variant="outline" className="mt-3" onClick={() => { setTracker({ status: "loading" }); setAttempt((value) => value + 1); }}>Try again</Button>
          </section>
        )}

        {tracker.status === "ready" && (
          <>
            <section aria-labelledby="launch-progress" className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
              <h2 id="launch-progress" className="flex items-center gap-2 font-semibold text-white"><Radio aria-hidden="true" className="size-4 text-indigo-300" /> Overall Launch Progress</h2>
              <dl className="my-4 grid grid-cols-3 gap-2.5">
                {[
                  { label: "Live listings", count: live },
                  { label: "Submitted or in review", count: inReview },
                  { label: "Target platforms", count: items.length },
                ].map(({ label, count }) => (
                  <div key={label} className="rounded-xl bg-white/5 px-3 py-2.5 sm:px-4">
                    <dt className="text-xs text-slate-300 sm:text-sm">{label}</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{count}</dd>
                  </div>
                ))}
              </dl>
              <Progress value={items.length ? Math.round((live / items.length) * 100) : 0} aria-label="Share of target platforms with live listings" />
            </section>

            <section aria-labelledby="tracked-platforms" className="rounded-2xl border border-white/10 bg-slate-900/70">
              <div className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="tracked-platforms" className="text-xl font-semibold text-white">Tracked platforms</h2>
                  <p aria-live="polite" className="text-xs text-slate-400">{visible.length} of {items.length} platforms</p>
                </div>
                {items.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <div className="relative min-w-0 flex-1 basis-48">
                      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
                      <Input type="search" aria-label="Search tracked platforms" placeholder="Search platforms" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
                    </div>
                    <select aria-label="Filter platforms by status" value={filter} onChange={(event) => setFilter(event.target.value as "all" | SubmissionStatus)} className="h-10 max-w-full rounded-lg border border-input bg-[#111a30] px-3 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                      <option value="all">All statuses</option>
                      {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {items.length === 0 ? (
                <div className="border-t border-white/10 p-8 text-center">
                  <Globe2 aria-hidden="true" className="mx-auto mb-3 size-6 text-indigo-300" />
                  <p className="mb-4 text-sm text-slate-300">Run your launch analysis to add platforms to this tracker.</p>
                  <Button asChild variant="outline"><Link href={report}>Open launch report</Link></Button>
                </div>
              ) : visible.length === 0 ? (
                <div className="border-t border-white/10 p-8 text-center">
                  <p className="mb-3 text-sm text-slate-300">No matching platforms.</p>
                  <Button type="button" variant="outline" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</Button>
                </div>
              ) : (
                <ul>{visible.map((item) => <TrackerRow key={item.id} item={item} productId={productId} onSave={saveItem} />)}</ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
