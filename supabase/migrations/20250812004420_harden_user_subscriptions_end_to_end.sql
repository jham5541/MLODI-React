-- 20250812004420_harden_user_subscriptions_end_to_end.sql
-- Purpose: Make user_subscriptions robust for all client shapes and provide a single RPC to confirm subscriptions.

BEGIN;

-- 1) Ensure table exists with all columns that the app or legacy code may reference
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- artist fields (nullable to avoid insert errors from partial clients)
  artist_id UUID,
  artist_name TEXT,
  -- plan/tiers
  plan_id UUID,
  plan_code TEXT,
  tier TEXT,
  -- lifecycle
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  -- billing
  price NUMERIC(12,2) DEFAULT 9.99,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('apple_pay','web3_wallet','credit_card')),
  auto_renew BOOLEAN DEFAULT true,
  renewal_date TIMESTAMPTZ,
  benefits JSONB,
  -- audit
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Add missing columns if this table already existed with a different shape
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS artist_id UUID,
  ADD COLUMN IF NOT EXISTS artist_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS plan_code TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 9.99,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefits JSONB;

-- Ensure valid check on payment_method
DO $$
BEGIN
  -- Drop and recreate constraint to ensure it exists with correct definition
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='user_subscriptions' AND constraint_name='user_subscriptions_payment_method_check'
  ) THEN
    ALTER TABLE public.user_subscriptions DROP CONSTRAINT user_subscriptions_payment_method_check;
  END IF;
  ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_payment_method_check
    CHECK (payment_method IS NULL OR payment_method IN ('apple_pay','web3_wallet','credit_card'));
END$$;

-- 2) Make inserts resilient: provide defaults for period fields
-- Set expires_at and renewal_date defaults if not set (server-side default)
DO $$
BEGIN
  -- If expires_at has no default, set one
  PERFORM 1 FROM pg_attrdef d
   JOIN pg_class c ON c.oid = d.adrelid
   JOIN pg_namespace n ON n.oid = c.relnamespace
   JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
  WHERE n.nspname='public' AND c.relname='user_subscriptions' AND a.attname='expires_at';
  -- Use ALTER COLUMN ... SET DEFAULT unconditionally; it's idempotent for our purpose
  ALTER TABLE public.user_subscriptions ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');
  ALTER TABLE public.user_subscriptions ALTER COLUMN renewal_date SET DEFAULT (now() + interval '30 days');
END$$;

-- 3) Indexes commonly used
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_artist_id ON public.user_subscriptions(artist_id);

-- 4) RLS: ensure enabled and appropriate policies exist
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can select their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can insert their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can update their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can delete their subscriptions" ON public.user_subscriptions;
END $$;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.user_subscriptions TO anon;

-- 5) RPC to confirm subscription robustly with minimal inputs
-- This function will upsert a user's active subscription for an artist/plan, filling defaults safely.
CREATE OR REPLACE FUNCTION public.confirm_user_subscription(
  p_artist_id UUID DEFAULT NULL,
  p_artist_name TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT 9.99,
  p_payment_method TEXT DEFAULT NULL,
  p_plan_code TEXT DEFAULT NULL,
  p_plan_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Upsert active subscription for this artist/plan; if none provided, create a generic one
  INSERT INTO public.user_subscriptions (
    user_id,
    artist_id,
    artist_name,
    price,
    payment_method,
    plan_code,
    plan_id,
    tier,
    status,
    start_date,
    end_date,
    current_period_end,
    expires_at,
    renewal_date,
    auto_renew,
    benefits
  ) VALUES (
    v_user_id,
    p_artist_id,
    p_artist_name,
    COALESCE(p_price, 9.99),
    p_payment_method,
    p_plan_code,
    p_plan_id,
    p_tier,
    'active',
    now(),
    now() + interval '30 days',
    now() + interval '30 days',
    now() + interval '30 days',
    now() + interval '30 days',
    true,
    COALESCE('["Unlimited access to all content","Early access to new releases","Exclusive behind-the-scenes content","Direct messaging with artist","No gamification limitations","Priority comment responses","Exclusive live streams"]'::jsonb, '{}'::jsonb)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET
      artist_id = COALESCE(EXCLUDED.artist_id, public.user_subscriptions.artist_id),
      artist_name = COALESCE(EXCLUDED.artist_name, public.user_subscriptions.artist_name),
      price = COALESCE(EXCLUDED.price, public.user_subscriptions.price),
      payment_method = COALESCE(EXCLUDED.payment_method, public.user_subscriptions.payment_method),
      plan_code = COALESCE(EXCLUDED.plan_code, public.user_subscriptions.plan_code),
      plan_id = COALESCE(EXCLUDED.plan_id, public.user_subscriptions.plan_id),
      tier = COALESCE(EXCLUDED.tier, public.user_subscriptions.tier),
      status = 'active',
      start_date = COALESCE(public.user_subscriptions.start_date, now()),
      end_date = now() + interval '30 days',
      current_period_end = now() + interval '30 days',
      expires_at = now() + interval '30 days',
      renewal_date = now() + interval '30 days',
      auto_renew = true,
      updated_at = timezone('utc', now())
  WHERE public.user_subscriptions.user_id = v_user_id
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_user_subscription(UUID, TEXT, NUMERIC, TEXT, TEXT, UUID, TEXT) TO authenticated;

-- 6) Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

COMMIT;
