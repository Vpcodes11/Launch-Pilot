import type { CheckoutResult } from "./types";

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: NonNullable<CheckoutResult["razorpayOptions"]> & {
  handler: () => void;
  modal: { ondismiss: () => void };
}) => RazorpayInstance;

let sdk: Promise<RazorpayConstructor> | undefined;

function loadRazorpay() {
  const browser = window as Window & { Razorpay?: RazorpayConstructor };
  if (browser.Razorpay) return Promise.resolve(browser.Razorpay);
  sdk ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => browser.Razorpay ? resolve(browser.Razorpay) : reject(new Error("Razorpay did not load."));
    script.onerror = () => reject(new Error("Razorpay did not load. Try USD checkout or retry."));
    document.head.append(script);
  }).catch((error) => {
    sdk = undefined;
    throw error;
  });
  return sdk;
}

export async function openCheckout(checkout: CheckoutResult & { successUrl: string }) {
  if (checkout.url) {
    window.location.assign(checkout.url);
    return;
  }
  if (checkout.provider !== "razorpay" || !checkout.razorpayOptions || !checkout.successUrl) {
    throw new Error("The payment provider did not open checkout.");
  }
  const options = checkout.razorpayOptions;
  const Razorpay = await loadRazorpay();
  await new Promise<void>((resolve) => {
    const payment = new Razorpay({
      ...options,
      handler: () => {
        window.location.assign(checkout.successUrl);
        resolve();
      },
      modal: { ondismiss: resolve },
    });
    payment.open();
  });
}
