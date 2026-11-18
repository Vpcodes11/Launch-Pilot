import { NextRequest, NextResponse } from "next/server";
import { PaymentManager, PLAN_CONFIGS } from "@/lib/payments";
import { DataService } from "@/lib/services/data";
import { UserPlan } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { plan, productId, currency = "USD" } = await req.json();

    if (!plan || !PLAN_CONFIGS[plan as UserPlan]) {
      return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
    }

    const user = await DataService.getCurrentUser();

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

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
