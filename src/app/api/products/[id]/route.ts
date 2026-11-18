import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { productInput } from "@/lib/services/product-input";
import { previewAnalysis, summarizeProduct } from "@/lib/services/report-access";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = await DataService.getProduct(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const paidPlan = await DataService.paidPlan(product);
    return NextResponse.json({
      product: { ...product, ai_analysis: previewAnalysis(product.ai_analysis, paidPlan !== null) },
      paidPlan,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = await DataService.getProduct(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const supplied = await req.json();
    const parsed = productInput.omit({ founder_email: true }).partial().safeParse(supplied);
    if (!parsed.success) return NextResponse.json({ error: "Invalid product details" }, { status: 400 });
    const changes = Object.fromEntries(Object.entries(parsed.data).filter(([key]) =>
      Object.prototype.hasOwnProperty.call(supplied, key)
    ));
    if (!Object.keys(changes).length) return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
    const updated = await DataService.updateProduct(id, changes);
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: summarizeProduct(updated) });
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
