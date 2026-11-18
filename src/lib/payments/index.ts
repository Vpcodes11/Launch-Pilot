import { StripeProvider } from "./stripe";
import { RazorpayProvider } from "./razorpay";
import { CreateCheckoutParams, CheckoutResult, WebhookResult, PLAN_CONFIGS } from "./types";

export class PaymentManager {
  static async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (params.currency === "INR") {
      return RazorpayProvider.createCheckoutSession(params);
    }
    return StripeProvider.createCheckoutSession(params);
  }

  static async verifyStripeWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    return StripeProvider.verifyWebhook(rawBody, signature);
  }

  static async verifyRazorpayWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    return RazorpayProvider.verifyWebhook(rawBody, signature);
  }
}

export { PLAN_CONFIGS };
