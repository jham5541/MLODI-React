-- Fix the user creation trigger to handle profile creation more robustly
-- This addresses the "Database error saving new user" issue

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile if one doesn't already exist
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (
    new.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error creating user profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure RLS policies allow profile creation
-- Update the INSERT policy to be more permissive for new users
DROP POLICY IF EXISTS "User profiles can be inserted by the user" ON user_profiles;
CREATE POLICY "User profiles can be inserted by the user" ON user_profiles 
  FOR INSERT WITH CHECK (
    id = auth.uid() OR 
    auth.role() = 'service_role'
  );
