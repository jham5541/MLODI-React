-- Relax NOT NULL on artist_id to avoid insert failures when client omits it
BEGIN;

ALTER TABLE public.user_subscriptions
  ALTER COLUMN artist_id DROP NOT NULL;

COMMIT;
