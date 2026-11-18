import { isDemoMode } from "@/lib/supabase/demo";
import Razorpay from "razorpay";
import crypto from "crypto";
import { CreateCheckoutParams, CheckoutResult, WebhookResult, PLAN_CONFIGS } from "./types";

export class RazorpayProvider {
  private static getClient(): Razorpay | null {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && !keyId.includes("your-key")) {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
    return null;
  }

  static async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const razorpay = isDemoMode() ? null : this.getClient();
    const planConfig = PLAN_CONFIGS[params.plan];
    const amountInPaise = planConfig.inrAmount * 100;

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          userId: params.userId,
          productId: params.productId || "",
          plan: params.plan,
        },
      });

      return {
        provider: "razorpay",
        orderId: order.id,
        razorpayOptions: {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
          amount: amountInPaise,
          currency: "INR",
          name: "LaunchPilot",
          description: `LaunchPilot — ${planConfig.name}`,
          order_id: order.id,
          prefill: {
            name: params.userName,
            email: params.userEmail,
          },
        },
      };
    }

    if (!isDemoMode()) throw new Error("Payment provider is unavailable");

    // Local demo checkout
    const mockOrderId = `order_rp_${crypto.randomUUID()}`;
    return {
      provider: "razorpay",
      orderId: mockOrderId,
      url: params.successUrl,
      razorpayOptions: {
        key: "rzp_test_mock123",
        amount: amountInPaise,
        currency: "INR",
        name: "LaunchPilot",
        description: `LaunchPilot — ${planConfig.name}`,
        order_id: mockOrderId,
        prefill: {
          name: params.userName,
          email: params.userEmail,
        },
      },
    };
  }

  static async verifyWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || secret.includes("your-key")) {
      return { verified: false, status: "failed", error: "Webhook verification unavailable" };
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (!/^[0-9a-f]{64}$/i.test(signature) ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature, "hex"), Buffer.from(signature, "hex"))) {
        return { verified: false, status: "failed", error: "Invalid Razorpay HMAC signature" };
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;

      if (event === "order.paid" || event === "payment.captured") {
        const payment = payload.payload?.payment?.entity;
        if (payment?.status === "captured" && payment.currency === "INR" && typeof payment.order_id === "string"
          && Number.isSafeInteger(payment.amount) && payment.amount > 0) {
          return { verified: true, orderId: payment.order_id, amount: payment.amount / 100, currency: "INR", status: "completed" };
        }
      }
      return { verified: true, status: "ignored" };
    } catch (err) {
      return {
        verified: false,
        status: "failed",
        error: err instanceof Error ? err.message : "Razorpay verification error",
      };
    }
  }
}
