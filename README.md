# 🚀 LaunchPilot — Indie Developer Distribution & Launch Engine

> **"You shipped it. Now get it seen."**  
> Tailored launches on 35 platforms, plus Product Hunt, Hacker News, and Reddit launch preparation. Built specifically for indie hackers, bootstrappers, and micro-SaaS builders.

---

## ⚡ Overview

LaunchPilot solves the most agonizing bottleneck for software developers: **distribution**. A founder submits their product once. The app analyzes which launch platforms fit the product best, writes bespoke copy tailored to each community's tone and character limits, provides an execution-ready launch kit with hour-by-hour checklists, and tracks live listings with custom UTM parameters. On the Done-For-You plan, our team submits to eligible directories and records submission evidence in the tracker.

### 🌟 Key Features
- **One-Time Multi-Step Submission (`/submit`)**: 4-step wizard with real-time character limit enforcement (tagline $\le 60$, short description $\le 260$), draft auto-save to local storage, asset management, and authentication gate.
- **AI-Powered Platform Match & Tailored Copy (`/product/[id]`)**:
  - Scores 35 platforms ($0-100$) across 4 tiers (Tier 1 Big Launches, Tier 2 Launch Directories, Tier 3 High-DR SEO/Backlinks, Tier 4 Niche AI/Dev/Content).
  - Generates tone-matched listings (Hacker News: technical & plain; Product Hunt: punchy tagline + maker first comment; Reddit: story-driven & value-first).
  - Single-platform **Copy** and **Regenerate** buttons with instant feedback.
  - Guardrail: strictly never invents fake metrics or fake testimonials.
- **Big Launch Kit (Paid Only)**:
  - Product Hunt tagline variations, gallery slides, maker comment, and hour-by-hour timeline.
  - Show HN title, technical body, and founder etiquette advice.
  - 3 subreddit drafts (r/SideProject, r/SaaS, r/indiehackers) with explicit self-promotion rule warnings.
  - Free preview: top 5 matches and 2 copy samples, rest blurred with paywall CTA.
- **Interactive Launch Tracker (`/product/[id]/tracker`)**: Live status tracker (`not started`, `submitted`, `pending review`, `live`, `rejected`), live listing URL input, unique UTM parameters (`?utm_source={slug}&utm_campaign=launchpilot`), and dynamic completion progress bar.
- **Multi-Currency Payments Abstraction**:
  - **Stripe** for USD ($29 Launch Kit, $99 Done-For-You).
  - **Razorpay** for INR (₹1,999 Launch Kit, ₹6,999 Done-For-You).
  - Cryptographic webhook verification (`/api/webhooks/stripe`, `/api/webhooks/razorpay`) unlocking product features upon confirmed payment.
- **Role-Based Admin Console (`/admin`)**:
  - Live Done-For-You queue management with team member assignment.
  - Update platform submission statuses, live URLs, and upload proof screenshots.
  - Full CRUD operations for platforms database.
  - Metrics tracking: signups, paid orders, and total revenue breakdown.
- **Transactional Emails (Resend)**: Automated emails for welcome, analysis ready, payment receipt, and launch complete notifications.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing throughout)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with modern dark-mode indie aesthetic, custom gradients, and glowing borders
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) patterns with `@radix-ui` accessible primitives and [Sonner](https://sonner.emilkowal.ski/) toast notifications
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security, email code sign-in, Storage bucket)
- **AI Engine**: OpenAI (`gpt-4o-mini`) & Anthropic (`claude-3-5-sonnet`) with deterministic heuristic fallback engine
- **Payments**: Provider abstraction supporting **Stripe** (USD) and **Razorpay** (INR) with signature verification
- **Emails**: [Resend](https://resend.com/) with responsive dark HTML templates

---

## 📁 Project Structure

```
launchpilot/
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_init.sql      # Supabase Postgres schema with RLS & Auth trigger
│   └── seed.sql                          # 35+ curated launch platforms seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── platforms/route.ts    # Admin Platform CRUD API
│   │   │   │   └── stats/route.ts        # Admin Dashboard Metrics API
│   │   │   ├── analyze/[productId]/route.ts  # AI Analysis & Batch Copy generation
│   │   │   ├── checkout/route.ts         # Unified Checkout Session API (Stripe/Razorpay)
│   │   │   ├── products/
│   │   │   │   ├── route.ts              # Products list & create API
│   │   │   │   └── [id]/route.ts         # Single product fetch & update API
│   │   │   ├── regenerate-copy/route.ts  # Single platform copy regeneration API
│   │   │   ├── tracker/[productId]/route.ts  # Launch tracker items & status update API
│   │   │   └── webhooks/
│   │   │       ├── razorpay/route.ts     # Razorpay HMAC signature verification webhook
│   │   │       └── stripe/route.ts       # Stripe signature verification webhook
│   │   ├── admin/page.tsx                # Role-based Admin console
│   │   ├── dashboard/page.tsx            # Founder dashboard & product status list
│   │   ├── pricing/page.tsx              # Pricing plans with USD/INR currency switcher
│   │   ├── product/[id]/
│   │   │   ├── page.tsx                  # Product report: Platform Match, Copy, Big Launch Kit
│   │   │   └── tracker/page.tsx          # Launch Tracker table with live URLs & UTMs
│   │   ├── submit/page.tsx               # 4-step product submission wizard with draft saving
│   │   ├── globals.css                   # Tailwind theme tokens & glowing card styles
│   │   ├── layout.tsx                    # Root layout with Navbar, Footer, and Toaster
│   │   └── page.tsx                      # High-converting Landing Page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                # Sticky navbar with role-switcher demo toggle
│   │   │   └── Footer.tsx                # Footer with resource links & attribution
│   │   └── ui/                           # Button, Badge, Card, Input, Textarea, Progress
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── analyzer.ts               # OpenAI / Anthropic caller with heuristic fallback
│   │   │   └── schemas.ts                # Zod validation schemas
│   │   ├── data/
│   │   │   └── platforms-seed.ts         # 35 curated launch platforms dataset
│   │   ├── email/
│   │   │   └── resend.ts                 # Transactional emails service (welcome, analysis, receipt, launch complete)
│   │   ├── payments/
│   │   │   ├── index.ts                  # PaymentManager facade
│   │   │   ├── razorpay.ts               # Razorpay order creation & HMAC verification
│   │   │   ├── stripe.ts                 # Stripe checkout sessions & webhook verification
│   │   │   └── types.ts                  # Payment types & plan pricing configs
│   │   ├── services/
│   │   │   └── data.ts                   # Data service layer with Supabase/Mockstore switching
│   │   ├── supabase/
│   │   │   ├── admin.ts                  # Supabase service role client
│   │   │   ├── client.ts                 # Supabase browser client
│   │   │   ├── mock-store.ts             # In-memory mock store for demo testing
│   │   │   └── server.ts                 # Supabase server client
│   │   └── utils.ts                      # Tailwind merging, currency & date formatters
│   └── types/
│       └── index.ts                      # Core TypeScript domain models
├── .env.example                          # Documented environment secrets
└── package.json
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
cd launchpilot
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate the required keys (or leave defaults for local sandbox testing):

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Razorpay
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# Resend
RESEND_API_KEY="re_..."
```

*(Note: If API keys are omitted in development mode, LaunchPilot will automatically activate its built-in intelligent indie-hacker heuristic engine and development store, so all pages and flows work immediately without errors).*

### 3. Database Setup (Supabase)

1. Open your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Run the migration script located at `supabase/migrations/20240101000000_init.sql`. This creates all tables (`profiles`, `products`, `platforms`, `product_platforms`, `orders`), configures Row Level Security (RLS) policies, and establishes the auto-profile trigger on `auth.users`.
4. Run the seed script located at `supabase/seed.sql` to populate the 35+ verified launch platforms.

### Configure founder sign-in

Keep the Email provider enabled in Supabase Auth. Under **Authentication → Email Templates**, set both **Confirm signup** and **Magic Link** to show the one-time code, using a body such as the following.

```html
<p>Your LaunchPilot sign-in code is <strong>{{ .Token }}</strong>.</p>
```

The dashboard and submission form verify the code through Supabase Auth. Configure your production SMTP provider and test both first-time sign-up and repeat sign-in before accepting customers. The local demo uses its seeded account and skips email delivery.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Platform Tiers & Seed Data

The database is pre-seeded with 35 high-impact platforms categorized into 4 tiers, all marked with `verify` notes:

| Tier | Category | Example Platforms | Key Tone Focus |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Big Launches | Product Hunt, Hacker News (Show HN), Reddit (r/SideProject, r/SaaS, r/indiehackers), Indie Hackers | High volume, maker origin story, technical honesty, zero hype |
| **Tier 2** | Launch Directories | BetaList, Peerlist Launchpad, DevHunt, Uneed, MicroLaunch, Fazier, TinyLaunch, Launching Next, StartupBase, Launched, BetaPage, Product Hunt Ship | Early adopters, beta testers, maker leaderboards |
| **Tier 3** | SEO & Backlinks (DR 70-90+) | SaaSHub, AlternativeTo, Startup Stash, SideProjectors, OpenAlternative, Crunchbase, G2, Capterra | Keyword-rich, competitor alternative mapping, high authority |
| **Tier 4** | Niche & Content | There's An AI For That, Futurepedia, Toolify, Hacker Noon, Dev.to, Hashnode, Medium, X/Twitter (#buildinpublic), LinkedIn | AI directories, in-depth architectural posts, social threads |

---

## 🔒 Security & Quality Standards

- **Row Level Security (RLS)**: Enforced across all tables in Postgres. Founders can only query and edit their own products and tracker rows; admins have global queue access.
- **Payment Signature Verification**: Stripe webhooks verify signatures with `stripe.webhooks.constructEvent()`; Razorpay webhooks verify signatures with cryptographic HMAC SHA-256. Features unlock after a verified, settled payment matches the stored order amount and currency. Product-specific access comes from the completed order, independently of tracker progress.
- **Strict Anti-Hallucination AI Guardrails**: The AI analysis engine is prompted with strict constraints: never fabricate user testimonials or metrics; strictly observe character limits ($\le 60$ for PH taglines, $\le 260$ for descriptions).
- **Zod Validation & Auto-Retry**: Analysis responses are strictly parsed with Zod schemas; malformed JSON triggers an automatic retry.
- **Responsive & Accessible**: Dark-mode friendly, mobile responsive navigation, accessible Radix UI primitives, loading states, and error handling.

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Set the webhook endpoints in your Stripe and Razorpay dashboards:
   - Stripe: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Razorpay: `https://your-domain.vercel.app/api/webhooks/razorpay`

### Billing rollout

Apply all Supabase migrations, including `20261118100000_enforce_paid_reports.sql`, with this app version. The migration moves product, tracker, and order table access behind authenticated server routes and adds transactional fulfillment. Set `SUPABASE_SERVICE_ROLE_KEY` as a server-only value and set `NEXT_PUBLIC_APP_URL` to the deployed origin.

In staging, register Stripe `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and Razorpay `payment.captured` (with capture enabled). Verify both payment flows in provider test mode, including the pending report, fulfilled order, and Done-For-You queue. Review existing completed orders against provider records before relying on their historical status. New Growth subscriptions are paused. Existing subscriptions require an operator review in the payment dashboard.


5. Deploy!
6. Open `https://your-domain/api/health?key=YOUR_HEALTH_KEY`: it lists every setting as present or missing.
7. Make yourself admin: in Supabase → Table editor → `profiles`, set `role` to `admin` on your own row (users can't change this themselves).


### Local demo and production access

Set NEXT_PUBLIC_LAUNCHPILOT_DEMO=true with npm run dev and placeholder service credentials for the local demo. Apply all Supabase migrations to staging. Production submission, checkout, and admin requests require a Supabase session. Admin APIs verify the profile role on the server.
