-- Create or update RLS policies for marketplace tables
BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

-- Ensure RLS is enabled
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Enable full access for authenticated users"
    ON public.carts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Cart items policies
CREATE POLICY "Enable full access for cart owners"
    ON public.cart_items
    FOR ALL
    TO authenticated
    USING (
        cart_id IN (
            SELECT id FROM public.carts 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        cart_id IN (
            SELECT id FROM public.carts 
            WHERE user_id = auth.uid()
        )
    );

-- Order policies
CREATE POLICY "Enable read access for order owners"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users"
    ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Enable read access for order owners"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for order owners"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE user_id = auth.uid()
        )
    );

-- Grant necessary privileges
GRANT ALL ON public.carts TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;

COMMIT;
