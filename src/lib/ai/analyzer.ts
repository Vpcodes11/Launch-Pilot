import { AIAnalysisResponse, AIAnalysisResponseSchema, GeneratedCopySchema } from "./schemas";
import { Platform, Product, GeneratedCopy } from "@/types";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { isDemoMode } from "@/lib/supabase/demo";

/** Thrown when no AI provider produced a valid result in production. */
export class AIUnavailableError extends Error {
  constructor() {
    super("AI analysis is temporarily unavailable. Please try again in a few minutes.");
  }
}

/**
 * The rule-based copy generator is for local development and demos only. In production a paying
 * customer must never receive template copy presented as AI-tailored copy, so AI failures surface
 * as an error the customer can retry. ALLOW_HEURISTIC_COPY=true re-enables it deliberately.
 */
export const heuristicAllowed = () =>
  isDemoMode() || process.env.NODE_ENV !== "production" || process.env.ALLOW_HEURISTIC_COPY === "true";

const CLAUDE_MODEL = () => process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** One Claude call that must return JSON. Returns null on any failure so the caller can try the next provider. */
async function claudeJson(client: Anthropic, system: string | undefined, user: string, maxTokens: number): Promise<unknown | null> {
  const response = await client.beta.messages.create({
    model: CLAUDE_MODEL(),
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    ...(system ? { system } : {}),
    messages: [{ role: "user", content: `${user}\n\nReturn ONLY raw JSON, with no markdown code fences or conversational preamble.` }],
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    console.warn("Claude stopped early:", response.stop_reason);
    return null;
  }
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

export class AIAnalyzer {
  private static getOpenAIClient(): OpenAI | null {
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-key")) {
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return null;
  }

  private static getAnthropicClient(): Anthropic | null {
    if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("your-key")) {
      return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return null;
  }

  /**
   * Main analysis method. Evaluates product fit across all platforms and generates
   * tailored copy + Big Launch Kit.
   */
  static async analyzeProduct(product: Product, platforms: Platform[]): Promise<AIAnalysisResponse> {
    const openai = this.getOpenAIClient();
    const anthropic = this.getAnthropicClient();

    const systemPrompt = `
You are LaunchPilot AI, an elite launch strategist for indie developers and SaaS founders.
Your job is to analyze the product and evaluate its fit against each candidate launch platform.
CRITICAL SAFETY & ETHICS RULES:
1. NEVER invent fake metrics, fake revenue numbers, fake user counts, or fake customer testimonials.
2. STRICTLY respect character limits and specific tone rules for each platform:
   - Hacker News (Show HN): Plain, technical, zero hype, no buzzwords. Focus on architecture, stack, and problem solved.
   - Product Hunt: Punchy tagline (<= 60 chars), clear maker first comment, relatable origin story.
   - Reddit: Story-driven, authentic founder perspective, value-first, no marketing/salesy tone.
   - SaaS & Directory listings: Benefit-driven, keyword-rich, clear value prop.
3. Group platforms by tier:
   - Tier 1: Big launches (Product Hunt, Show HN, Reddit)
   - Tier 2: Launch directories
   - Tier 3: SEO/backlink directories
   - Tier 4: Niche (AI, dev tools, content)
4. Score platforms from 0 to 100 based on audience alignment with the product's tech stack, category, and target audience. Return the top 20 matched platforms.
5. You MUST return ONLY valid JSON matching the exact schema requested.
`;

    const userPrompt = `
Product to analyze:
- Name: ${product.name}
- URL: ${product.url}
- Tagline: ${product.tagline}
- Short Description: ${product.short_description}
- Long Description: ${product.long_description}
- Category: ${product.category}
- Pricing Model: ${product.pricing_model}
- Tech Stack: ${product.tech_stack}
- Target Audience: ${product.target_audience}
- Launch Goal: ${product.launch_goal}
- Founder Name: ${product.founder_name}

Platforms to score (all available platforms):
${platforms
  .map(
    (p) =>
      `[${p.slug}] ${p.name} (Tier ${p.tier}, DR ${p.domain_rating}, limits: tag=${p.tagline_limit || "unlimited"}, desc=${p.description_limit || "unlimited"}, tone: ${p.tone_notes})`
  )
  .join("\n")}

Respond with a JSON object conforming strictly to this format:
{
  "executive_summary": "1-2 paragraph strategic summary of the launch angle and high-fit opportunities",
  "positioning_angle": "The core hook and differentiator for the product",
  "recommended_launch_day": "Optimal day and time to coordinate the launch",
  "top_matches": [
    {
      "platform_slug": "slug",
      "platform_name": "Platform Name",
      "score": 95,
      "reason": "One-line specific reason for the fit",
      "tier": 1
    }
    // Top 20 platforms
  ],
  "tailored_copies": {
    "platform_slug": {
      "title_or_tagline": "Tailored title or tagline within platform limits",
      "body_or_description": "Tailored description or post body respecting platform tone",
      "maker_comment": "First comment or launch note where applicable",
      "tone_applied": "Description of the tone used",
      "tips": "Specific launch tip for this platform"
    }
  },
  "big_launch_kit": {
    "product_hunt": {
      "tagline_options": ["Option 1 (<=60 chars)", "Option 2 (<=60 chars)", "Option 3 (<=60 chars)"],
      "gallery_copy": ["Slide 1 text", "Slide 2 text", "Slide 3 text", "Slide 4 text"],
      "maker_first_comment": "Authentic maker launch comment",
      "launch_day_checklist": [
        { "time": "12:01 AM PST", "action": "Launch goes live", "tips": "Actionable tip" }
      ]
    },
    "show_hn": {
      "title": "Show HN: Name – plain English explanation",
      "post_body": "Technical post body focusing on architecture, open source / stack details, and origin",
      "founder_advice": "Advice for handling HN comments constructively"
    },
    "reddit": [
      {
        "subreddit": "r/SideProject",
        "title": "Post title",
        "post_body": "Value-first post content",
        "rules_warning": "Warning about this subreddit's self-promotion policy"
      }
    ]
  }
}
`;

    // Try OpenAI if configured
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const raw = completion.choices[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          const validated = AIAnalysisResponseSchema.safeParse(parsed);
          if (validated.success) {
            return validated.data;
          }
        }
      } catch (err) {
        console.warn("OpenAI analysis error, attempting retry / fallback:", err);
      }
    }

    // Try Anthropic if configured
    if (anthropic) {
      try {
        const parsed = await claudeJson(anthropic, systemPrompt, userPrompt, 16000);
        const validated = AIAnalysisResponseSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
        console.warn("Anthropic analysis did not match the schema:", validated.error.issues.slice(0, 3));
      } catch (err) {
        console.warn("Anthropic analysis error, attempting retry / fallback:", err);
      }
    }

    // Rule-based generator: development and demo only (see heuristicAllowed).
    if (!heuristicAllowed()) throw new AIUnavailableError();
    return this.generateHeuristicAnalysis(product, platforms);
  }

  /**
   * Generates tailored copy for a single platform (used by the Regenerate button)
   */
  static async regeneratePlatformCopy(
    product: Product,
    platform: Platform,
    customToneInstruction?: string
  ): Promise<GeneratedCopy> {
    const openai = this.getOpenAIClient();
    const anthropic = this.getAnthropicClient();

    const prompt = `
Generate tailored launch copy for the product "${product.name}" specifically for the platform "${platform.name}".
Platform Limits:
- Tagline/Title limit: ${platform.tagline_limit || "None"}
- Description limit: ${platform.description_limit || "None"}
- Tone Guidelines: ${platform.tone_notes}
${customToneInstruction ? `- Custom User Instruction: ${customToneInstruction}` : ""}

Product details:
- Tagline: ${product.tagline}
- Short Desc: ${product.short_description}
- Long Desc: ${product.long_description}
- Tech Stack: ${product.tech_stack}
- Target Audience: ${product.target_audience}
- Founder Name: ${product.founder_name}

RULES:
- NEVER invent fake metrics or fake testimonials.
- Strictly adhere to character limits and tone.
- Return ONLY JSON matching { "title_or_tagline": string, "body_or_description": string, "maker_comment": string, "tone_applied": string, "tips": string }
`;

    if (openai) {
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.8,
        });
        const content = res.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const valid = GeneratedCopySchema.safeParse(parsed);
          if (valid.success) return valid.data;
        }
      } catch (e) {
        console.warn("Regenerate OpenAI error:", e);
      }
    }

    if (anthropic) {
      try {
        const parsed = await claudeJson(anthropic, undefined, prompt, 4000);
        const valid = GeneratedCopySchema.safeParse(parsed);
        if (valid.success) return valid.data;
      } catch (e) {
        console.warn("Regenerate Anthropic error:", e);
      }
    }

    // Rule-based generator: development and demo only (see heuristicAllowed).
    if (!heuristicAllowed()) throw new AIUnavailableError();
    return this.generatePlatformCopyHeuristic(product, platform);
  }

  /**
   * Deterministic, high-quality heuristic analysis engine that tailors copy based on
   * platform nuances, character limits, categories, and founder info.
   */
  private static generateHeuristicAnalysis(product: Product, platforms: Platform[]): AIAnalysisResponse {
    const isAi = product.category.toLowerCase().includes("ai") || product.tech_stack.toLowerCase().includes("openai") || product.tech_stack.toLowerCase().includes("llm");
    const isDevTool = product.category.toLowerCase().includes("dev") || product.target_audience.toLowerCase().includes("developer") || product.target_audience.toLowerCase().includes("engineer");
    const isOpenSource = product.pricing_model === "open_source";

    // Score every platform
    const scoredPlatforms = platforms.map((p) => {
      let score = 70;
      let reason = `Good organic audience match for ${product.category} products looking for early adopters.`;

      if (p.slug === "producthunt") {
        score = 98;
        reason = "Essential primary launch platform for modern indie software with active maker community.";
      } else if (p.slug === "hackernews") {
        score = isDevTool || isOpenSource ? 96 : 82;
        reason = isDevTool || isOpenSource
          ? "High engineering interest for developer tools and open-source infrastructure without marketing hype."
          : "Good technical exposure if presented focusing strictly on architecture and real problems solved.";
      } else if (p.slug === "devhunt") {
        score = isDevTool ? 97 : 80;
        reason = "Developer-focused launchpad with active daily voting by software engineers.";
      } else if (p.slug === "theresanaiforthat" || p.slug === "futurepedia" || p.slug === "toolify") {
        score = isAi ? 95 : 65;
        reason = isAi
          ? "Top curated AI directory with hundreds of thousands of monthly visitors looking for AI automation."
          : "Niche directory with secondary relevance unless AI features are highlighted.";
      } else if (p.slug.startsWith("reddit")) {
        score = 91;
        reason = "High-intent community feedback channel when shared as a humble founder journey.";
      } else if (p.slug === "alternativeto") {
        score = 88;
        reason = "Strong high-intent SEO traffic from users actively searching for alternatives to established tools.";
      } else if (p.tier === 3) {
        score = 85;
        reason = `High domain rating (DR ${p.domain_rating}) providing authoritative backlinks and long-term search indexation.`;
      } else {
        score = Math.floor(75 + Math.random() * 15);
      }

      return {
        platform_slug: p.slug,
        platform_name: p.name,
        score,
        reason,
        tier: p.tier,
      };
    });

    // Sort by score descending and take top 20
    const top_matches = scoredPlatforms
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Generate tailored copies for top matches
    const tailored_copies: Record<string, GeneratedCopy> = {};
    for (const match of top_matches) {
      const platform = platforms.find((p) => p.slug === match.platform_slug);
      if (platform) {
        tailored_copies[match.platform_slug] = this.generatePlatformCopyHeuristic(product, platform);
      }
    }

    // Build the Big Launch Kit
    const big_launch_kit = {
      product_hunt: {
        tagline_options: [
          product.tagline.slice(0, 60),
          `${product.name}: The smarter way to ${product.short_description.slice(0, 35).toLowerCase()}`.slice(0, 60),
          `Automate ${product.category.toLowerCase()} for ${product.target_audience.slice(0, 25).toLowerCase()}`.slice(0, 60),
        ],
        gallery_copy: [
          `Slide 1: Welcome to ${product.name} — ${product.tagline.slice(0, 45)}`,
          `Slide 2: The Problem — Why current solutions waste hours of your time`,
          `Slide 3: The Solution — How ${product.name} streamlines your workflow in 1 click`,
          `Slide 4: Key Features — Built with ${product.tech_stack.split(",")[0] || "modern tech"} for speed`,
        ],
        maker_first_comment: `Hey Product Hunt! 👋 I'm ${product.founder_name}, creator of ${product.name}.\n\nLike many indie founders and builders, I ran into the problem of ${product.short_description.toLowerCase()}. Current tools were either too clunky, overpriced, or lacked modern ergonomics.\n\nWe built ${product.name} to fix this. It's built on ${product.tech_stack} with zero bloat.\n\nI'll be hanging out in the comments all day to answer technical questions and hear your raw feedback. What feature would make this a no-brainer for you?`,
        launch_day_checklist: [
          { time: "12:01 AM PST", action: "Launch goes live on Product Hunt", tips: "Post your maker first comment within 60 seconds of launch." },
          { time: "05:00 AM PST", action: "European morning wake-up wave", tips: "Notify early beta testers and post in your Discord/Slack communities." },
          { time: "08:30 AM PST", action: "US East Coast peak hours", tips: "Post the official launch thread on Twitter/X and LinkedIn. Tag relevant contributors." },
          { time: "11:30 AM PST", action: "Midday momentum check", tips: "Reply to every single Product Hunt review with thoughtful answers." },
          { time: "06:00 PM PST", action: "Evening sprint to Top 5", tips: "Share a transparent milestone update on social channels thanking the community." },
        ],
      },
      show_hn: {
        title: `Show HN: ${product.name} – ${product.tagline}`,
        post_body: `Hi Hacker News,\n\nI built ${product.name} (${product.url}) to solve a personal pain point: ${product.short_description}\n\nArchitecture & Tech Stack:\n${product.tech_stack}\n\nWhy another tool in this space?\nMost existing alternatives have grown bloated and expensive. My goal was to create a focused, high-performance solution for ${product.target_audience}.\n\nTry it out at ${product.url} (no credit card required). I'm keen to hear your feedback on the architecture, UX, and edge cases.`,
        founder_advice: "Hacker News values technical transparency. Answer questions directly, admit current limitations humbly, and never ask colleagues or friends to upvote (HN spam filters will flag it).",
      },
      reddit: [
        {
          subreddit: "r/SideProject",
          title: `I got tired of manual workflows, so I spent 3 weeks building ${product.name}`,
          post_body: `Hey r/SideProject,\n\nI'm ${product.founder_name}. Over the past few weeks I've been building ${product.name} (${product.url}).\n\nIt basically ${product.short_description.toLowerCase()}\n\nTech stack: ${product.tech_stack}.\n\nI'd really appreciate your honest, brutal feedback on the UX and whether the core value makes sense to you. What should I add next?`,
          rules_warning: "r/SideProject welcomes maker prototypes. Engage authentically in every reply and avoid aggressive promotional links.",
        },
        {
          subreddit: "r/SaaS",
          title: `How we designed ${product.name} for ${product.target_audience}`,
          post_body: `Hey r/SaaS,\n\nWanted to share the validation process behind ${product.name}. We noticed ${product.short_description.toLowerCase()}\n\nKey takeaways from building the MVP:\n1. Keep the onboarding under 60 seconds.\n2. Cut unnecessary bells and whistles.\n\nWould love to hear how fellow SaaS founders handle customer feedback during early launches.`,
          rules_warning: "r/SaaS has strict zero-spam rules. Share real insights and discuss business mechanics.",
        },
        {
          subreddit: "r/indiehackers",
          title: `Bootstrapping ${product.name}: From idea to launch`,
          post_body: `Hey indie hackers,\n\nJust shipped the first public version of ${product.name}! It's a ${product.category} tool that ${product.tagline.toLowerCase()}.\n\nGoal for this month: get our first 50 active users and iterate on feedback.\n\nLink: ${product.url}\n\nWhat launch channels have worked best for your micro-products?`,
          rules_warning: "Focus on the indie hacking journey, transparent milestones, and open questions.",
        },
      ],
    };

    return {
      executive_summary: `${product.name} possesses strong product-market characteristics for organic developer and maker distribution. Its positioning around "${product.tagline}" solves a clear pain point for ${product.target_audience}. Prioritizing Tier 1 maker launches (Product Hunt, Show HN) alongside niche directories will maximize day-one velocity and permanent high-authority backlinks.`,
      positioning_angle: `${product.name} positions as the lean, developer-friendly alternative to bloated legacy tools, emphasizing rapid time-to-value and modern tech stack ergonomics.`,
      recommended_launch_day: "Tuesday or Thursday at 12:01 AM PST (peak traffic window for tech discovery platforms)",
      top_matches,
      tailored_copies,
      big_launch_kit,
    };
  }

  private static generatePlatformCopyHeuristic(product: Product, platform: Platform): GeneratedCopy {
    let title = product.tagline;
    let body = product.short_description;
    let maker_comment: string | undefined = `Hi everyone! I'm ${product.founder_name}. I built ${product.name} to help ${product.target_audience}. Looking forward to your thoughts!`;
    const tone = platform.tone_notes;

    if (platform.slug === "hackernews") {
      title = `Show HN: ${product.name} – ${product.tagline.replace(/[!.]/g, "")}`;
      body = `Hi HN,\n\nWe built ${product.name} (${product.url}) to solve ${product.short_description.toLowerCase()}.\n\nStack: ${product.tech_stack}.\n\nNo trackers, fast load times. Feedback on architecture and edge cases welcome.`;
      maker_comment = "Happy to answer any questions about the implementation or our design decisions.";
    } else if (platform.slug === "producthunt") {
      title = product.tagline.slice(0, 60);
      body = product.short_description.slice(0, 260);
      maker_comment = `Hey Product Hunt! 👋 I'm ${product.founder_name}. We built ${product.name} because ${product.short_description.toLowerCase()}. We're offering free access to hunters today. Would love to hear what you think!`;
    } else if (platform.slug.startsWith("reddit")) {
      title = `I built a tool for ${product.target_audience}: ${product.name}`;
      body = `Hey everyone! I'm an indie dev who got tired of existing options for ${product.category.toLowerCase()}. So I built ${product.name} (${product.url}).\n\nIt helps you ${product.short_description.toLowerCase()}.\n\nBuilt with ${product.tech_stack}. Check it out and let me know what you'd improve!`;
      maker_comment = undefined;
    } else if (platform.slug === "alternativeto") {
      title = `${product.name} - ${product.tagline.slice(0, 75)}`;
      body = `${product.name} is a modern, lightweight software solution for ${product.target_audience}. Key features include: ${product.short_description}`;
      maker_comment = undefined;
    } else if (platform.slug === "twitter") {
      title = `🚀 Introducing ${product.name}: ${product.tagline}`;
      body = `I spent the last few weeks building ${product.name}.\n\nThe problem: ${product.short_description}\n\nTech stack: ${product.tech_stack}\n\nCheck it out here: ${product.url}\n\nRTs appreciated! #buildinpublic #indiedev`;
      maker_comment = undefined;
    } else {
      // Standard directory listing adhering to limits
      if (platform.tagline_limit && title.length > platform.tagline_limit) {
        title = title.slice(0, platform.tagline_limit - 3) + "...";
      }
      if (platform.description_limit && body.length > platform.description_limit) {
        body = body.slice(0, platform.description_limit - 3) + "...";
      }
    }

    return {
      title_or_tagline: title,
      body_or_description: body,
      maker_comment,
      tone_applied: tone,
      tips: platform.notes,
    };
  }
}
