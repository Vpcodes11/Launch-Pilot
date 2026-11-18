export type UserRole = "user" | "admin";
export type UserPlan = "free" | "launch_kit" | "done_for_you" | "growth";

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  plan: UserPlan;
  created_at: string;
}

export type ProductStatus = "draft" | "analyzed" | "paid" | "in_progress" | "launched";
export type PricingModel = "free" | "freemium" | "paid" | "open_source";
export type LaunchGoal = "seo_backlinks" | "first_users" | "feedback" | "all";

export interface ProductFormData {
  name: string;
  url: string;
  tagline: string; // max 60
  short_description: string; // max 260
  long_description: string;
  category: string;
  pricing_model: PricingModel;
  tech_stack: string;
  target_audience: string;
  logo_url?: string;
  screenshots: string[];
  demo_video_url?: string;
  founder_name: string;
  founder_twitter?: string;
  founder_linkedin?: string;
  founder_github?: string;
  founder_email: string;
  launch_goal: LaunchGoal;
}

export interface Platform {
  id: string;
  name: string;
  slug: string;
  url: string;
  submit_url: string;
  tier: 1 | 2 | 3 | 4; // Tier 1: Big launches, Tier 2: Launch directories, Tier 3: SEO/backlink directories, Tier 4: Niche
  categories: string[];
  is_free: boolean;
  has_paid_option: boolean;
  domain_rating: number;
  tagline_limit: number | null;
  description_limit: number | null;
  tone_notes: string;
  requires_account: boolean;
  notes: string;
  active: boolean;
}

export type SubmissionStatus = "not started" | "submitted" | "pending review" | "live" | "rejected";

export interface GeneratedCopy {
  title_or_tagline: string;
  body_or_description: string;
  maker_comment?: string;
  tone_applied: string;
  target_url?: string;
  tags?: string[];
  tips?: string;
}

export interface ProductPlatform {
  id: string;
  product_id: string;
  platform_id: string;
  match_score: number; // 0-100
  match_reason: string;
  generated_copy: GeneratedCopy;
  status: SubmissionStatus;
  live_url: string | null;
  proof_url: string | null;
  submitted_at: string | null;
  utm_link: string;
  platform?: Platform;
}

export interface BigLaunchKit {
  product_hunt: {
    tagline_options: string[];
    gallery_copy: string[];
    maker_first_comment: string;
    launch_day_checklist: Array<{
      time: string;
      action: string;
      tips: string;
    }>;
  };
  show_hn: {
    title: string;
    post_body: string;
    founder_advice: string;
  };
  reddit: Array<{
    subreddit: string;
    title: string;
    post_body: string;
    rules_warning: string;
  }>;
}

export interface AIAnalysisResult {
  top_matches: Array<{
    platform_slug: string;
    platform_name: string;
    score: number;
    reason: string;
    tier: 1 | 2 | 3 | 4;
  }>;
  tailored_copies: Record<string, GeneratedCopy>;
  big_launch_kit?: BigLaunchKit;
  executive_summary: string;
  positioning_angle: string;
  recommended_launch_day: string;
}

export interface Product extends ProductFormData {
  id: string;
  user_id: string;
  status: ProductStatus;
  ai_analysis: AIAnalysisResult | null;
  created_at: string;
  updated_at: string;
}

export type PaymentProvider = "stripe" | "razorpay" | "lemonsqueezy";
export type OrderStatus = "pending" | "completed" | "failed" | "refunded";

export interface Order {
  id: string;
  user_id: string;
  product_id?: string | null;
  plan: UserPlan;
  amount: number;
  currency: "USD" | "INR";
  provider: PaymentProvider;
  provider_ref: string;
  status: OrderStatus;
  created_at: string;
}
