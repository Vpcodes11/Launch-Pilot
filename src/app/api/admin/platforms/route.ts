import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";

export async function GET() {
  try {
    const platforms = await DataService.getPlatforms();
    return NextResponse.json({ success: true, platforms });
  } catch (err) {
    console.error("GET /api/admin/platforms error:", err);
    return NextResponse.json({ error: "Failed to fetch platforms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.slug || !body.url || !body.submit_url || !body.tier) {
      return NextResponse.json({ error: "Missing required platform fields" }, { status: 400 });
    }

    const newPlatform = await DataService.createPlatform({
      name: body.name,
      slug: body.slug,
      url: body.url,
      submit_url: body.submit_url,
      tier: Number(body.tier) as 1 | 2 | 3 | 4,
      categories: Array.isArray(body.categories) ? body.categories : [body.categories || "SaaS"],
      is_free: body.is_free ?? true,
      has_paid_option: body.has_paid_option ?? false,
      domain_rating: Number(body.domain_rating) || 50,
      tagline_limit: body.tagline_limit ? Number(body.tagline_limit) : null,
      description_limit: body.description_limit ? Number(body.description_limit) : null,
      tone_notes: body.tone_notes || "",
      requires_account: body.requires_account ?? true,
      notes: body.notes || "verify: Newly added platform",
      active: body.active ?? true,
    });

    return NextResponse.json({ success: true, platform: newPlatform });
  } catch (error) {
    console.error("Create platform error:", error);
    return NextResponse.json({ error: "Failed to create platform" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await DataService.updatePlatform(id, updates);
    return NextResponse.json({ success: true, platform: updated });
  } catch (err) {
    console.error("PATCH /api/admin/platforms error:", err);
    return NextResponse.json({ error: "Failed to update platform" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const success = await DataService.deletePlatform(id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("DELETE /api/admin/platforms error:", err);
    return NextResponse.json({ error: "Failed to delete platform" }, { status: 500 });
  }
}
