-- Add missing status and plan_id columns to user_subscriptions
BEGIN;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_id UUID;

COMMIT;
