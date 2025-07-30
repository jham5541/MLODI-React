-- Fix immediate database errors for M3lodi app

-- Create product_categories table first (needed by products table)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (referenced in SQL errors but missing in the database)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('song', 'album', 'video', 'merch')) NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    original_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    
    -- Media
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    
    -- Digital media fields
    audio_url TEXT,
    video_url TEXT,
    preview_url TEXT,
    duration_ms INTEGER,
    quality TEXT,
    
    -- Physical product fields
    category_id UUID REFERENCES product_categories(id),
    weight_grams INTEGER,
    dimensions_json JSONB,
    shipping_required BOOLEAN DEFAULT FALSE,
    
    -- Media and display
    cover_url TEXT,
    images JSONB DEFAULT '[]',
    
    -- Metadata
    tags TEXT[],
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

-- Add missing user_id column to artists table (needed for RLS policies)
ALTER TABLE artists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing play_count column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);

-- Add missing product_categories relationship
-- First check if category_id exists, if not add it
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

-- Create the missing tables that are expected by the app
-- These are referenced in the codebase but missing from the database

-- Ensure user_likes table exists
CREATE TABLE IF NOT EXISTS user_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_type TEXT CHECK (liked_type IN ('song', 'album', 'playlist')) NOT NULL,
    liked_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, liked_type, liked_id)
);

-- Ensure play_history table exists
CREATE TABLE IF NOT EXISTS play_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_played_ms INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}'
);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
    
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
    payment_reference TEXT,
    
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

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- Create indexes for carts and orders
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_liked ON user_likes(liked_type, liked_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user_id ON play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_song_id ON play_history(song_id);
CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at DESC);

-- Enable RLS for new tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for products
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = true);

-- Temporarily allow authenticated users to manage products
-- This will be updated once artist-user relationship is established
CREATE POLICY "Authenticated users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS policies for product_categories
CREATE POLICY "Anyone can view active categories" ON product_categories
    FOR SELECT USING (is_active = true);

-- RLS policies for carts
CREATE POLICY "Users can view their own cart" ON carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart" ON carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON carts
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_likes
CREATE POLICY "Users can view all likes" ON user_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON user_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON user_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for play_history
CREATE POLICY "Users can view their own play history" ON play_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own play history" ON play_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create product_variants table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create polls table if it doesn't exist
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('music', 'artist', 'genre', 'general')) DEFAULT 'general',
    poll_type TEXT CHECK (poll_type IN ('multiple_choice', 'single_choice', 'rating')) DEFAULT 'single_choice',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_votes INTEGER DEFAULT 0,
    max_votes_per_user INTEGER DEFAULT 1,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, position)
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_featured ON polls(is_featured);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

-- Enable RLS for new tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variants
CREATE POLICY "Anyone can view active product variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- RLS policies for polls
CREATE POLICY "Anyone can view active polls" ON polls
    FOR SELECT USING (is_active = true);

-- RLS policies for poll_options
CREATE POLICY "Anyone can view poll options" ON poll_options
    FOR SELECT USING (true);

-- Ensure foreign key constraints are properly set
DO $$
BEGIN
    -- Check and add foreign key for product_variants if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'product_variants' 
        AND constraint_name = 'product_variants_product_id_fkey'
    ) THEN
        ALTER TABLE product_variants 
        ADD CONSTRAINT product_variants_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for poll_options if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'poll_options' 
        AND constraint_name = 'poll_options_poll_id_fkey'
    ) THEN
        ALTER TABLE poll_options 
        ADD CONSTRAINT poll_options_poll_id_fkey 
        FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE;
    END IF;
END $$;
