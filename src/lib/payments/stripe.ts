import { isDemoMode } from "@/lib/supabase/demo";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { CreateCheckoutParams, CheckoutResult, WebhookResult, PLAN_CONFIGS } from "./types";

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
    const stripe = isDemoMode() ? null : this.getClient();
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
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
      });

      if (!session.url) throw new Error("Stripe did not return a checkout URL");
      return {
        provider: "stripe",
        orderId: session.id,
        url: session.url,
      };
    }

    if (!isDemoMode()) throw new Error("Payment provider is unavailable");

    // Local demo checkout
    const mockSessionId = `cs_test_${randomUUID()}`;
    return {
      provider: "stripe",
      orderId: mockSessionId,
      url: params.successUrl,
    };
  }

  static async verifyWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    const stripe = this.getClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret || webhookSecret.includes("your-key")) {
      return { verified: false, status: "failed", error: "Webhook verification unavailable" };
    }

    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object;
        if (session.mode === "payment" && session.payment_status === "paid" && session.currency === "usd"
          && session.amount_total !== null && session.amount_total > 0 && session.metadata?.userId) {
          return { verified: true, providerRef: session.id, amount: session.amount_total / 100, currency: "USD", status: "completed" };
        }
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
