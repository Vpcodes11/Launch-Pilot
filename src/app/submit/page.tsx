"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  User,
  Target,
  Image as ImageIcon,
  Video,
  Mail,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { EmailSignIn } from "@/components/email-sign-in";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/demo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormData, PricingModel, LaunchGoal } from "@/types";
import { toast } from "sonner";

const DRAFT_STORAGE_KEY = "launchpilot_submit_draft";

const INITIAL_FORM_DATA: ProductFormData = {
  name: "",
  url: "",
  tagline: "",
  short_description: "",
  long_description: "",
  category: "SaaS",
  pricing_model: "freemium",
  tech_stack: "",
  target_audience: "",
  logo_url: "",
  screenshots: [],
  demo_video_url: "",
  founder_name: "",
  founder_twitter: "",
  founder_linkedin: "",
  founder_github: "",
  founder_email: "",
  launch_goal: "all",
};

const CATEGORIES = [
  "SaaS",
  "Developer Tools",
  "AI & Machine Learning",
  "Productivity",
  "Design & Creative",
  "Open Source",
  "FinTech & Crypto",
  "E-commerce",
  "Marketing & SEO",
  "Community & Social",
  "Mobile App",
  "Other",
];

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  const demoMode = isDemoMode();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(!demoMode);
  const canSubmit = demoMode || sessionEmail !== null;

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
        setDraftSavedTime("Loaded from draft");
      }
    } catch {
      // ignore
    }

  }, []);

  useEffect(() => {
    if (demoMode) return;
    const client = createClient();
    if (!client) {
      setCheckingSession(false);
      return;
    }

    let active = true;
    client.auth.getUser()
      .then(({ data }) => {
        if (active) setSessionEmail(data.user?.email ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => { active = false; };
  }, [demoMode]);

  // Auto-save draft on form change
  const updateField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      setDraftSavedTime("Draft saved just now");
    } catch {
      // ignore
    }
  };

  // Step 1 Validation
  const isStep1Valid =
    formData.name.trim().length > 1 &&
    formData.url.trim().length > 3 &&
    formData.tagline.trim().length > 3 &&
    formData.tagline.length <= 60 &&
    formData.short_description.trim().length > 5 &&
    formData.short_description.length <= 260 &&
    formData.long_description.trim().length > 10 &&
    formData.tech_stack.trim().length > 1 &&
    formData.target_audience.trim().length > 1;

  // Step 3 Validation
  const isStep3Valid =
    formData.founder_name.trim().length > 1 &&
    formData.founder_email.trim().includes("@");

  const handleNextStep = () => {
    if (step === 1 && !isStep1Valid) {
      toast.error("Please fill in all required fields and observe character limits.");
      return;
    }
    if (step === 3 && !isStep3Valid) {
      toast.error("Please provide your founder name and a valid email.");
      return;
    }
    if (step < 4) {
      setStep((step + 1) as 1 | 2 | 3 | 4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinalSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Create product in DB
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setSessionEmail(null);
        throw new Error(data.error || "Failed to create product");
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // The product is already saved on the server.
      }
      toast.success("Product submitted. Opening your launch report.");
      router.push(`/product/${data.product.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Quick fill with sample data for effortless demo testing
  const handlePrefillDemo = () => {
    const demoData: ProductFormData = {
      name: "FastFeedback",
      url: "https://fastfeedback.io",
      tagline: "Collect user feedback & feature requests in 1 click",
      short_description: "Embeddable micro-widgets that capture user insights, bug reports, and feature upvotes directly on your web app.",
      long_description: "FastFeedback helps bootstrappers and product engineers understand what users actually want before building. Install a lightweight 4kb script to collect customer sentiment, bug reports with instant console logs, and public upvoting roadmaps.",
      category: "Developer Tools",
      pricing_model: "freemium",
      tech_stack: "Next.js 14, Supabase, Tailwind, TypeScript",
      target_audience: "Solo founders, indie hackers, and SaaS product managers",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128",
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      ],
      demo_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      founder_name: "Maya Lin",
      founder_twitter: "mayalin_builds",
      founder_linkedin: "mayalin",
      founder_github: "mayalin",
      founder_email: "maya@fastfeedback.io",
      launch_goal: "all",
    };
    setFormData(demoData);
    toast.success("Sample indie product data prefilled!");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Submit Your Product
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              100% Free
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fill in once. Get matched with 35 launch platforms and tailored copy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {draftSavedTime && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> {draftSavedTime}
            </span>
          )}
          {demoMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrefillDemo}
              className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
            >
              Prefill Demo Product
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2 my-8">
        {[
          { num: 1, label: "Basics" },
          { num: 2, label: "Assets" },
          { num: 3, label: "Founder" },
          { num: 4, label: "Launch Goal" },
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              type="button"
              aria-current={isActive ? "step" : undefined}
              disabled={!isDone || isSubmitting}
              onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                isActive
                  ? "border-indigo-500 bg-indigo-500/10 text-white font-semibold"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                  : "border-border/60 bg-card/30 text-muted-foreground opacity-60"
              }`}
            >
              <div className="text-xs font-mono mb-0.5">
                {isDone ? "✓ Done" : `Step 0${s.num}`}
              </div>
              <div className="text-xs sm:text-sm truncate">{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* Multi-Step Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl glow-card">
        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                Step 1: Product Basics
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Core information needed by launch directories and communities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Product Name <span className="text-indigo-400">*</span>
                </label>
                <Input
                  placeholder="e.g. LaunchPilot, DevScribe"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Website URL <span className="text-indigo-400">*</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://yourproduct.com"
                  value={formData.url}
                  onChange={(e) => updateField("url", e.target.value)}
                />
              </div>
            </div>

            {/* Tagline (max 60) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Tagline (Max 60 characters) <span className="text-indigo-400">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    formData.tagline.length > 60
                      ? "text-red-400 font-bold"
                      : formData.tagline.length > 50
                      ? "text-amber-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.tagline.length}/60 chars
                </span>
              </div>
              <Input
                placeholder="Punchy one-liner. e.g. Turn Git commits into changelogs in seconds"
                maxLength={60}
                value={formData.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Strictly limited to 60 characters for Product Hunt and directory indexation.
              </p>
            </div>

            {/* Short Description (max 260) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Short Description (Max 260 characters) <span className="text-indigo-400">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    formData.short_description.length > 260
                      ? "text-red-400 font-bold"
                      : formData.short_description.length > 220
                      ? "text-amber-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.short_description.length}/260 chars
                </span>
              </div>
              <Textarea
                rows={2}
                placeholder="Concise overview of what it does and who it helps..."
                maxLength={260}
                value={formData.short_description}
                onChange={(e) => updateField("short_description", e.target.value)}
              />
            </div>

            {/* Long Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Long Description &amp; Backstory <span className="text-indigo-400">*</span>
              </label>
              <Textarea
                rows={4}
                placeholder="Why did you build it? What exact problem does it solve? What is the user journey?"
                value={formData.long_description}
                onChange={(e) => updateField("long_description", e.target.value)}
              />
            </div>

            {/* Category & Pricing Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Primary Category <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Pricing Model <span className="text-indigo-400">*</span>
                </label>
                <select
                  value={formData.pricing_model}
                  onChange={(e) => updateField("pricing_model", e.target.value as PricingModel)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                  <option value="open_source">Open Source</option>
                </select>
              </div>
            </div>

            {/* Tech Stack & Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Tech Stack <span className="text-indigo-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Next.js, Supabase, Tailwind, OpenAI"
                  value={formData.tech_stack}
                  onChange={(e) => updateField("tech_stack", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Essential for Hacker News and DevHunt technical fit.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Target Audience <span className="text-indigo-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Indie hackers, solo founders, B2B SaaS teams"
                  value={formData.target_audience}
                  onChange={(e) => updateField("target_audience", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ASSETS */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                Step 2: Assets &amp; Visuals
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide your logo and screenshots (up to 5) for directory listings.
              </p>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                App Logo (Square recommended, PNG/SVG URL)
              </label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="w-16 h-16 rounded-xl border border-border overflow-hidden bg-secondary shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <Input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => updateField("logo_url", e.target.value)}
                />
              </div>
            </div>

            {/* Screenshots (1-5 URLs) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Screenshots (1 to 5 image URLs)
              </label>
              <div className="space-y-2">
                {[0, 1, 2].map((idx) => (
                  <Input
                    key={idx}
                    type="url"
                    placeholder={`Screenshot #${idx + 1} URL (e.g. Dashboard view, Hero view)`}
                    value={formData.screenshots[idx] || ""}
                    onChange={(e) => {
                      const newScreenshots = [...formData.screenshots];
                      newScreenshots[idx] = e.target.value;
                      updateField(
                        "screenshots",
                        newScreenshots.filter((s) => s.trim().length > 0)
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Optional Demo Video URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Video className="w-4 h-4 text-purple-400" />
                Optional Demo Video URL (YouTube, Loom, Vimeo)
              </label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.demo_video_url}
                onChange={(e) => updateField("demo_video_url", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: FOUNDER PROFILE */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                Step 3: Founder Profile
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hacker News, Reddit, and Product Hunt require genuine founder attribution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Founder Full Name <span className="text-indigo-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Alex Vance"
                  value={formData.founder_name}
                  onChange={(e) => updateField("founder_name", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Founder Email <span className="text-indigo-400">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="alex@yourproduct.com"
                  value={formData.founder_email}
                  onChange={(e) => updateField("founder_email", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Founder Social Links (for maker comments &amp; credits)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Input
                    placeholder="X / Twitter handle"
                    value={formData.founder_twitter}
                    onChange={(e) => updateField("founder_twitter", e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Input
                    placeholder="LinkedIn profile"
                    value={formData.founder_linkedin}
                    onChange={(e) => updateField("founder_linkedin", e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Input
                    placeholder="GitHub username"
                    value={formData.founder_github}
                    onChange={(e) => updateField("founder_github", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LAUNCH GOAL & FINAL AUTH */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Step 4: Launch Goal &amp; Final Confirmation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define your primary launch outcome. We&apos;ll tailor the platform ranking algorithm accordingly.
              </p>
            </div>

            {/* Launch Goal Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                What is your primary launch objective?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "all",
                    title: "All & Balanced Distribution",
                    desc: "Maximizes both day-1 traffic spikes and permanent high-authority backlinks.",
                  },
                  {
                    id: "first_users",
                    title: "First Paying Users",
                    desc: "Prioritizes high-conversion launchpads (PH, DevHunt, Peerlist).",
                  },
                  {
                    id: "seo_backlinks",
                    title: "SEO & DoFollow Backlinks",
                    desc: "Prioritizes high-DR directories (DR 70-90+) for organic Google ranking.",
                  },
                  {
                    id: "feedback",
                    title: "Brutal Founder Feedback",
                    desc: "Prioritizes communities with active feedback culture (Show HN, Reddit).",
                  },
                ].map((goal) => {
                  const isSelected = formData.launch_goal === goal.id;
                  return (
                    <div
                      key={goal.id}
                      onClick={() => updateField("launch_goal", goal.id as LaunchGoal)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                          : "border-border/60 bg-background/40 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          {goal.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {goal.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <section aria-labelledby="submission-account" className="mt-8 space-y-3 border-t border-border/60 pt-6">
              <h3 id="submission-account" className="flex items-center gap-2 text-sm font-semibold text-white">
                <Mail aria-hidden="true" className="size-4 text-indigo-300" /> Founder account
              </h3>
              {checkingSession ? (
                <p role="status" className="text-sm text-slate-300">Checking your session…</p>
              ) : canSubmit ? (
                <p className="flex items-center gap-2 break-all rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                  {demoMode ? "Local demo account" : "Signed in as " + sessionEmail}
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-300">Sign in to save this product and access its launch report later.</p>
                  <EmailSignIn initialEmail={formData.founder_email} onSignedIn={setSessionEmail} />
                </>
              )}
            </section>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 mt-6 border-t border-border/60">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={handleNextStep}
              className="gap-1.5"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="brand"
              size="lg"
              disabled={isSubmitting || !canSubmit}
              onClick={handleFinalSubmit}
              className="h-auto min-h-12 gap-2 whitespace-normal px-4 text-left sm:px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving product…
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Submit &amp; Generate Launch Report
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
