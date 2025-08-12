-- Drop existing tables and views if they exist
DROP VIEW IF EXISTS public.user_profiles;
DROP TABLE IF EXISTS public.user_wallets;
DROP TABLE IF EXISTS public.users_metadata;

-- Create the base metadata table
CREATE TABLE IF NOT EXISTS public.users_metadata (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    subscription_expires_at TIMESTAMPTZ,
    total_listening_time_ms BIGINT DEFAULT 0,
    wallet_address TEXT,
    wallet_type TEXT DEFAULT 'web3auth',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on metadata table
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for metadata
CREATE POLICY "Users can view their own metadata"
    ON public.users_metadata FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own metadata"
    ON public.users_metadata FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own metadata"
    ON public.users_metadata FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_metadata_username ON public.users_metadata(username);
CREATE INDEX IF NOT EXISTS idx_users_metadata_wallet ON public.users_metadata(wallet_address);

-- Create the consolidated view
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    au.id,
    au.email,
    au.phone,
    au.confirmed_at,
    au.last_sign_in_at,
    au.raw_app_meta_data,
    au.raw_user_meta_data,
    au.created_at as account_created_at,
    au.updated_at as account_updated_at,
    um.username,
    um.display_name,
    um.bio,
    um.avatar_url,
    um.cover_url,
    um.location,
    um.website_url,
    um.social_links,
    um.preferences,
    um.subscription_tier,
    um.subscription_expires_at,
    um.total_listening_time_ms,
    um.wallet_address,
    um.wallet_type,
    um.created_at as profile_created_at,
    um.updated_at as profile_updated_at
FROM 
    auth.users au
LEFT JOIN public.users_metadata um ON au.id = um.id;

-- Grant permissions on the view
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

-- Create automatic user metadata creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_metadata (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_users_metadata_updated_at
    BEFORE UPDATE ON public.users_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
