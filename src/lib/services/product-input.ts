import { z } from "zod";

export const productInput = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.url({ protocol: /^https?$/i }),
  tagline: z.string().trim().min(1).max(60),
  short_description: z.string().trim().min(1).max(260),
  long_description: z.string().max(10000).default(""),
  category: z.string().max(120).default("Other"),
  pricing_model: z.enum(["free", "freemium", "paid", "open_source"]).default("freemium"),
  tech_stack: z.string().max(1000).default(""),
  target_audience: z.string().max(1000).default(""),
  logo_url: z.string().max(2048).optional(),
  screenshots: z.array(z.string().max(2048)).max(25).default([]),
  demo_video_url: z.string().max(2048).optional(),
  founder_name: z.string().max(120).default(""),
  founder_twitter: z.string().max(2048).optional(),
  founder_linkedin: z.string().max(2048).optional(),
  founder_github: z.string().max(2048).optional(),
  founder_email: z.union([z.email(), z.literal("")]).default(""),
  launch_goal: z.enum(["seo_backlinks", "first_users", "feedback", "all"]).default("all"),
});
