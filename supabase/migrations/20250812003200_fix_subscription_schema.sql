-- Fix user_subscriptions schema to match app requirements
BEGIN;

-- 1. Drop and recreate user_subscriptions with correct schema
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL,           -- Required field per app error
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    
    -- Additional columns
    plan_id UUID,
    tier TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    transaction_hash VARCHAR(255)
);

-- 2. Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- 3. Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
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

-- 5. Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.user_subscriptions TO anon;

-- 6. Add service role policy
CREATE POLICY "Service role bypass"
  ON public.user_subscriptions
  FOR ALL
  TO service_role
  USING (true);

COMMIT;
