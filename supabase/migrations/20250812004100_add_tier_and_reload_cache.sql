-- Add tier column and force PostgREST schema cache reload
BEGIN;

-- Add the missing tier column
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS tier TEXT;

-- Force PostgREST to reload its schema cache by sending NOTIFY
NOTIFY pgrst, 'reload schema';

COMMIT;
