import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { AIAnalyzer, AIUnavailableError } from "@/lib/ai/analyzer";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { productId, platformSlug, customInstruction } = await req.json();

    if (!productId || !platformSlug) {
      return NextResponse.json({ error: "productId and platformSlug are required" }, { status: 400 });
    }

    const product = await DataService.getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const matches = product.ai_analysis?.top_matches ?? [];
    const allowedMatches = await DataService.paidPlan(product) ? matches : matches.slice(0, 2);
    if (!allowedMatches.some((match) => match.platform_slug === platformSlug)) {
      return NextResponse.json({ error: "This draft is not included in your report access" }, { status: 403 });
    }
    const platform = await DataService.getPlatform(platformSlug);
    if (!platform) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    const regeneratedCopy = await AIAnalyzer.regeneratePlatformCopy(product, platform, customInstruction);

    // Update in product's ai_analysis.tailored_copies if exists
    if (product.ai_analysis) {
      product.ai_analysis.tailored_copies[platformSlug] = regeneratedCopy;
      await DataService.updateProduct(productId, { ai_analysis: product.ai_analysis });
    }

    // Update in product_platforms tracker entry
    await DataService.updateProductPlatform(productId, platform.id, {
      generated_copy: regeneratedCopy,
    });

    return NextResponse.json({
      success: true,
      copy: regeneratedCopy,
    });
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Regenerate copy error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate copy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
