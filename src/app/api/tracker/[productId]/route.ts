import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";
import { ProductPlatform } from "@/types";
import { summarizeProduct, trackerItem } from "@/lib/services/report-access";
import { z } from "zod";

const webUrl = z.url({ protocol: /^https?$/i }).nullable().optional();
const trackerInput = z.object({
  platformId: z.string().nonempty(),
  status: z.enum(["not started", "submitted", "pending review", "live", "rejected"]).optional(),
  live_url: webUrl,
  proof_url: webUrl,
});

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
    const items = trackerItems.map(trackerItem).sort((first, second) =>
      (first.platform?.name ?? first.platform_id).localeCompare(second.platform?.name ?? second.platform_id)
    );
    return NextResponse.json({ success: true, items, product: summarizeProduct(product) });
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
    const viewer = await DataService.getCurrentUser();
    if (!viewer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const product = await DataService.getProduct(productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const parsed = trackerInput.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid tracker update" }, { status: 400 });
    const { platformId, status, live_url, proof_url } = parsed.data;
    if (proof_url !== undefined && viewer.role !== "admin") {
      return NextResponse.json({ error: "Only submission staff can record proof" }, { status: 403 });
    }
    if (status === undefined && live_url === undefined && proof_url === undefined) {
      return NextResponse.json({ error: "No tracker changes supplied" }, { status: 400 });
    }

    const updates: Partial<ProductPlatform> = {};
    if (status) {
      updates.status = status;
      if (status === "submitted" || status === "live") {
        updates.submitted_at = new Date().toISOString();
      }
    }
    if (live_url !== undefined) updates.live_url = live_url;
    if (proof_url !== undefined) updates.proof_url = proof_url;

    const updated = await DataService.updateProductPlatform(productId, platformId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Tracker item could not be updated" }, { status: 404 });
    }

    // If product now has many live listings, trigger launch complete check
    if (status === "live") {
      try {
        const allItems = await DataService.getProductPlatforms(productId);
        const liveCount = allItems.filter((i) => i.status === "live").length;
        if (liveCount >= 10 && product.status !== "launched") {
          const launched = await DataService.updateProduct(productId, { status: "launched" }, product.status);
          if (launched) {
            await EmailService.sendLaunchCompleteEmail(
              product.founder_email,
              product.founder_name,
              product.name,
              liveCount
            );
          }
        }
      } catch (error) {
        console.error("Launch completion follow-up failed:", error);
      }
    }

    return NextResponse.json({ success: true, item: trackerItem(updated) });
  } catch (error) {
    console.error("PATCH /api/tracker/[productId] error:", error);
    return NextResponse.json({ error: "Failed to update tracker item" }, { status: 500 });
  }
}
