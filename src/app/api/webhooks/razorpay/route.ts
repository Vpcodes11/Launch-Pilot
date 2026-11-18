import { NextRequest, NextResponse } from "next/server";
import { PaymentManager } from "@/lib/payments";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const result = await PaymentManager.verifyRazorpayWebhook(rawBody, signature);

    if (!result.verified) {
      return NextResponse.json({ error: result.error || "Verification failed" }, { status: 400 });
    }

    if (result.status === "completed" && result.orderId) {
      // Update order
      await DataService.updateOrderStatus(result.orderId, "completed");

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

        await EmailService.sendPaymentReceiptEmail(
          user.email,
          user.name || "Founder",
          productName,
          result.plan,
          result.amount || 0,
          result.currency || "INR"
        );
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
