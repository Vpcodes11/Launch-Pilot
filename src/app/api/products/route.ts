import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";

export async function GET() {
  try {
    const user = await DataService.getCurrentUser();
    const products = await DataService.getProducts(user.id);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await DataService.getCurrentUser();

    // Basic validation
    if (!body.name || !body.url || !body.tagline || !body.short_description) {
      return NextResponse.json(
        { error: "Name, URL, tagline, and short description are required." },
        { status: 400 }
      );
    }

    const newProduct = await DataService.createProduct(user.id, body);

    // Send welcome email if first product
    try {
      await EmailService.sendWelcomeEmail(body.founder_email || user.email, body.founder_name || user.name || "Founder");
    } catch (e) {
      console.warn("Failed to send welcome email:", e);
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
