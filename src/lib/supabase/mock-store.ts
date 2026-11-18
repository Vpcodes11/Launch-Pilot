import { SEED_PLATFORMS } from "@/lib/data/platforms-seed";
import { Platform, Product, ProductPlatform, Profile, Order } from "@/types";

// In-memory / persistent mock store for development and demo mode
class MockStore {
  private platforms: Platform[] = [];
  private products: Map<string, Product> = new Map();
  private productPlatforms: Map<string, ProductPlatform[]> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private orders: Order[] = [];
  private currentUser: Profile | null = null;

  constructor() {
    this.initDefaultData();
  }

  private initDefaultData() {
    // Initialize platforms from seed
    this.platforms = SEED_PLATFORMS.map((p, index) => ({
      ...p,
      id: `plat-${index + 1}`,
    }));

    // Demo founder profile
    const demoUser: Profile = {
      id: "usr-demo-founder",
      name: "Alex Vance",
      email: "founder@launchpilot.dev",
      role: "user",
      plan: "free",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    };

    // Demo admin profile
    const adminUser: Profile = {
      id: "usr-admin-launch",
      name: "Sarah Admin",
      email: "admin@launchpilot.dev",
      role: "admin",
      plan: "done_for_you",
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    };

    this.profiles.set(demoUser.id, demoUser);
    this.profiles.set(adminUser.id, adminUser);
    this.currentUser = demoUser;

    // Demo Product 1: Analyzed (Ready to view)
    const demoProduct1: Product = {
      id: "prod-demo-1",
      user_id: demoUser.id,
      name: "DevScribe",
      url: "https://devscribe.io",
      tagline: "Turn Git commits into release notes and blog posts automatically",
      short_description: "DevScribe connects to GitHub and generates developer changelogs, marketing release tweets, and customer documentation in seconds.",
      long_description: "Indie developers and engineering teams spend 4+ hours every sprint drafting changelogs and release notes. DevScribe ingests semantic commits and PR summaries, analyzes what changed for end-users, and generates high-converting release posts formatted for Twitter, Product Hunt, and your custom changelog widget.",
      category: "Developer Tools",
      pricing_model: "freemium",
      tech_stack: "Next.js, TypeScript, Tailwind, OpenAI, GitHub API",
      target_audience: "Indie hackers, developer tool teams, and open source maintainers",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
      ],
      demo_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      founder_name: "Alex Vance",
      founder_twitter: "alexvance_dev",
      founder_linkedin: "alex-vance",
      founder_github: "alexvance",
      founder_email: "founder@launchpilot.dev",
      launch_goal: "all",
      status: "analyzed",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      ai_analysis: {
        positioning_angle: "Automated developer distribution engine focused on reclaiming 4+ sprint hours from release documentation.",
        recommended_launch_day: "Tuesday or Thursday 00:01 AM PST",
        executive_summary: "High organic fit with developer communities and maker launchpads. Strong alignment with DevHunt, Show HN, and Product Hunt due to direct utility to builders.",
        top_matches: [
          { platform_slug: "producthunt", platform_name: "Product Hunt", score: 98, reason: "Productivity/Dev tool sweet spot with strong maker appeal and demonstrable utility.", tier: 1 },
          { platform_slug: "hackernews", platform_name: "Hacker News (Show HN)", score: 95, reason: "Technical git commit analysis and developer focus resonates well with HN engineers when presented without marketing hype.", tier: 1 },
          { platform_slug: "devhunt", platform_name: "DevHunt", score: 96, reason: "Dedicated developer audience that actively tests and upvotes git and workflow tooling.", tier: 2 },
          { platform_slug: "reddit-sideproject", platform_name: "Reddit r/SideProject", score: 92, reason: "Relatable developer pain point of writing release docs makes for an authentic founder post.", tier: 1 },
          { platform_slug: "peerlist", platform_name: "Peerlist Launchpad", score: 90, reason: "Active community of software engineers and builders looking for workflow tools.", tier: 2 },
          { platform_slug: "saashub", platform_name: "SaaSHub", score: 88, reason: "Excellent indexing for software alternatives and developer release tooling.", tier: 3 },
          { platform_slug: "alternativeto", platform_name: "AlternativeTo", score: 87, reason: "Direct alternative to manual changelog tools and expensive SaaS release hubs.", tier: 3 },
          { platform_slug: "theresanaiforthat", platform_name: "There's An AI For That", score: 86, reason: "AI-driven summarization categorization matches high-intent directory searchers.", tier: 4 },
          { platform_slug: "devto", platform_name: "Dev.to", score: 94, reason: "Top tier platform for a deep-dive tutorial: 'How we parse Git ASTs to write changelogs'.", tier: 4 },
          { platform_slug: "twitter", platform_name: "X/Twitter (Build in Public)", score: 91, reason: "High viral coefficient among #buildinpublic developers showcasing before/after changelogs.", tier: 4 },
        ],
        tailored_copies: {
          producthunt: {
            title_or_tagline: "Turn git commits into changelogs & blog posts in seconds",
            body_or_description: "DevScribe automatically connects to your GitHub repositories, parses semantic commits and pull requests, and drafts customer-facing release notes, marketing tweets, and markdown changelogs in one click.",
            maker_comment: "Hey Product Hunt! 👋 I built DevScribe because after every release, I'd stare at 40 commit hashes trying to remember what actually changed for our users. We built a parser that categorizes features, bug fixes, and improvements, writing human-readable release notes. Would love your candid feedback!",
            tone_applied: "Punchy, relatable maker tone with clear problem-solution framing.",
            tips: "Launch at 12:01 AM PST. Have team respond to comments within the first 2 hours.",
          },
          hackernews: {
            title_or_tagline: "Show HN: DevScribe – Generate changelogs from git history and PR diffs",
            body_or_description: "Hi HN, DevScribe is a CLI and web app that parses git commit trees and GitHub PR diffs to produce structured changelogs. It focuses on isolating user-facing impact from internal refactors.\n\nStack: Next.js, Node.js git parser, OpenAI structured outputs. No tracking cookies. Feedback on commit classification heuristics welcome.",
            maker_comment: "We built an AST parser for conventional commits and use an LLM only for semantic compression. Happy to answer questions regarding parsing edge cases or prompt engineering.",
            tone_applied: "Plain, factual, technical. Zero hype.",
            tips: "Do not ask for upvotes. Engage technically in the comments.",
          },
          "reddit-sideproject": {
            title_or_tagline: "I hated writing release notes every Friday, so I built a tool that writes them from git commits",
            body_or_description: "Hey r/SideProject! Every time I shipped a new feature, writing the changelog took longer than pushing the actual commit. I put together DevScribe over the past 2 weekends. It connects to your repo and converts raw git history into clean release notes.\n\nIt's free to try for indie projects. What features would you want in a changelog tool?",
            tone_applied: "Authentic founder story, community feedback seeking.",
            tips: "Be responsive in comments and thank contributors for bug reports.",
          },
        },
        big_launch_kit: {
          product_hunt: {
            tagline_options: [
              "Turn git commits into changelogs & release posts in seconds",
              "Automate your developer changelog directly from GitHub",
              "The release notes generator built for indie developers",
            ],
            gallery_copy: [
              "Slide 1: Connect your GitHub repository in 1 click",
              "Slide 2: Automatic semantic commit parsing & categorization",
              "Slide 3: One-click export to Markdown, Twitter thread, and Slack",
              "Slide 4: Beautiful hosted public changelog for your users",
            ],
            maker_first_comment: "Hey Product Hunt! 👋 I'm Alex, creator of DevScribe. As solo founders and small engineering teams, we always push documentation to the bottom of the pile. DevScribe makes changelog writing zero-effort. We're offering our Launch Special free tier to all PH hunters today!",
            launch_day_checklist: [
              { time: "12:01 AM PST", action: "Launch goes live", tips: "Publish maker comment immediately; verify all links and assets." },
              { time: "06:00 AM PST", action: "Morning community wave", tips: "Tweet launch announcement thread; post in maker Slack & Discord groups." },
              { time: "09:00 AM PST", action: "Peak US East Coast engagement", tips: "Reply to every single Product Hunt comment within 10 minutes." },
              { time: "12:00 PM PST", action: "Mid-day milestone update", tips: "Post milestone tweet (e.g. 'Trending #3 on Product Hunt!') with gratitude." },
              { time: "08:00 PM PST", action: "Final stretch push", tips: "Send thank-you email to supporters and prepare retrospective post." },
            ],
          },
          show_hn: {
            title: "Show HN: DevScribe – Generate changelogs from git history and PR diffs",
            post_body: "Hi Hacker News,\n\nI built DevScribe because writing changelogs by hand after each sprint was tedious and error-prone. DevScribe connects to a Git repo, filters out merge noise and chore commits, and generates structured release documentation.\n\nLive demo at https://devscribe.io without signup.\n\nCode analysis runs with conventional commit patterns first, then applies an LLM only for semantic summarization. Would appreciate your critique on our parsing approach and data privacy design.",
            founder_advice: "Keep the HN comment section purely technical. Be upfront about limitations and server load during high traffic.",
          },
          reddit: [
            {
              subreddit: "r/SideProject",
              title: "I spent 3 weeks building a tool that turns git commits into release notes. Here's what I learned",
              post_body: "Hey r/SideProject, I'm a developer who always neglected changelogs. I built DevScribe to automate the whole flow from git log to public changelog.\n\nLooking for brutal feedback on UX and whether the generated summaries make sense for your workflow. Check it out free: https://devscribe.io",
              rules_warning: "r/SideProject welcomes maker stories. Do not spam links; post genuine reflections and participate in replies.",
            },
            {
              subreddit: "r/SaaS",
              title: "How automating our changelogs increased our user retention by 18%",
              post_body: "Users don't know what you ship if you don't communicate it. We analyzed 50+ micro-SaaS products and found consistent changelogs boost retention. We built DevScribe to make this frictionless.",
              rules_warning: "r/SaaS requires valuable business insights and zero aggressive sales pitches. Disclose affiliation.",
            },
            {
              subreddit: "r/indiehackers",
              title: "From 0 to launching DevScribe: Tech stack choices and lessons from building with Next.js & AI",
              post_body: "Sharing the complete architecture breakdown of DevScribe: why we chose Supabase, how we keep LLM costs under $0.002 per changelog, and our launch strategy.",
              rules_warning: "Share transparent numbers and technical decisions to provide real value to fellow bootstrappers.",
            },
          ],
        },
      },
    };

    this.products.set(demoProduct1.id, demoProduct1);

    // Populate product_platforms for demoProduct1
    const productPlatformsList: ProductPlatform[] = this.platforms.slice(0, 15).map((plat, idx) => {
      let status: ProductPlatform["status"] = "not started";
      let live_url: string | null = null;
      let submitted_at: string | null = null;

      if (idx === 0) {
        status = "live";
        live_url = "https://www.producthunt.com/products/devscribe";
        submitted_at = new Date(Date.now() - 86400000).toISOString();
      } else if (idx === 1) {
        status = "pending review";
        submitted_at = new Date().toISOString();
      } else if (idx === 2) {
        status = "submitted";
        submitted_at = new Date().toISOString();
      }

      return {
        id: `pp-${demoProduct1.id}-${plat.id}`,
        product_id: demoProduct1.id,
        platform_id: plat.id,
        match_score: Math.max(70, 99 - idx * 2),
        match_reason: `Strong category match with ${plat.name} audience looking for developer productivity and software tools.`,
        generated_copy: {
          title_or_tagline: plat.tagline_limit && plat.tagline_limit <= 60 
            ? "Turn git commits into changelogs in seconds" 
            : "DevScribe: Automatic changelogs & release posts from your git commits",
          body_or_description: "DevScribe connects to your GitHub repository and automatically drafts customer-ready release notes, changelog pages, and marketing tweets from your commits.",
          tone_applied: plat.tone_notes,
          tips: plat.notes,
        },
        status,
        live_url,
        proof_url: status === "live" ? "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800" : null,
        submitted_at,
        utm_link: `https://devscribe.io?utm_source=${plat.slug}&utm_campaign=launchpilot`,
        platform: plat,
      };
    });

    this.productPlatforms.set(demoProduct1.id, productPlatformsList);

    // Demo Paid Order
    const demoOrder: Order = {
      id: "ord-demo-1",
      user_id: demoUser.id,
      product_id: demoProduct1.id,
      plan: "done_for_you",
      amount: 99,
      currency: "USD",
      provider: "stripe",
      provider_ref: "cs_test_launchpilot_demo123",
      status: "completed",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    };
    this.orders.push(demoOrder);
  }

  // --- Current User / Auth ---
  getCurrentUser(): Profile {
    return this.currentUser || Array.from(this.profiles.values())[0];
  }

  setCurrentUserRole(role: "user" | "admin") {
    if (this.currentUser) {
      this.currentUser.role = role;
    }
  }

  setCurrentUserPlan(plan: Profile["plan"]) {
    if (this.currentUser) {
      this.currentUser.plan = plan;
    }
  }

  getProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  getProfile(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  // --- Platforms ---
  getPlatforms(): Platform[] {
    return this.platforms;
  }

  getPlatformBySlug(slug: string): Platform | undefined {
    return this.platforms.find((p) => p.slug === slug);
  }

  addPlatform(platform: Omit<Platform, "id">): Platform {
    const newPlatform: Platform = {
      ...platform,
      id: `plat-${Date.now()}`,
    };
    this.platforms.unshift(newPlatform);
    return newPlatform;
  }

  updatePlatform(id: string, updates: Partial<Platform>): Platform | null {
    const index = this.platforms.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.platforms[index] = { ...this.platforms[index], ...updates };
    return this.platforms[index];
  }

  deletePlatform(id: string): boolean {
    const initialLen = this.platforms.length;
    this.platforms = this.platforms.filter((p) => p.id !== id);
    return this.platforms.length < initialLen;
  }

  // --- Products ---
  getProducts(userId?: string): Product[] {
    const all = Array.from(this.products.values());
    if (!userId) return all;
    return all.filter((p) => p.user_id === userId);
  }

  getProduct(id: string): Product | null {
    return this.products.get(id) || null;
  }

  createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Product {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...product,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const existing = this.products.get(id);
    if (!existing) return null;
    const updated: Product = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.products.set(id, updated);
    return updated;
  }

  deleteProduct(id: string): boolean {
    return this.products.delete(id);
  }

  // --- Product Platforms (Submissions & Tracker) ---
  getProductPlatforms(productId: string): ProductPlatform[] {
    const list = this.productPlatforms.get(productId) || [];
    // Ensure joined platform object
    return list.map((item) => {
      if (!item.platform) {
        item.platform = this.platforms.find((p) => p.id === item.platform_id);
      }
      return item;
    });
  }

  setProductPlatforms(productId: string, items: ProductPlatform[]) {
    this.productPlatforms.set(productId, items);
  }

  updateProductPlatformStatus(
    productId: string,
    platformId: string,
    updates: Partial<ProductPlatform>
  ): ProductPlatform | null {
    const list = this.productPlatforms.get(productId) || [];
    const index = list.findIndex((pp) => pp.platform_id === platformId || pp.id === platformId);
    if (index === -1) {
      const plat = this.platforms.find((p) => p.id === platformId || p.slug === platformId);
      const newItem: ProductPlatform = {
        id: `pp-${productId}-${platformId}`,
        product_id: productId,
        platform_id: platformId,
        match_score: 80,
        match_reason: "",
        generated_copy: { title_or_tagline: "", body_or_description: "", tone_applied: "" },
        status: "not started",
        live_url: null,
        proof_url: null,
        submitted_at: null,
        utm_link: "",
        platform: plat,
        ...updates,
      };
      list.push(newItem);
      this.productPlatforms.set(productId, list);
      return newItem;
    }
    list[index] = { ...list[index], ...updates };
    this.productPlatforms.set(productId, list);
    return list[index];
  }

  // --- Orders ---
  getOrders(): Order[] {
    return this.orders;
  }

  createOrder(order: Omit<Order, "id" | "created_at">): Order {
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.orders.unshift(newOrder);

    // If order is completed, update product status and user plan
    if (order.status === "completed") {
      if (order.product_id) {
        this.updateProduct(order.product_id, { status: "paid" });
      }
      const user = this.profiles.get(order.user_id);
      if (user) {
        user.plan = order.plan;
      }
    }
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: Order["status"]): Order | null {
    const order = this.orders.find((o) => o.id === orderId || o.provider_ref === orderId);
    if (!order) return null;
    order.status = status;
    if (status === "completed") {
      if (order.product_id) {
        this.updateProduct(order.product_id, { status: "paid" });
      }
      const user = this.profiles.get(order.user_id);
      if (user) {
        user.plan = order.plan;
      }
    }
    return order;
  }
}

// Global singleton instance
const globalStoreKey = Symbol.for("launchpilot.mockstore");
const globalObj = globalThis as unknown as { [key: symbol]: MockStore };

if (!globalObj[globalStoreKey]) {
  globalObj[globalStoreKey] = new MockStore();
}

export const mockStore = globalObj[globalStoreKey];
