-- Enable RLS for marketplace tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Product Categories Policies (Public Read)
CREATE POLICY "Product categories are viewable by everyone" ON product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage product categories" ON product_categories
    FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Products Policies
CREATE POLICY "Active products are viewable by everyone" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Artists can manage their own products" ON products
    FOR ALL USING (
        artist_id IN (
            SELECT id FROM artists 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address'
        )
    );

CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Product Variants Policies
CREATE POLICY "Product variants are viewable by everyone" ON product_variants
    FOR SELECT USING (
        is_active = true AND 
        product_id IN (SELECT id FROM products WHERE is_active = true)
    );

CREATE POLICY "Artists can manage their product variants" ON product_variants
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN artists a ON a.id = p.artist_id
            WHERE a.wallet_address = auth.jwt() ->> 'wallet_address'
        )
    );

CREATE POLICY "Admins can manage all product variants" ON product_variants
    FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Cart Policies (Users can only access their own cart)
CREATE POLICY "Users can view their own cart" ON carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart" ON carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON carts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart" ON carts
    FOR DELETE USING (auth.uid() = user_id);

-- Cart Items Policies
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (
        cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can add items to their own cart" ON cart_items
    FOR INSERT WITH CHECK (
        cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own cart items" ON cart_items
    FOR UPDATE USING (
        cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own cart items" ON cart_items
    FOR DELETE USING (
        cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    );

-- Orders Policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders" ON orders
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status IN ('pending', 'processing')
    );

CREATE POLICY "Artists can view orders containing their products" ON orders
    FOR SELECT USING (
        id IN (
            SELECT DISTINCT oi.order_id 
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN artists a ON a.id = p.artist_id
            WHERE a.wallet_address = auth.jwt() ->> 'wallet_address'
        )
    );

CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Order Items Policies
CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create order items for their orders" ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    );

CREATE POLICY "Artists can view order items for their products" ON order_items
    FOR SELECT USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN artists a ON a.id = p.artist_id
            WHERE a.wallet_address = auth.jwt() ->> 'wallet_address'
        )
    );

CREATE POLICY "Admins can manage all order items" ON order_items
    FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- User Library Policies
CREATE POLICY "Users can view their own library" ON user_library
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can add to user library" ON user_library
    FOR INSERT WITH CHECK (true); -- Controlled by triggers

CREATE POLICY "Users can update their own library access" ON user_library
    FOR UPDATE USING (auth.uid() = user_id);

-- Wishlist Policies
CREATE POLICY "Users can manage their own wishlist" ON wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Product Reviews Policies
CREATE POLICY "Everyone can view reviews" ON product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON product_reviews
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON product_reviews
    FOR ALL USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');