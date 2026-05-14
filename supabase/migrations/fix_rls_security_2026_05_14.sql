-- ============================================================
-- Migration: fix_rls_security_2026_05_14
-- Fixes Supabase security advisories:
--   - rls_disabled_in_public  (tables with no RLS)
--   - sensitive_columns_exposed (email_subscribers public access)
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Project: ngaisydefault (lxunzzzdnokdqhipbmdf)
-- ============================================================

-- -------------------------------------------------------
-- 1. articles — enable RLS + public read (published only)
-- -------------------------------------------------------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
CREATE POLICY "Public can read published articles"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

-- Service role (admin API) bypasses RLS automatically — no extra policy needed.

-- -------------------------------------------------------
-- 2. email_subscribers — enable RLS, NO public access
--    (service_role bypasses RLS, so admin operations still work)
-- -------------------------------------------------------
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated roles.
-- Only service_role (via API routes) can access this table.

-- -------------------------------------------------------
-- 3. profiles — enable RLS + own-row-only access
-- -------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow new profile creation on signup (trigger inserts via service_role)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

-- -------------------------------------------------------
-- 4. subscriptions — enable RLS + own-row-only access
-- -------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- 5. article_revisions — enable RLS (service_role only)
-- -------------------------------------------------------
ALTER TABLE IF EXISTS public.article_revisions ENABLE ROW LEVEL SECURITY;
-- No public policies — only accessible via service_role API routes.

-- -------------------------------------------------------
-- Verify
-- -------------------------------------------------------
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
