import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/health                  -> { ok, database }  (public)
 * GET /api/health?key=<HEALTH_KEY> -> every setting, present / missing (never the values)
 */
export async function GET(req: Request) {
  let database = false;
  try {
    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from("platforms").select("id", { head: true, count: "exact" });
      database = !error;
    }
  } catch (e) {
    console.error("health: database", e);
  }
  const secret = process.env.HEALTH_KEY;
  if (!secret || new URL(req.url).searchParams.get("key") !== secret) {
    return NextResponse.json({ ok: database, database }, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }
  const has = (n: string) => Boolean(process.env[n]) && !/your[-_]|\.\.\.$/.test(process.env[n] || "");
  const checks: Record<string, { ok: boolean; note?: string }> = {
    database: { ok: database, note: "Supabase reachable, migrations applied, platforms seeded" },
    NEXT_PUBLIC_APP_URL: { ok: (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://") },
    NEXT_PUBLIC_SUPABASE_URL: { ok: has("NEXT_PUBLIC_SUPABASE_URL") },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { ok: has("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
    SUPABASE_SERVICE_ROLE_KEY: { ok: has("SUPABASE_SERVICE_ROLE_KEY") },
    ai: { ok: has("OPENAI_API_KEY") || has("ANTHROPIC_API_KEY"), note: "OPENAI_API_KEY or ANTHROPIC_API_KEY" },
    payments: { ok: (has("STRIPE_SECRET_KEY") && has("STRIPE_WEBHOOK_SECRET")) || (has("RAZORPAY_KEY_SECRET") && has("RAZORPAY_WEBHOOK_SECRET")), note: "Stripe and/or Razorpay keys + webhook secrets" },
    RESEND_API_KEY: { ok: has("RESEND_API_KEY") },
    EMAIL_FROM: { ok: has("EMAIL_FROM") },
    demo_mode_off: { ok: process.env.NEXT_PUBLIC_LAUNCHPILOT_DEMO !== "true" },
  };
  return NextResponse.json({ ready: Object.values(checks).every((c) => c.ok), checks }, { headers: { "Cache-Control": "no-store" } });
}
