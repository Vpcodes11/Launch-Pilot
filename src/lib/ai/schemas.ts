import { z } from "zod";

export const PlatformMatchSchema = z.object({
  platform_slug: z.string(),
  platform_name: z.string(),
  score: z.number().min(0).max(100),
  reason: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const GeneratedCopySchema = z.object({
  title_or_tagline: z.string(),
  body_or_description: z.string(),
  maker_comment: z.string().optional(),
  tone_applied: z.string(),
  tips: z.string().optional(),
});

export const BigLaunchKitSchema = z.object({
  product_hunt: z.object({
    tagline_options: z.array(z.string()),
    gallery_copy: z.array(z.string()),
    maker_first_comment: z.string(),
    launch_day_checklist: z.array(
      z.object({
        time: z.string(),
        action: z.string(),
        tips: z.string(),
      })
    ),
  }),
  show_hn: z.object({
    title: z.string(),
    post_body: z.string(),
    founder_advice: z.string(),
  }),
  reddit: z.array(
    z.object({
      subreddit: z.string(),
      title: z.string(),
      post_body: z.string(),
      rules_warning: z.string(),
    })
  ),
});

export const AIAnalysisResponseSchema = z.object({
  executive_summary: z.string(),
  positioning_angle: z.string(),
  recommended_launch_day: z.string(),
  top_matches: z.array(PlatformMatchSchema),
  tailored_copies: z.record(z.string(), GeneratedCopySchema),
  big_launch_kit: BigLaunchKitSchema,
});

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
