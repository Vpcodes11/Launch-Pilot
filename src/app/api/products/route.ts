import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";
import { productInput } from "@/lib/services/product-input";
import { summarizeProduct } from "@/lib/services/report-access";

export async function GET() {
  try {
    const user = await DataService.getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const products = await DataService.getProducts(user.id);
    return NextResponse.json({ products: products.map(summarizeProduct) });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {

    const user = await DataService.getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const parsed = productInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Name, URL, tagline, and short description are required." },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const newProduct = await DataService.createProduct(user.id, { ...body, founder_email: user.email });

    // Send welcome email if first product
    try {
      await EmailService.sendWelcomeEmail(user.email, body.founder_name || user.name || "Founder");
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
