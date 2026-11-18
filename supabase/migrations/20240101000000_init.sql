-- LaunchPilot Supabase Initial Migration
-- Production schema with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'launch_kit', 'done_for_you', 'growth')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PLATFORMS TABLE (Directories, Communities, Launch sites)
CREATE TABLE IF NOT EXISTS public.platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  submit_url TEXT NOT NULL,
  tier INT NOT NULL CHECK (tier IN (1, 2, 3, 4)),
  categories TEXT[] NOT NULL DEFAULT '{}',
  is_free BOOLEAN NOT NULL DEFAULT true,
  has_paid_option BOOLEAN NOT NULL DEFAULT false,
  domain_rating INT NOT NULL DEFAULT 50,
  tagline_limit INT,
  description_limit INT,
  tone_notes TEXT NOT NULL DEFAULT '',
  requires_account BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  tagline VARCHAR(60) NOT NULL,
  short_description VARCHAR(260) NOT NULL,
  long_description TEXT NOT NULL,
  category TEXT NOT NULL,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('free', 'freemium', 'paid', 'open_source')),
  tech_stack TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  logo_url TEXT,
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  demo_video_url TEXT,
  founder_name TEXT NOT NULL,
  founder_twitter TEXT,
  founder_linkedin TEXT,
  founder_github TEXT,
  founder_email TEXT NOT NULL,
  launch_goal TEXT NOT NULL CHECK (launch_goal IN ('seo_backlinks', 'first_users', 'feedback', 'all')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'paid', 'in_progress', 'launched')),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PRODUCT_PLATFORMS TABLE (Matching & Tracker)
CREATE TABLE IF NOT EXISTS public.product_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  platform_id UUID REFERENCES public.platforms(id) ON DELETE CASCADE NOT NULL,
  match_score INT NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  match_reason TEXT NOT NULL DEFAULT '',
  generated_copy JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'not started' CHECK (status IN ('not started', 'submitted', 'pending review', 'live', 'rejected')),
  live_url TEXT,
  proof_url TEXT,
  submitted_at TIMESTAMPTZ,
  utm_link TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(product_id, platform_id)
);

-- 5. ORDERS TABLE (Payments)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  plan TEXT NOT NULL CHECK (plan IN ('launch_kit', 'done_for_you', 'growth')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'INR')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'lemonsqueezy')),
  provider_ref TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_product_platforms_product_id ON public.product_platforms(product_id);
CREATE INDEX IF NOT EXISTS idx_product_platforms_platform_id ON public.product_platforms(platform_id);
CREATE INDEX IF NOT EXISTS idx_platforms_slug ON public.platforms(slug);
CREATE INDEX IF NOT EXISTS idx_platforms_active ON public.platforms(active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- PLATFORMS Policies
CREATE POLICY "Anyone can view active platforms"
  ON public.platforms FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Only admins can insert platforms"
  ON public.platforms FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update platforms"
  ON public.platforms FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can delete platforms"
  ON public.platforms FOR DELETE
  USING (public.is_admin());

-- PRODUCTS Policies
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- PRODUCT_PLATFORMS Policies
CREATE POLICY "Users can view their own product platform submissions"
  ON public.product_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_platforms.product_id
      AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users and admins can manage product platforms"
  ON public.product_platforms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_platforms.product_id
      AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ORDERS Policies
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Service or admins can manage orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- AUTH TRIGGER: Automatically create profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STORAGE BUCKETS (Run in Supabase SQL editor or Storage dashboard)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-assets', 'product-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Asset Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-assets');

CREATE POLICY "Authenticated User Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-assets');
