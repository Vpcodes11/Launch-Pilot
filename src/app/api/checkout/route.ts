import { NextRequest, NextResponse } from "next/server";
import { PaymentManager, PLAN_CONFIGS } from "@/lib/payments";
import { DataService } from "@/lib/services/data";
import { UserPlan } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { plan, productId, currency = "USD" } = await req.json();

    if (!["launch_kit", "done_for_you", "growth"].includes(plan) || !["USD", "INR"].includes(currency)) {
      return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
    }

    const user = await DataService.getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    if (productId != null) {
      const product = typeof productId === "string" ? await DataService.getProduct(productId) : null;
      if (!product || product.user_id !== user.id) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    const baseUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;

    const successUrl = productId
      ? `${baseUrl}/product/${productId}?payment=success`
      : `${baseUrl}/dashboard?payment=success`;
    const cancelUrl = productId
      ? `${baseUrl}/product/${productId}?payment=cancelled`
      : `${baseUrl}/pricing?payment=cancelled`;

    const checkout = await PaymentManager.createCheckout({
      plan: plan as UserPlan,
      productId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name || "Founder",
      currency: currency as "USD" | "INR",
      successUrl,
      cancelUrl,
    });

    // Record pending order
    const planConfig = PLAN_CONFIGS[plan as UserPlan];
    const amount = currency === "INR" ? planConfig.inrAmount : planConfig.usdAmount;

    await DataService.createOrder({
      user_id: user.id,
      product_id: productId || null,
      plan: plan as UserPlan,
      amount,
      currency: currency as "USD" | "INR",
      provider: checkout.provider,
      provider_ref: checkout.orderId,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      ...checkout,
    });
  } catch (error) {
    console.error("Checkout route error:", error);
    return NextResponse.json(
      { error: "Failed to initialize checkout", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
