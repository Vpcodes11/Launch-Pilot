import { UserPlan } from "@/types";

export type PaymentCurrency = "USD" | "INR";
export type SupportedProvider = "stripe" | "razorpay" | "lemonsqueezy";

export interface PlanPricing {
  id: UserPlan;
  name: string;
  usdAmount: number;
  inrAmount: number;
  isSubscription: boolean;
  features: string[];
}

export const PLAN_CONFIGS: Record<UserPlan, PlanPricing> = {
  free: {
    id: "free",
    name: "Free",
    usdAmount: 0,
    inrAmount: 0,
    isSubscription: false,
    features: [
      "Submit product once",
      "Top 5 platform matches",
      "2 tailored copy samples",
      "Basic fit explanations",
    ],
  },
  launch_kit: {
    id: "launch_kit",
    name: "Launch Kit",
    usdAmount: 29,
    inrAmount: 1999,
    isSubscription: false,
    features: [
      "All 35 platform match scores & reasons",
      "All tailored copy blocks (HN, PH, Reddit, directories)",
      "Big Launch Kit (PH taglines, gallery text, checklists)",
      "Show HN title + technical post draft",
      "3 Reddit post drafts with rules warnings",
      "Interactive Launch Tracker with custom UTM links",
      "Copy & Regenerate buttons for all channels",
    ],
  },
  done_for_you: {
    id: "done_for_you",
    name: "Done-For-You",
    usdAmount: 99,
    inrAmount: 6999,
    isSubscription: false,
    features: [
      "Everything in Launch Kit",
      "Our team submits to eligible platforms within 7 days",
      "Proof screenshots & direct live URLs logged in tracker",
      "High-authority directory submissions (DR 50 to 90+)",
      "Priority launch report & executive review",
      "Dedicated submission specialist assigned",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    usdAmount: 29,
    inrAmount: 1999,
    isSubscription: true,
    features: [
      "All Done-For-You product features",
      "Monthly resubmissions for new feature releases",
      "New curated platforms added automatically each month",
      "Monthly SEO backlink & listing audit report",
      "Account-wide coverage for multiple products",
    ],
  },
};

export interface CreateCheckoutParams {
  plan: UserPlan;
  productId?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  currency: PaymentCurrency;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  provider: SupportedProvider;
  orderId: string;
  url?: string;
  razorpayOptions?: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
      name?: string;
      email: string;
    };
  };
}

export interface WebhookResult {
  verified: boolean;
  orderId?: string;
  providerRef?: string;
  userId?: string;
  productId?: string;
  plan?: UserPlan;
  amount?: number;
  currency?: PaymentCurrency;
  status: "completed" | "failed" | "ignored";
  error?: string;
}
