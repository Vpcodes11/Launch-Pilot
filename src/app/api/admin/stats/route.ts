import { requireAdmin } from "@/lib/supabase/require-admin";
import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/supabase/mock-store";

export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const orders = await DataService.getOrders();
    const products = await DataService.getProducts();
    const platforms = await DataService.getPlatforms();
    const admin = createAdminClient();
    let totalSignups = mockStore.getProfiles().length;
    if (admin) {
      const { count, error } = await admin.from("profiles").select("id", { count: "exact", head: true });
      if (error) throw error;
      totalSignups = count ?? 0;
    }

    // Calculate revenue
    const totalRevenueUSD = orders
      .filter((o) => o.status === "completed" && o.currency === "USD")
      .reduce((sum, o) => sum + Number(o.amount), 0);

    const totalRevenueINR = orders
      .filter((o) => o.status === "completed" && o.currency === "INR")
      .reduce((sum, o) => sum + Number(o.amount), 0);

    // Paid Done-For-You Queue
    const fulfilledProductIds = new Set(orders
      .filter((order) => order.status === "completed" && order.plan === "done_for_you")
      .map((order) => order.product_id));
    const paidProducts = products.filter((product) => fulfilledProductIds.has(product.id));

    return NextResponse.json({
      success: true,
      stats: {
        totalSignups,
        paidOrdersCount: orders.filter((o) => o.status === "completed").length,
        totalRevenueUSD,
        totalRevenueINR,
        dfyQueueCount: paidProducts.length,
      },
      dfyQueue: paidProducts,
      orders,
      platformsCount: platforms.length,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
