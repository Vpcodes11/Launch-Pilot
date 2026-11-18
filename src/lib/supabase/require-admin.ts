import { isDemoMode } from "@/lib/supabase/demo";
import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";

export async function requireAdmin() {
  if (isDemoMode()) return null;
  const user = await DataService.getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return null;
}
