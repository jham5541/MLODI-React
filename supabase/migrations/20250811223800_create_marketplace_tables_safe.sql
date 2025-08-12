-- Create marketplace tables with IF NOT EXISTS to handle idempotency
BEGIN;

-- Create cart-related tables
CREATE TABLE IF NOT EXISTS public.carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text, -- For guest carts
    currency text DEFAULT 'USD',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id) -- One cart per user
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    price numeric(12,2) NOT NULL,
    added_at timestamptz DEFAULT now()
);

-- Create product-related tables if missing
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    type text,
    artist_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    price numeric(12,2) NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    cover_url text,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    name text NOT NULL,
    price numeric(12,2),
    stock_quantity integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create order-related tables
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number text,
    subtotal numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    shipping_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) DEFAULT 0,
    currency text DEFAULT 'USD',
    status text DEFAULT 'pending',
    payment_method text,
    payment_status text DEFAULT 'pending',
    payment_reference text,
    billing_address jsonb,
    shipping_address jsonb,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_title text,
    product_type text,
    variant_name text,
    unit_price numeric(12,2),
    quantity integer DEFAULT 1,
    total_price numeric(12,2),
    created_at timestamptz DEFAULT now()
);

-- Create indexes (IF NOT EXISTS is not supported for indexes, so we use a DO block)
DO $$
BEGIN
    -- Cart indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_carts_user_id') THEN
        CREATE INDEX idx_carts_user_id ON public.carts(user_id);
    END IF;

    -- Cart items indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cart_items_cart_id') THEN
        CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_cart_items_cart_product_variant') THEN
        CREATE UNIQUE INDEX uq_cart_items_cart_product_variant
            ON public.cart_items (cart_id, product_id, coalesce(variant_id::text, 'null'));
    END IF;

    -- Order indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_id') THEN
        CREATE INDEX idx_orders_user_id ON public.orders(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
        CREATE INDEX idx_orders_status ON public.orders(status);
    END IF;

    -- Order items indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_order_id') THEN
        CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_items_product_id') THEN
        CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
    END IF;
END$$;

-- Enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

-- Create RLS policies
CREATE POLICY "Users can view their own cart"
    ON public.carts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart"
    ON public.carts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cart items"
    ON public.cart_items FOR SELECT
    USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own cart items"
    ON public.cart_items FOR ALL
    USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()))
    WITH CHECK (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items"
    ON public.order_items FOR SELECT
    USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Grant table privileges to authenticated users (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

COMMIT;
