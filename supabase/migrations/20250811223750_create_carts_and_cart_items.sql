-- 20250811223750_create_carts_and_cart_items.sql
-- Purpose: Ensure marketplace cart tables exist and extend orders to match checkout usage

BEGIN;

-- Create carts table if missing
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts(user_id);

-- Create cart_items table if missing
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL,
  added_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_cart_product_variant
  ON public.cart_items (cart_id, product_id, coalesce(variant_id::text, 'null'));
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- Ensure orders table has columns expected by checkout function
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS billing_address jsonb,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS shipping_method text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure order_items exists and has expected columns
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_title text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS variant_name text,
  ADD COLUMN IF NOT EXISTS unit_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS download_url text,
  ADD COLUMN IF NOT EXISTS download_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_downloads integer DEFAULT 5;

COMMIT;
