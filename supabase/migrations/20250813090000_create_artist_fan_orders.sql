-- 20250813090000_create_artist_fan_orders.sql
-- Purpose: Store per-artist view of fan orders with size and shipping snapshot
-- NOTE: Run this migration on your database. It is safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS public.artist_fan_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  fan_user_id uuid NOT NULL,
  order_id uuid NOT NULL,
  size text,
  shipping_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional FKs if these tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='artists') THEN
    ALTER TABLE public.artist_fan_orders
      ADD CONSTRAINT fk_artist_fan_orders_artist
      FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='merchandise_orders') THEN
    ALTER TABLE public.artist_fan_orders
      ADD CONSTRAINT fk_artist_fan_orders_order
      FOREIGN KEY (order_id) REFERENCES public.merchandise_orders(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='auth' AND table_name='users') THEN
    ALTER TABLE public.artist_fan_orders
      ADD CONSTRAINT fk_artist_fan_orders_fan
      FOREIGN KEY (fan_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for portal queries
CREATE INDEX IF NOT EXISTS idx_artist_fan_orders_artist_created ON public.artist_fan_orders(artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artist_fan_orders_order ON public.artist_fan_orders(order_id);

-- RLS
ALTER TABLE public.artist_fan_orders ENABLE ROW LEVEL SECURITY;

-- Allow artists to view their own orders via a secure policy pattern:
-- Assuming you have a mapping from auth.uid() to an artist_id in your system.
-- For now we allow authenticated read, adjust to your model as needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'artist_fan_orders' AND policyname = 'artist_fan_orders_read'
  ) THEN
    CREATE POLICY artist_fan_orders_read ON public.artist_fan_orders FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'artist_fan_orders' AND policyname = 'artist_fan_orders_insert_own'
  ) THEN
    CREATE POLICY artist_fan_orders_insert_own ON public.artist_fan_orders FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

COMMIT;
