export function isDemoMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_LAUNCHPILOT_DEMO === "true" &&
    (!supabaseUrl || supabaseUrl.includes("your-project"));
}
