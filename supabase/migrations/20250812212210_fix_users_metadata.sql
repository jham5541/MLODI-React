-- Ensure the users_metadata table exists with expected columns
CREATE TABLE IF NOT EXISTS public.users_metadata (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  location text,
  website_url text,
  social_links jsonb DEFAULT '{}'::jsonb NOT NULL,
  preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
  subscription_tier text DEFAULT 'free' NOT NULL,
  subscription_expires_at timestamptz,
  total_listening_time_ms bigint DEFAULT 0 NOT NULL,
  wallet_address text,
  wallet_type text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add missing columns used by the app (if they don't exist)
ALTER TABLE public.users_metadata
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'profile';

-- Unique username (create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'users_metadata_username_key'
  ) THEN
    CREATE UNIQUE INDEX users_metadata_username_key ON public.users_metadata (username);
  END IF;
END $$;

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_users_metadata_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_metadata_updated_at ON public.users_metadata;
CREATE TRIGGER trg_users_metadata_updated_at
BEFORE UPDATE ON public.users_metadata
FOR EACH ROW EXECUTE FUNCTION public.set_users_metadata_updated_at();

-- Create or replace a convenient view user_profiles used by the app
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  au.id,
  au.email,
  au.phone,
  au.confirmed_at,
  au.last_sign_in_at,
  au.raw_app_meta_data,
  au.raw_user_meta_data,
  au.created_at AS account_created_at,
  au.updated_at AS account_updated_at,
  um.username,
  um.display_name,
  um.bio,
  um.avatar_url,
  um.cover_url,
  um.location,
  um.website_url,
  um.social_links,
  um.preferences,
  um.subscription_tier,
  um.subscription_expires_at,
  um.total_listening_time_ms,
  um.wallet_address,
  um.wallet_type,
  um.created_at AS profile_created_at,
  um.updated_at AS profile_updated_at,
  um.onboarding_completed,
  um.onboarding_step
FROM auth.users au
LEFT JOIN users_metadata um ON au.id = um.id;

-- Grant read to authenticated
GRANT SELECT ON public.user_profiles TO authenticated;
