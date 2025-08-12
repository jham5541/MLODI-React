-- Align user_subscriptions schema with app model
BEGIN;

-- 1. Drop existing table and recreate with aligned schema
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    artist_name TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 9.99,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('apple_pay', 'web3_wallet', 'credit_card')),
    renewal_date TIMESTAMPTZ,
    benefits JSONB DEFAULT '["Unlimited access to all content", "Early access to new releases", "Exclusive behind-the-scenes content", "Direct messaging with artist", "No gamification limitations", "Priority comment responses", "Exclusive live streams"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 2. Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_artist_id ON public.user_subscriptions(artist_id);
CREATE UNIQUE INDEX uq_user_subscriptions_user_artist ON public.user_subscriptions(user_id, artist_id) 
  WHERE is_active = true;

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

-- 6. Create subscription management functions
CREATE OR REPLACE FUNCTION public.subscribe_to_artist(
  p_artist_id UUID,
  p_artist_name TEXT,
  p_price NUMERIC,
  p_payment_method TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Calculate expiration (30 days from now)
  INSERT INTO public.user_subscriptions (
    user_id,
    artist_id,
    artist_name,
    price,
    expires_at,
    renewal_date,
    payment_method
  ) VALUES (
    v_user_id,
    p_artist_id,
    p_artist_name,
    p_price,
    now() + interval '30 days',
    now() + interval '30 days',
    p_payment_method
  ) RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$;

-- 7. Grant execute on functions
GRANT EXECUTE ON FUNCTION public.subscribe_to_artist TO authenticated;

COMMIT;
