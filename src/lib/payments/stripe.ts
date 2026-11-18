import { isDemoMode } from "@/lib/supabase/demo";
import Stripe from "stripe";
import { CreateCheckoutParams, CheckoutResult, WebhookResult, PLAN_CONFIGS } from "./types";
import { UserPlan } from "@/types";

export class StripeProvider {
  private static getClient(): Stripe | null {
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("your-key")) {
      return new Stripe(process.env.STRIPE_SECRET_KEY, {
        typescript: true,
      });
    }
    return null;
  }

  static async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const stripe = this.getClient();
    const planConfig = PLAN_CONFIGS[params.plan];
    const amountInCents = Math.round(planConfig.usdAmount * 100);

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: planConfig.isSubscription ? "subscription" : "payment",
        customer_email: params.userEmail,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `LaunchPilot — ${planConfig.name}`,
                description: planConfig.features.slice(0, 3).join(", "),
              },
              unit_amount: amountInCents,
              ...(planConfig.isSubscription ? { recurring: { interval: "month" } } : {}),
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: params.userId,
          productId: params.productId || "",
          plan: params.plan,
        },
        success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: params.cancelUrl,
      });

      return {
        provider: "stripe",
        orderId: session.id,
        url: session.url || params.successUrl,
      };
    }

    if (!isDemoMode()) throw new Error("Payment provider is unavailable");

    // Local demo checkout
    const mockSessionId = `cs_test_${Date.now()}`;
    return {
      provider: "stripe",
      orderId: mockSessionId,
      url: `${params.successUrl}?session_id=${mockSessionId}&mock=true`,
    };
  }

  static async verifyWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    const stripe = this.getClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret || webhookSecret.includes("your-key")) {
      // In dev sandbox mode without secret, check if valid payload
      if (!isDemoMode()) {
        return { verified: false, status: "failed", error: "Webhook verification unavailable" };
      }
      try {
        const payload = JSON.parse(rawBody);
        return {
          verified: true,
          orderId: payload?.id || "mock-order-id",
          providerRef: payload?.id || "cs_test_mock",
          userId: payload?.metadata?.userId,
          productId: payload?.metadata?.productId,
          plan: payload?.metadata?.plan,
          status: "completed",
        };
      } catch {
        return { verified: false, status: "failed", error: "Missing webhook secret" };
      }
    }

    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          verified: true,
          orderId: session.id,
          providerRef: session.id,
          userId: session.metadata?.userId,
          productId: session.metadata?.productId,
          plan: session.metadata?.plan as UserPlan,
          amount: (session.amount_total || 0) / 100,
          currency: "USD",
          status: "completed",
        };
      }
      return { verified: true, status: "ignored" };
    } catch (err) {
      return {
        verified: false,
        status: "failed",
        error: err instanceof Error ? err.message : "Stripe signature verification failed",
      };
    }
  }
}
