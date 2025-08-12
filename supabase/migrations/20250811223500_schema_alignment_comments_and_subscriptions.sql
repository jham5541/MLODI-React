-- 20250811223500_schema_alignment_comments_and_subscriptions.sql
-- Purpose: Align DB schema with app expectations for comments and subscriptions

BEGIN;

-- Ensure enums exist
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'fan', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure subscription_plans table exists
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tier subscription_tier NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    price_eth DECIMAL(18,8) NOT NULL,
    duration INTEGER NOT NULL, -- days
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Seed default plans if missing
INSERT INTO public.subscription_plans (id, name, tier, price_usd, price_eth, duration, features, is_active, is_popular)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Free', 'free', 0.00, 0.00, 365,
     '["Access to basic music library", "30-second previews", "Standard audio quality", "Basic playlists", "Community features"]'::jsonb,
     TRUE, FALSE),
    ('00000000-0000-0000-0000-000000000002', 'Fan', 'fan', 9.99, 0.005, 30,
     '["Full song access", "High-quality audio streaming", "Unlimited playlists", "Download for offline listening", "Early access to new releases", "Artist exclusive content", "Ad-free experience"]'::jsonb,
     TRUE, TRUE),
    ('00000000-0000-0000-0000-000000000003', 'Enterprise', 'enterprise', 29.99, 0.015, 30,
     '["Everything in Fan tier", "Lossless audio quality", "Advanced analytics", "Priority customer support", "Multiple device streaming", "Commercial usage rights", "Beta feature access", "Direct artist communication"]'::jsonb,
     TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Expand public.user_subscriptions to match app expectations
ALTER TABLE public.user_subscriptions
    ADD COLUMN IF NOT EXISTS plan_id UUID,
    ADD COLUMN IF NOT EXISTS tier subscription_tier,
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Ensure status uses enum if possible
DO $$ BEGIN
    ALTER TABLE public.user_subscriptions
    ALTER COLUMN status TYPE subscription_status USING status::subscription_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add foreign key from plan_id to subscription_plans
DO $$ BEGIN
    ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT fk_user_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Add subscription_tier to profiles so UI can reflect current tier
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free';

-- Align comments schema
-- 1) Ensure user_id references public.profiles(id)
DO $$ DECLARE
    cons_name text;
BEGIN
    -- Drop any existing constraint named fk_track_comments_user if it points elsewhere
    SELECT tc.constraint_name INTO cons_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public' AND tc.table_name = 'track_comments'
      AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id';

    IF cons_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.track_comments DROP CONSTRAINT %I', cons_name);
    END IF;
EXCEPTION WHEN others THEN NULL; END $$;

ALTER TABLE public.track_comments
    ADD CONSTRAINT fk_track_comments_user
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2) Add parent_id for threaded comments
ALTER TABLE public.track_comments
    ADD COLUMN IF NOT EXISTS parent_id UUID;

DO $$ BEGIN
    ALTER TABLE public.track_comments
    ADD CONSTRAINT fk_track_comments_parent
    FOREIGN KEY (parent_id) REFERENCES public.track_comments(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_track_comments_parent ON public.track_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_user ON public.track_comments(user_id);

-- 3) Create comment_likes table used by the app if missing
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.track_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (comment_id, user_id)
);

COMMIT;
