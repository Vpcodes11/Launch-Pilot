import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";
import { SubmissionStatus, ProductPlatform } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const product = await DataService.getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const trackerItems = await DataService.getProductPlatforms(productId);
    return NextResponse.json({ success: true, items: trackerItems, product });
  } catch (error) {
    console.error("GET /api/tracker/[productId] error:", error);
    return NextResponse.json({ error: "Failed to fetch tracker items" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { platformId, status, live_url, proof_url } = await req.json();

    if (!platformId) {
      return NextResponse.json({ error: "platformId is required" }, { status: 400 });
    }

    const updates: Partial<ProductPlatform> = {};
    if (status) {
      updates.status = status as SubmissionStatus;
      if (status === "submitted" || status === "live") {
        updates.submitted_at = new Date().toISOString();
      }
    }
    if (live_url !== undefined) updates.live_url = live_url;
    if (proof_url !== undefined) updates.proof_url = proof_url;

    const updated = await DataService.updateProductPlatform(productId, platformId, updates);

    // If product now has many live listings, trigger launch complete check
    if (status === "live") {
      const allItems = await DataService.getProductPlatforms(productId);
      const liveCount = allItems.filter((i) => i.status === "live").length;
      const product = await DataService.getProduct(productId);
      if (product && liveCount >= 10 && product.status !== "launched") {
        await DataService.updateProduct(productId, { status: "launched" });
        await EmailService.sendLaunchCompleteEmail(
          product.founder_email,
          product.founder_name,
          product.name,
          liveCount
        );
      }
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("PATCH /api/tracker/[productId] error:", error);
    return NextResponse.json({ error: "Failed to update tracker item" }, { status: 500 });
  }
}
