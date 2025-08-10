-- Direct SQL to create missing tables for M3lodi app
-- Run this directly in Supabase SQL Editor

-- Create users table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    profile_picture TEXT,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create engagements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    artist_id UUID NOT NULL,
    engagement_type TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT,
    song_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fan_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.fan_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    artist_id UUID NOT NULL,
    total_score INTEGER DEFAULT 0,
    streaming_points INTEGER DEFAULT 0,
    purchase_points INTEGER DEFAULT 0,
    social_points INTEGER DEFAULT 0,
    video_points INTEGER DEFAULT 0,
    event_points INTEGER DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    fan_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, artist_id)
);

-- Create orders table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    shipping_address JSONB,
    billing_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create carts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'active',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Add essential indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_engagements_user_id ON public.engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_artist_id ON public.engagements(artist_id);
CREATE INDEX IF NOT EXISTS idx_fan_scores_user_id ON public.fan_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_scores_artist_id ON public.fan_scores(artist_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- Enable RLS and create basic policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.fan_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Create simple policies for authenticated users
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.engagements FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.fan_scores FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.carts FOR SELECT USING (true);

-- Grant permissions  
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.engagements TO authenticated;
GRANT ALL ON public.fan_scores TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.carts TO authenticated;
