-- Fix user_subscriptions permissions completely
BEGIN;

-- 1. Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. First, remove any existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Users can view their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can manage their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can read their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can create their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can update their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can delete their subscriptions" ON public.user_subscriptions;
END$$;

-- 3. Create granular policies for each operation
CREATE POLICY "Users can select their subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their subscriptions"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their subscriptions"
  ON public.user_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Revoke all existing privileges to start clean
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON public.user_subscriptions FROM anon, authenticated';
  EXECUTE 'REVOKE ALL ON public.user_subscriptions FROM public';
EXCEPTION WHEN others THEN null;
END$$;

-- 5. Grant explicit privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.user_subscriptions TO anon;

-- 6. Ensure sequence permissions if needed
DO $$
BEGIN
  EXECUTE 'GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated';
EXCEPTION WHEN others THEN null;
END$$;

-- 7. Add default RLS bypass for service role if needed
CREATE POLICY "Service role bypass"
  ON public.user_subscriptions
  FOR ALL
  TO service_role
  USING (true);

COMMIT;
