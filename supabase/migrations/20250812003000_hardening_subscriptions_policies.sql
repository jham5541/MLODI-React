-- 20250812003000_hardening_subscriptions_policies.sql
-- Purpose: Definitively fix permissions and RLS for user_subscriptions.

BEGIN;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  current_period_end timestamptz,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Ensure essential columns exist
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255);

-- Enable RLS (idempotent)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Recreate policies idempotently
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subscriptions' AND policyname='Users can view their subscriptions'
  ) THEN
    DROP POLICY "Users can view their subscriptions" ON public.user_subscriptions;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subscriptions' AND policyname='Users can manage their subscriptions'
  ) THEN
    DROP POLICY "Users can manage their subscriptions" ON public.user_subscriptions;
  END IF;
END$$;

CREATE POLICY "Users can view their subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Definitive grants for authenticated role (RLS still restricts rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;

COMMIT;

