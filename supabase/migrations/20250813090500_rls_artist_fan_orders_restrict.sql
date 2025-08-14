-- 20250813090500_rls_artist_fan_orders_restrict.sql
-- Purpose: Tighten RLS so only the corresponding artist (by auth.uid()) can view their own artist_fan_orders
-- Strategy: Create a stable helper function that checks mapping auth.uid() -> artist via artists.user_id if present,
-- then update the SELECT policy to call this function.

BEGIN;

-- Helper: check if current auth user is the owner of the given artist_id
CREATE OR REPLACE FUNCTION public.current_user_is_artist(p_artist_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  has_user_id boolean;
  allowed boolean := false;
BEGIN
  -- Verify the artists table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='artists'
  ) THEN
    RETURN false;
  END IF;

  -- Check if artists.user_id exists in this environment
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='artists' AND column_name='user_id'
  ) INTO has_user_id;

  IF has_user_id THEN
    SELECT EXISTS (
      SELECT 1 FROM public.artists a
       WHERE a.id = p_artist_id AND a.user_id = auth.uid()
    ) INTO allowed;
  ELSE
    -- If there is no user_id column, deny by default.
    allowed := false;
  END IF;

  RETURN allowed;
END
$$;

-- Enable RLS (if not already)
ALTER TABLE public.artist_fan_orders ENABLE ROW LEVEL SECURITY;

-- Replace the broad read policy with a strict one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='artist_fan_orders' AND policyname='artist_fan_orders_read'
  ) THEN
    DROP POLICY artist_fan_orders_read ON public.artist_fan_orders;
  END IF;

  CREATE POLICY artist_fan_orders_read
    ON public.artist_fan_orders
    FOR SELECT
    TO authenticated
    USING (public.current_user_is_artist(artist_id));
END $$;

COMMIT;

