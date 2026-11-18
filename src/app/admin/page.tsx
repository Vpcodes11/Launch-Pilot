"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Platform, Product, ProductPlatform, Order, SubmissionStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Stats & Data
  const [stats, setStats] = useState({
    totalSignups: 85,
    paidOrdersCount: 24,
    totalRevenueUSD: 2376,
    totalRevenueINR: 48993,
    dfyQueueCount: 1,
  });
  const [dfyProducts, setDfyProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<"queue" | "platforms" | "orders">("queue");

  // Done-For-You Queue management
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [queuePlatforms, setQueuePlatforms] = useState<ProductPlatform[]>([]);
  const [assignedMember, setAssignedMember] = useState<Record<string, string>>({
    "prod-demo-1": "Sarah Jenkins (Senior Submissions)",
  });

  // Platforms CRUD modal state
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [platformForm, setPlatformForm] = useState({
    name: "",
    slug: "",
    url: "",
    submit_url: "",
    tier: 2,
    categories: "SaaS, Developer Tools",
    domain_rating: 65,
    tagline_limit: 60,
    description_limit: 300,
    tone_notes: "Clear, benefit-driven copy.",
    notes: "verify: Check listing guidelines",
    active: true,
  });

  // Check admin role
  useEffect(() => {
    const role = localStorage.getItem("launchpilot_role");
    if (role === "admin") {
      setIsAdmin(true);
    }
  }, []);

  const handleEnableAdmin = () => {
    localStorage.setItem("launchpilot_role", "admin");
    setIsAdmin(true);
    window.dispatchEvent(new Event("role-change"));
    toast.success("Switched to Admin Role!");
  };

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setDfyProducts(data.dfyQueue || []);
        setOrders(data.orders || []);
      }

      const platRes = await fetch("/api/admin/platforms");
      const platData = await platRes.json();
      if (platData.platforms) {
        setPlatforms(platData.platforms);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Load platforms for a specific DFY product
  const loadProductPlatforms = async (prodId: string) => {
    setSelectedProductId(prodId);
    try {
      const res = await fetch(`/api/tracker/${prodId}`);
      const data = await res.json();
      if (data.items) {
        setQueuePlatforms(data.items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePlatformStatus = async (
    platformId: string,
    status: SubmissionStatus,
    liveUrl?: string,
    proofUrl?: string
  ) => {
    if (!selectedProductId) return;
    try {
      await fetch(`/api/tracker/${selectedProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId,
          status,
          live_url: liveUrl,
          proof_url: proofUrl,
        }),
      });

      setQueuePlatforms((prev) =>
        prev.map((item) =>
          item.platform_id === platformId || item.id === platformId
            ? {
                ...item,
                status,
                live_url: liveUrl !== undefined ? liveUrl : item.live_url,
                proof_url: proofUrl !== undefined ? proofUrl : item.proof_url,
              }
            : item
        )
      );
      toast.success("Platform status updated!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Platform CRUD
  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlatform) {
        // Update
        const res = await fetch("/api/admin/platforms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPlatform.id,
            ...platformForm,
            categories: platformForm.categories.split(",").map((c) => c.trim()),
          }),
        });
        if (res.ok) {
          toast.success("Platform updated!");
          loadAdminData();
          setIsPlatformModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch("/api/admin/platforms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...platformForm,
            categories: platformForm.categories.split(",").map((c) => c.trim()),
          }),
        });
        if (res.ok) {
          toast.success("Platform created!");
          loadAdminData();
          setIsPlatformModalOpen(false);
        }
      }
    } catch {
      toast.error("Error saving platform");
    }
  };

  const handleDeletePlatform = async (id: string) => {
    if (!confirm("Are you sure you want to delete this platform?")) return;
    try {
      const res = await fetch(`/api/admin/platforms?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Platform deleted");
        setPlatforms((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      toast.error("Failed to delete platform");
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Admin Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            This panel is reserved for LaunchPilot administrators and submission specialists to manage Done-For-You orders and the platforms database.
          </p>
        </div>
        <div className="pt-2">
          <Button onClick={handleEnableAdmin} variant="brand" className="gap-2">
            <Shield className="w-4 h-4" />
            Switch to Admin Demo Mode
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-purple-400" />
              LaunchPilot Admin Console
            </h1>
            <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-950/30">
              Role: Admin
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage Done-For-You submission pipelines, review proof screenshots, and configure platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard">Return to Founder View</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-xs">
            <span>Total Signups</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalSignups}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Founders registered</div>
        </div>

        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-xs">
            <span>Paid Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.paidOrdersCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Processed orders</div>
        </div>

        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-xs">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">
            ${stats.totalRevenueUSD.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            + ₹{stats.totalRevenueINR.toLocaleString()} (INR)
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1 text-xs">
            <span>Active DFY Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.dfyQueueCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Pending submission batches</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "queue"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Done-For-You Queue ({dfyProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("platforms")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "platforms"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Platforms Database ({platforms.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Order History ({orders.length})
        </button>
      </div>

      {/* TAB 1: DONE-FOR-YOU QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {dfyProducts.map((prod) => {
              const isSelected = selectedProductId === prod.id;
              const assigned = assignedMember[prod.id] || "Unassigned";

              return (
                <div
                  key={prod.id}
                  className="p-6 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-md space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white">{prod.name}</h3>
                        <Badge variant="outline" className="border-purple-500/40 text-purple-300">
                          Paid Done-For-You
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {prod.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                        {prod.tagline} • Founder: {prod.founder_name} ({prod.founder_email})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Assign team member */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Assignee:</span>
                        <input
                          type="text"
                          value={assigned}
                          onChange={(e) =>
                            setAssignedMember({ ...assignedMember, [prod.id]: e.target.value })
                          }
                          className="px-2.5 py-1 rounded border border-border bg-background/50 text-xs text-white"
                          placeholder="Team member name..."
                        />
                      </div>

                      <Button
                        variant={isSelected ? "secondary" : "brand"}
                        size="sm"
                        onClick={() =>
                          isSelected ? setSelectedProductId(null) : loadProductPlatforms(prod.id)
                        }
                        className="text-xs gap-1"
                      >
                        {isSelected ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" /> Close Submissions
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" /> Manage 50+ Submissions
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Submissions Table */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Submitter Workflow: Update platform status, input live listing URL, and paste proof screenshot URL.
                        </span>
                        <span className="font-mono text-purple-400 font-medium">
                          {queuePlatforms.filter((i) => i.status === "live").length} of {queuePlatforms.length} Live
                        </span>
                      </div>

                      <div className="rounded-xl border border-border/80 overflow-x-auto bg-background/40">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                            <tr>
                              <th className="p-3">Platform</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Live Listing URL</th>
                              <th className="p-3">Proof Screenshot URL</th>
                              <th className="p-3 text-right">Submit Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {queuePlatforms.map((item) => (
                              <tr key={item.id} className="hover:bg-secondary/20">
                                <td className="p-3 font-semibold text-white">
                                  {item.platform?.name || item.platform_id}
                                </td>

                                <td className="p-3">
                                  <select
                                    value={item.status}
                                    onChange={(e) =>
                                      handleUpdatePlatformStatus(
                                        item.platform_id,
                                        e.target.value as SubmissionStatus,
                                        item.live_url || undefined,
                                        item.proof_url || undefined
                                      )
                                    }
                                    className="px-2 py-0.5 rounded border border-border bg-background text-xs"
                                  >
                                    <option value="not started">Not Started</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="pending review">Pending Review</option>
                                    <option value="live">Live</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </td>

                                <td className="p-3">
                                  <input
                                    type="url"
                                    placeholder="https://platform.com/post/..."
                                    defaultValue={item.live_url || ""}
                                    onBlur={(e) =>
                                      handleUpdatePlatformStatus(
                                        item.platform_id,
                                        item.status,
                                        e.target.value,
                                        item.proof_url || undefined
                                      )
                                    }
                                    className="w-48 px-2 py-0.5 rounded border border-border bg-background text-[11px]"
                                  />
                                </td>

                                <td className="p-3">
                                  <input
                                    type="url"
                                    placeholder="Proof image URL..."
                                    defaultValue={item.proof_url || ""}
                                    onBlur={(e) =>
                                      handleUpdatePlatformStatus(
                                        item.platform_id,
                                        item.status,
                                        item.live_url || undefined,
                                        e.target.value
                                      )
                                    }
                                    className="w-40 px-2 py-0.5 rounded border border-border bg-background text-[11px]"
                                  />
                                </td>

                                <td className="p-3 text-right">
                                  <Button asChild variant="ghost" size="sm" className="h-6 text-[11px] gap-1">
                                    <a
                                      href={item.platform?.submit_url || item.platform?.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open Submit <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PLATFORMS DATABASE CRUD */}
      {activeTab === "platforms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Platforms Database Manager</h3>
            <Button
              variant="brand"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                setEditingPlatform(null);
                setPlatformForm({
                  name: "",
                  slug: "",
                  url: "",
                  submit_url: "",
                  tier: 2,
                  categories: "SaaS, Developer Tools",
                  domain_rating: 60,
                  tagline_limit: 60,
                  description_limit: 300,
                  tone_notes: "Clear, benefit-driven copy.",
                  notes: "verify: Check listing guidelines",
                  active: true,
                });
                setIsPlatformModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Platform
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3.5">Platform</th>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Tier</th>
                    <th className="p-3.5">DR</th>
                    <th className="p-3.5">Limits</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {platforms.map((plat) => (
                    <tr key={plat.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{plat.name}</span>
                          <a
                            href={plat.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">{plat.slug}</td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px]">
                          Tier {plat.tier}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                        DR {plat.domain_rating}
                      </td>
                      <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                        Tag: {plat.tagline_limit || "∞"} | Desc: {plat.description_limit || "∞"}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={plat.active ? "success" : "secondary"} className="text-[10px]">
                          {plat.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-white"
                            onClick={() => {
                              setEditingPlatform(plat);
                              setPlatformForm({
                                name: plat.name,
                                slug: plat.slug,
                                url: plat.url,
                                submit_url: plat.submit_url,
                                tier: plat.tier,
                                categories: plat.categories.join(", "),
                                domain_rating: plat.domain_rating,
                                tagline_limit: plat.tagline_limit || 60,
                                description_limit: plat.description_limit || 300,
                                tone_notes: plat.tone_notes,
                                notes: plat.notes,
                                active: plat.active,
                              });
                              setIsPlatformModalOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                            onClick={() => handleDeletePlatform(plat.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER HISTORY */}
      {activeTab === "orders" && (
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/20">
                  <td className="p-4 font-mono text-white">{o.provider_ref}</td>
                  <td className="p-4 font-medium capitalize text-white">
                    {o.plan.replace(/_/g, " ")}
                  </td>
                  <td className="p-4 font-bold text-emerald-400">
                    {o.currency === "INR" ? "₹" : "$"}
                    {o.amount}
                  </td>
                  <td className="p-4 uppercase font-mono text-muted-foreground">{o.provider}</td>
                  <td className="p-4">
                    <Badge variant={o.status === "completed" ? "success" : "warning"} className="text-[10px]">
                      {o.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Platform Modal */}
      {isPlatformModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white">
                {editingPlatform ? "Edit Platform" : "Add New Platform"}
              </h3>
              <button
                onClick={() => setIsPlatformModalOpen(false)}
                className="text-muted-foreground hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Name</label>
                  <Input
                    required
                    value={platformForm.name}
                    onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Slug</label>
                  <Input
                    required
                    value={platformForm.slug}
                    onChange={(e) => setPlatformForm({ ...platformForm, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Website URL</label>
                  <Input
                    type="url"
                    required
                    value={platformForm.url}
                    onChange={(e) => setPlatformForm({ ...platformForm, url: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Submit Form URL</label>
                  <Input
                    type="url"
                    required
                    value={platformForm.submit_url}
                    onChange={(e) => setPlatformForm({ ...platformForm, submit_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Tier (1-4)</label>
                  <select
                    value={platformForm.tier}
                    onChange={(e) => setPlatformForm({ ...platformForm, tier: Number(e.target.value) })}
                    className="w-full h-10 px-2 rounded-lg border border-input bg-background"
                  >
                    <option value={1}>Tier 1 (Big)</option>
                    <option value={2}>Tier 2 (Directories)</option>
                    <option value={3}>Tier 3 (SEO)</option>
                    <option value={4}>Tier 4 (Niche)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Domain Rating</label>
                  <Input
                    type="number"
                    value={platformForm.domain_rating}
                    onChange={(e) =>
                      setPlatformForm({ ...platformForm, domain_rating: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Tagline Limit</label>
                  <Input
                    type="number"
                    value={platformForm.tagline_limit}
                    onChange={(e) =>
                      setPlatformForm({ ...platformForm, tagline_limit: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tone Guidelines &amp; Notes</label>
                <Textarea
                  rows={2}
                  value={platformForm.tone_notes}
                  onChange={(e) => setPlatformForm({ ...platformForm, tone_notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlatformModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="brand" size="sm">
                  Save Platform
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
