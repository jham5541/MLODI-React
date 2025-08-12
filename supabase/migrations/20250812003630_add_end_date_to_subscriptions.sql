-- Add missing end_date (and ensure related dates) to user_subscriptions
BEGIN;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

COMMIT;
