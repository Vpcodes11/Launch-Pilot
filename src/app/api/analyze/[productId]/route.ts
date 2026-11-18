import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { previewAnalysis } from "@/lib/services/report-access";
import { AIAnalyzer } from "@/lib/ai/analyzer";
import { EmailService } from "@/lib/email/resend";
import { ProductPlatform } from "@/types";

export const maxDuration = 60; // 60s max for AI analysis

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await DataService.getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const platforms = await DataService.getPlatforms();
    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: "No platforms configured" }, { status: 500 });
    }

    // Run AI analysis
    const analysis = await AIAnalyzer.analyzeProduct(product, platforms);

    const platformsBySlug = new Map(platforms.map((platform) => [platform.slug, platform]));
    const seen = new Set<string>();
    analysis.top_matches = analysis.top_matches.filter(({ platform_slug }) => {
      if (!platformsBySlug.has(platform_slug) || seen.has(platform_slug)) return false;
      seen.add(platform_slug);
      return true;
    }).sort((a, b) => b.score - a.score).slice(0, 20);

    const matchedItems: ProductPlatform[] = analysis.top_matches.map((match) => {
      const platform = platformsBySlug.get(match.platform_slug)!;
      const tailoredCopy = analysis.tailored_copies[match.platform_slug] || {
        title_or_tagline: product.tagline,
        body_or_description: product.short_description,
        tone_applied: platform.tone_notes,
      };

      const cleanUrl = product.url.replace(/\/+$/, "");
      const utm_link = `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}utm_source=${match.platform_slug}&utm_campaign=launchpilot`;

      return {
        id: `pp-${product.id}-${match.platform_slug}`,
        product_id: product.id,
        platform_id: platform.id,
        match_score: match.score,
        match_reason: match.reason,
        generated_copy: tailoredCopy,
        status: "not started" as const,
        live_url: null,
        proof_url: null,
        submitted_at: null,
        utm_link,
        platform,
      };
    });

    analysis.tailored_copies = Object.fromEntries(matchedItems.map((item, index) =>
      [analysis.top_matches[index].platform_slug, item.generated_copy]
    ));
    await DataService.savePlatformMatches(product.id, matchedItems);
    const promoted = product.status === "draft"
      ? await DataService.updateProduct(productId, { ai_analysis: analysis, status: "analyzed" }, "draft")
      : null;
    const updated = promoted ?? await DataService.updateProduct(productId, { ai_analysis: analysis });
    if (!updated) throw new Error("Failed to save launch analysis");

    // Send transactional email (Analysis Ready)
    try {
      await EmailService.sendAnalysisReadyEmail(
        product.founder_email,
        product.founder_name,
        product.name,
        product.id
      );
    } catch (e) {
      console.warn("Failed sending analysis email:", e);
    }

    const paidPlan = await DataService.paidPlan(updated);
    return NextResponse.json({
      success: true,
      analysis: previewAnalysis(analysis, paidPlan !== null),
      paidPlan,
      topMatchesCount: analysis.top_matches.length,
      productStatus: updated.status,
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
