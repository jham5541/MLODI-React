-- Create marketplace tables for M3lodi
-- This migration adds e-commerce functionality to the existing music platform

-- Product categories table
CREATE TABLE product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (unified table for all product types)
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('song', 'album', 'video', 'merch')) NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    original_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    
    -- Media references (for digital products)
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    
    -- Digital media fields
    audio_url TEXT,
    video_url TEXT,
    preview_url TEXT,
    duration_ms INTEGER,
    quality TEXT, -- HD, FHD, 4K for videos
    
    -- Physical product fields
    category_id UUID REFERENCES product_categories(id),
    weight_grams INTEGER,
    dimensions_json JSONB, -- {length, width, height}
    shipping_required BOOLEAN DEFAULT FALSE,
    
    -- Media and display
    cover_url TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    genre TEXT,
    explicit BOOLEAN DEFAULT FALSE,
    
    -- Inventory and status
    stock_quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    
    -- SEO and organization
    slug TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (for merch with different sizes, colors, etc.)
CREATE TABLE product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}', -- {size: "L", color: "Red"}
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping carts
CREATE TABLE carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest carts
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One cart per user
);

-- Cart items
CREATE TABLE cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL, -- Price at time of adding to cart
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_id, product_id, variant_id)
);

-- Orders
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    
    -- Status
    status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
    
    -- Addresses
    billing_address JSONB,
    shipping_address JSONB,
    
    -- Payment
    payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay')),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    payment_reference TEXT, -- External payment ID
    
    -- Shipping
    shipping_method TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Product snapshot at time of purchase
    product_title TEXT NOT NULL,
    product_type TEXT NOT NULL,
    variant_name TEXT,
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Digital delivery
    download_url TEXT, -- For digital products
    download_expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User library (owned digital items)
CREATE TABLE user_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Access details
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    download_url TEXT,
    download_expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    
    UNIQUE(user_id, product_id)
);

-- Wishlist
CREATE TABLE wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Product reviews
CREATE TABLE product_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_artist_id ON products(artist_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_sale ON products(is_on_sale);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_user_library_user_id ON user_library(user_id);
CREATE INDEX idx_user_library_product_id ON user_library(product_id);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_number TEXT;
BEGIN
    -- Generate order number like M3L-240125-001
    SELECT 'M3L-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
           LPAD((COUNT(*) + 1)::TEXT, 3, '0')
    INTO order_number
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set order number on insert
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Function to update cart totals (can be called from application or triggers)
CREATE OR REPLACE FUNCTION update_cart_totals(cart_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- This function can be extended to calculate and store cart totals
    -- For now, we'll calculate totals in the application
    UPDATE carts SET updated_at = NOW() WHERE id = cart_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to add item to user library after purchase
CREATE OR REPLACE FUNCTION add_to_user_library()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add digital products to library when order is paid
    IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
        INSERT INTO user_library (user_id, product_id, order_id, purchased_at)
        SELECT 
            NEW.user_id,
            oi.product_id,
            NEW.id,
            NEW.updated_at
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = NEW.id 
        AND p.type IN ('song', 'album', 'video')
        ON CONFLICT (user_id, product_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add digital items to user library
CREATE TRIGGER add_to_user_library_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION add_to_user_library();