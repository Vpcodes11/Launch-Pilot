import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { AIAnalyzer } from "@/lib/ai/analyzer";
import { EmailService } from "@/lib/email/resend";
import { ProductPlatform } from "@/types";

export const maxDuration = 60; // 60s max for AI analysis

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
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

    // Save analysis on product and update status
    await DataService.updateProduct(productId, {
      ai_analysis: analysis,
      status: product.status === "draft" ? "analyzed" : product.status,
    });

    // Populate or update product_platforms entries for the top matched platforms
    const matchedItems: ProductPlatform[] = analysis.top_matches.map((match) => {
      const platform = platforms.find((p) => p.slug === match.platform_slug);
      const tailoredCopy = analysis.tailored_copies[match.platform_slug] || {
        title_or_tagline: product.tagline,
        body_or_description: product.short_description,
        tone_applied: platform?.tone_notes || "",
      };

      const cleanUrl = product.url.replace(/\/+$/, "");
      const utm_link = `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}utm_source=${match.platform_slug}&utm_campaign=launchpilot`;

      return {
        id: `pp-${product.id}-${match.platform_slug}`,
        product_id: product.id,
        platform_id: platform?.id || match.platform_slug,
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

    // Save product platforms
    await DataService.setProductPlatforms(product.id, matchedItems);
    for (const item of matchedItems) {
      await DataService.updateProductPlatform(product.id, item.platform_id, item);
    }

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

    return NextResponse.json({
      success: true,
      analysis,
      topMatchesCount: analysis.top_matches.length,
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
