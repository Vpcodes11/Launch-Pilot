import type { AIAnalysisResult, Product, ProductPlatform } from "@/types";

export function previewAnalysis(analysis: AIAnalysisResult | null, unlocked: boolean) {
  if (!analysis || unlocked) return analysis;
  const copies: AIAnalysisResult["tailored_copies"] = {};
  for (const match of analysis.top_matches.slice(0, 2)) {
    const copy = analysis.tailored_copies[match.platform_slug];
    if (copy) copies[match.platform_slug] = copy;
  }
  return {
    top_matches: analysis.top_matches.slice(0, 5),
    tailored_copies: copies,
    executive_summary: analysis.executive_summary,
    positioning_angle: analysis.positioning_angle,
    recommended_launch_day: analysis.recommended_launch_day,
  };
}

export function summarizeProduct(product: Product) {
  return { ...product, ai_analysis: previewAnalysis(product.ai_analysis, false) };
}

export function trackerItem(item: ProductPlatform) {
  return {
    id: item.id,
    product_id: item.product_id,
    platform_id: item.platform_id,
    status: item.status,
    live_url: item.live_url,
    proof_url: item.proof_url,
    submitted_at: item.submitted_at,
    utm_link: item.utm_link,
    platform: item.platform,
  };
}
