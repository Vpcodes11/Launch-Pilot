import { NextRequest, NextResponse } from "next/server";
import { PaymentManager, PLAN_CONFIGS } from "@/lib/payments";
import { DataService } from "@/lib/services/data";
import { isDemoMode } from "@/lib/supabase/demo";
import { z } from "zod";

const checkoutInput = z.object({
  plan: z.enum(["launch_kit", "done_for_you"]),
  productId: z.string().nonempty(),
  currency: z.enum(["USD", "INR"]).default("USD"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await DataService.getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const parsed = checkoutInput.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a product and an available plan." }, { status: 400 });
    const { plan, productId, currency } = parsed.data;

    const product = await DataService.getProduct(productId);
    if (!product || product.user_id !== user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const purchased = await DataService.paidPlan(product);
    if (purchased === "done_for_you" || purchased === plan) {
      return NextResponse.json({ error: "This plan is already included for this product." }, { status: 409 });
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || (isDemoMode() ? "http://localhost:3000" : "");
    const report = new URL("/product/" + encodeURIComponent(productId), base);
    const successUrl = report.href + "?payment=pending&plan=" + plan;
    const cancelUrl = report.href + "?payment=cancelled";
    const checkout = await PaymentManager.createCheckout({
      plan, productId, userId: user.id, userEmail: user.email, userName: user.name || "Founder",
      currency, successUrl, cancelUrl,
    });

    const pricing = PLAN_CONFIGS[plan];
    const amount = currency === "INR" ? pricing.inrAmount : pricing.usdAmount;
    await DataService.createOrder({
      user_id: user.id, product_id: productId, plan, amount, currency,
      provider: checkout.provider, provider_ref: checkout.orderId, status: "pending",
    });

    if (isDemoMode()) {
      await DataService.completeOrder(currency === "USD" ? "stripe" : "razorpay", checkout.orderId, amount, currency);
    }
    return NextResponse.json({ success: true, ...checkout, successUrl });
  } catch (error) {
    console.error("Checkout route error:", error);
    return NextResponse.json({ error: "Could not start checkout. Try again or choose another payment method." }, { status: 500 });
  }
}
