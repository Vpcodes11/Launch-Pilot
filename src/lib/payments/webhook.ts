import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { EmailService } from "@/lib/email/resend";
import { PaymentManager } from "@/lib/payments";

export async function receivePayment(req: NextRequest, provider: "stripe" | "razorpay") {
  try {
    const body = await req.text();
    const result = provider === "stripe"
      ? await PaymentManager.verifyStripeWebhook(body, req.headers.get("stripe-signature") ?? "")
      : await PaymentManager.verifyRazorpayWebhook(body, req.headers.get("x-razorpay-signature") ?? "");

    if (!result.verified) return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
    if (result.status !== "completed") return NextResponse.json({ received: true });

    const ref = provider === "stripe" ? result.providerRef : result.orderId;
    if (!ref || result.amount === undefined || !result.currency) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }
    const order = await DataService.completeOrder(provider, ref, result.amount, result.currency);
    if (order) {
      try {
        const recipient = await DataService.getReceiptRecipient(order);
        if (recipient) {
          await EmailService.sendPaymentReceiptEmail(
            recipient.email, recipient.name || "Founder", recipient.productName,
            order.plan, Number(order.amount), order.currency
          );
        }
      } catch (error) {
        console.error("Payment receipt delivery failed:", error);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Payment fulfillment failed:", error);
    return NextResponse.json({ error: "Payment fulfillment failed" }, { status: 500 });
  }
}
