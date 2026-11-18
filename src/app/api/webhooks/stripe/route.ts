import { NextRequest, NextResponse } from "next/server";
import { PaymentManager } from "@/lib/payments";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    const result = await PaymentManager.verifyStripeWebhook(rawBody, signature);

    if (!result.verified) {
      return NextResponse.json({ error: result.error || "Verification failed" }, { status: 400 });
    }

    if (result.status === "completed" && result.providerRef) {
      // Complete order
      await DataService.updateOrderStatus(result.providerRef, "completed");

      // Unlock product if associated
      if (result.productId) {
        await DataService.updateProduct(result.productId, {
          status: "paid",
        });
      }

      // Send confirmation email
      if (result.userId && result.plan) {
        const product = result.productId ? await DataService.getProduct(result.productId) : null;
        const productName = product ? product.name : "Your Product";
        const user = await DataService.getCurrentUser();

        if (user) await EmailService.sendPaymentReceiptEmail(
          user.email,
          user.name || "Founder",
          productName,
          result.plan,
          result.amount || 0,
          result.currency || "USD"
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
