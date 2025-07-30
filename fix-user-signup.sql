-- Fix User Signup Issues for M3lodi Mobile
-- Run this script in your Supabase SQL Editor

-- 1. First, ensure we have the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    location TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    total_listening_time_ms BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "User profiles can be inserted by the user" ON user_profiles;
DROP POLICY IF EXISTS "User profiles can be updated by the user" ON user_profiles;

-- 5. Create comprehensive RLS policies
-- Allow anyone to view profiles
CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Enable insert for authenticated users only" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Enable delete for users based on id" ON user_profiles
    FOR DELETE USING (auth.uid() = id);

-- 6. Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 8. Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT SELECT ON public.user_profiles TO anon;

-- 10. Create any missing tables for the app
-- Artists table
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    genres TEXT[] DEFAULT '{}',
    followers_count INTEGER DEFAULT 0,
    monthly_listeners INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    wallet_address TEXT,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 100.00,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID,
    audio_url TEXT,
    cover_url TEXT,
    duration INTEGER DEFAULT 0,
    genre TEXT,
    mood TEXT,
    tempo INTEGER,
    key_signature TEXT,
    lyrics TEXT,
    is_explicit BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    nft_token_address TEXT,
    nft_total_supply INTEGER DEFAULT 0,
    nft_available_supply INTEGER DEFAULT 0,
    nft_price DECIMAL(10,2) DEFAULT 0,
    nft_royalty_percentage DECIMAL(5,2) DEFAULT 10.00,
    metadata JSONB DEFAULT '{}',
    waveform_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly reports table for ML fraud detection
CREATE TABLE IF NOT EXISTS public.anomaly_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    anomalies JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for anomaly_reports
ALTER TABLE public.anomaly_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anomaly_reports
CREATE POLICY "Users can view their own anomaly reports" ON anomaly_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert anomaly reports" ON anomaly_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_user_id ON anomaly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_track_id ON anomaly_reports(track_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_created_at ON anomaly_reports(created_at DESC);

-- 12. Create profiles for any existing users who don't have one
INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', email),
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 13. Verify the setup
SELECT 'Setup completed successfully!' as message;
