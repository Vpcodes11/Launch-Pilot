"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Plus,
  ExternalLink,
  BarChart3,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const getStatusBadge = (status: Product["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "analyzed":
        return (
          <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 bg-indigo-500/10">
            Analyzed
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10">
            Paid (Queue)
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="warning">
            Submissions in Progress
          </Badge>
        );
      case "launched":
        return (
          <Badge variant="success">
            Fully Launched
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-border/60 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Founder Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your products, view AI platform reports, and track distribution status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="brand" className="gap-2 shadow-lg shadow-indigo-500/20">
            <Link href="/submit">
              <Plus className="w-4 h-4" />
              Submit New Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs">
            <span>Total Products</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{products.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Submitted for distribution</div>
        </div>

        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs">
            <span>Platforms Analyzed</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">35</div>
          <div className="text-[11px] text-muted-foreground mt-1">Per active product</div>
        </div>

        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs">
            <span>Average DR</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">76</div>
          <div className="text-[11px] text-muted-foreground mt-1">High-authority backlink power</div>
        </div>

        <div className="p-5 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs">
            <span>Time Saved</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">40+ hrs</div>
          <div className="text-[11px] text-muted-foreground mt-1">Automated copy &amp; preparation</div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Products</h2>
          <span className="text-xs text-muted-foreground font-mono">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground border border-border/60 rounded-xl bg-card/30">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl bg-card/20 space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No products submitted yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Submit your product once for free to receive top platform matches, tailored copy, and your launch kit.
              </p>
            </div>
            <Button asChild variant="brand" size="sm" className="gap-1.5">
              <Link href="/submit">
                <Plus className="w-4 h-4" />
                Submit Your First Product Free
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => {
              const matchesCount = product.ai_analysis?.top_matches?.length || 0;
              return (
                <div
                  key={product.id}
                  className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-md hover:border-indigo-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 glow-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-lg shrink-0">
                      {product.name.slice(0, 1)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-white hover:text-indigo-300 transition-colors">
                          <Link href={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        {getStatusBadge(product.status)}
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          {product.category}
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 max-w-2xl">
                        {product.tagline}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-muted-foreground">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-white flex items-center gap-1"
                        >
                          {product.url.replace(/^https?:\/\//, "")}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span>•</span>
                        <span>Created {formatDate(product.created_at)}</span>
                        {matchesCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 font-medium">
                              {matchesCount} Platform Matches Ready
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
                      <Link href={`/product/${product.id}/tracker`}>
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                        Tracker
                      </Link>
                    </Button>

                    <Button asChild variant="brand" size="sm" className="text-xs gap-1.5">
                      <Link href={`/product/${product.id}`}>
                        <span>View Launch Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
