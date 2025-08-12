-- 20250811230000_fix_missing_functions_and_tables.sql
-- Purpose: Create calculate_trending_artists function, user_library table/relationships,
-- and ensure user_subscriptions exists with required columns referenced by the app.

BEGIN;

-- 1) calculate_trending_artists RPC used by TrendingArtistService
CREATE OR REPLACE FUNCTION public.calculate_trending_artists(limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    score DOUBLE PRECISION,
    name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        (
          COALESCE(a.monthly_listeners, 0) * 0.6 +
          COALESCE(a.followers_count, 0) * 0.3 +
          COALESCE(s.recent_play_count, 0) * 0.1
        )::DOUBLE PRECISION AS score,
        COALESCE(a.name, 'Unknown Artist') AS name
    FROM public.artists a
    LEFT JOIN (
      SELECT s.artist_id, COUNT(*) AS recent_play_count
      FROM public.play_history ph
      JOIN public.songs s ON s.id = ph.song_id
      WHERE ph.played_at >= NOW() - INTERVAL '30 days'
      GROUP BY s.artist_id
    ) s ON s.artist_id = a.id
    WHERE a.id IS NOT NULL
    ORDER BY score DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2) user_library with relationships to products and orders
CREATE TABLE IF NOT EXISTS public.user_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    purchased_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their library" ON public.user_library;
    DROP POLICY IF EXISTS "Users can manage their library" ON public.user_library;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Users can view their library"
    ON public.user_library FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their library"
    ON public.user_library FOR ALL
    USING (auth.uid() = user_id);

-- 3) Ensure user_subscriptions table exists with necessary columns
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Add missing columns if they don't exist
ALTER TABLE public.user_subscriptions
    ADD COLUMN IF NOT EXISTS plan_id UUID,
    ADD COLUMN IF NOT EXISTS tier TEXT,
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their subscriptions" ON public.user_subscriptions;
  DROP POLICY IF EXISTS "Users can manage their subscriptions" ON public.user_subscriptions;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE POLICY "Users can view their subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant privileges to authenticated role (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_library TO authenticated;

COMMIT;

