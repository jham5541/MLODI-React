-- Fix user signup issues by ensuring proper RLS policies and profile creation

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a more robust profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    username,
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating user profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "User profiles can be inserted by the user" ON user_profiles;
DROP POLICY IF EXISTS "User profiles can be updated by the user" ON user_profiles;

-- Create comprehensive RLS policies
-- Allow users to view all profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role'
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO service_role;

-- Ensure the auth schema trigger can access public schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create any missing profiles for existing users
INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', email),
  COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'username', split_part(email, '@', 1)),
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Add anomaly_reports table for ML fraud detection
CREATE TABLE IF NOT EXISTS anomaly_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    anomalies JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for anomaly reports
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_user_id ON anomaly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_track_id ON anomaly_reports(track_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_created_at ON anomaly_reports(created_at DESC);

-- Enable RLS for anomaly_reports
ALTER TABLE anomaly_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anomaly_reports
CREATE POLICY "Users can view their own anomaly reports" ON anomaly_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert anomaly reports" ON anomaly_reports
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON anomaly_reports TO authenticated;
GRANT ALL ON anomaly_reports TO service_role;
