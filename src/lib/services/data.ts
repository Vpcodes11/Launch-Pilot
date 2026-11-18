import { isDemoMode } from "@/lib/supabase/demo";
import { mockStore } from "@/lib/supabase/mock-store";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Platform, Product, ProductPlatform, Profile, Order, ProductFormData } from "@/types";

export class DataService {
  // Profiles & Auth
  static async getCurrentUser(): Promise<Profile | null> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) return profile as Profile;
        }
      }
    } catch {
      // Fallback to mock store
    }
    if (!isDemoMode()) return null;
    return mockStore.getCurrentUser();
  }

  // Platforms
  static async getPlatforms(): Promise<Platform[]> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("platforms")
          .select("*")
          .order("tier", { ascending: true })
          .order("domain_rating", { ascending: false });

        if (!error && data) {
          return data as Platform[];
        }
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.getPlatforms();
  }

  static async getPlatform(idOrSlug: string): Promise<Platform | null> {
    const platforms = await this.getPlatforms();
    return platforms.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  }

  static async createPlatform(platform: Omit<Platform, "id">): Promise<Platform> {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from("platforms").insert(platform).select().single();
        if (!error && data) return data as Platform;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.addPlatform(platform);
  }

  static async updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform | null> {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from("platforms").update(updates).eq("id", id).select().single();
        if (!error && data) return data as Platform;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) return null;
    return mockStore.updatePlatform(id, updates);
  }

  static async deletePlatform(id: string): Promise<boolean> {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { error } = await supabase.from("platforms").delete().eq("id", id);
        if (!error) return true;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.deletePlatform(id);
  }

  // Products
  static async getProducts(userId?: string): Promise<Product[]> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        let query = supabase.from("products").select("*").order("created_at", { ascending: false });
        if (userId) {
          query = query.eq("user_id", userId);
        }
        const { data, error } = await query;
        if (!error && data) return data as Product[];
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.getProducts(userId);
  }

  static async getProduct(id: string): Promise<Product | null> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
        if (!error && data) return data as Product;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) return null;
    return mockStore.getProduct(id);
  }

  static async createProduct(userId: string, data: ProductFormData): Promise<Product> {
    const newProductData = {
      ...data,
      user_id: userId,
      status: "draft" as const,
      ai_analysis: null,
    };

    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const { data: created, error } = await supabase.from("products").insert(newProductData).select().single();
        if (!error && created) return created as Product;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.createProduct(newProductData);
  }

  static async updateProduct(id: string, updates: Partial<Product>, expectedStatus?: Product["status"]): Promise<Product | null> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const query = supabase.from("products").update(updates).eq("id", id);
        if (expectedStatus) query.eq("status", expectedStatus);
        const { data, error } = await query.select().maybeSingle();
        if (!error && data) return data as Product;
      }
    } catch {
      // Fallback to the demo store when enabled.
    }
    if (!isDemoMode()) return null;
    const product = mockStore.getProduct(id);
    if (expectedStatus && product?.status !== expectedStatus) return null;
    return mockStore.updateProduct(id, updates);
  }

  // Product platforms
  static async getProductPlatforms(productId: string): Promise<ProductPlatform[]> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("product_platforms")
          .select("*, platform:platforms(*)")
          .eq("product_id", productId);

        if (!error && data) {
          return data as ProductPlatform[];
        }
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.getProductPlatforms(productId);
  }

  static async savePlatformMatches(productId: string, items: ProductPlatform[]): Promise<void> {
    if (items.length === 0) return;
    const rows = items.map(({ platform_id, match_score, match_reason, generated_copy, utm_link }) => ({
      product_id: productId,
      platform_id,
      match_score,
      match_reason,
      generated_copy,
      utm_link,
    }));

    const supabase = createServerSupabase();
    if (supabase) {
      const { error } = await supabase.from("product_platforms").upsert(rows, {
        onConflict: "product_id,platform_id",
        defaultToNull: false,
      });
      if (error) throw error;
      return;
    }

    if (!isDemoMode()) throw new Error("Database is unavailable");
    const existing = new Map(mockStore.getProductPlatforms(productId).map((item) => [item.platform_id, item]));
    items.forEach((item, index) => {
      const saved = existing.get(item.platform_id);
      existing.set(item.platform_id, saved ? { ...saved, ...rows[index] } : item);
    });
    mockStore.setProductPlatforms(productId, Array.from(existing.values()));
  }

  static async updateProductPlatform(
    productId: string,
    platformId: string,
    updates: Partial<ProductPlatform>
  ): Promise<ProductPlatform | null> {
    try {
      const supabase = createServerSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("product_platforms")
          .update(updates)
          .eq("product_id", productId)
          .eq("platform_id", platformId)
          .select("*, platform:platforms(*)")
          .single();

        if (!error && data) return data as ProductPlatform;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) return null;
    return mockStore.updateProductPlatformStatus(productId, platformId, updates);
  }

  // Orders
  static async getOrders(): Promise<Order[]> {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (!error && data) return data as Order[];
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.getOrders();
  }

  static async createOrder(order: Omit<Order, "id" | "created_at">): Promise<Order> {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from("orders").insert(order).select().single();
        if (!error && data) return data as Order;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) throw new Error("Launch Pilot data operation failed");
    return mockStore.createOrder(order);
  }

  static async updateOrderStatus(orderRef: string, status: Order["status"]): Promise<Order | null> {
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .update({ status })
          .eq("provider_ref", orderRef)
          .select()
          .single();

        if (!error && data) return data as Order;
      }
    } catch {
      // Fallback
    }
    if (!isDemoMode()) return null;
    return mockStore.updateOrderStatus(orderRef, status);
  }
}
