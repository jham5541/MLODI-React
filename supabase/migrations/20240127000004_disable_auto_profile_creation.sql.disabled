-- Alternative approach: Disable automatic profile creation
-- and handle it manually in the application for better control

-- Drop the existing trigger and function completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure the RLS policy allows users to create their own profiles
DROP POLICY IF EXISTS "User profiles can be inserted by the user" ON user_profiles;
CREATE POLICY "User profiles can be inserted by the user" ON user_profiles 
  FOR INSERT WITH CHECK (id = auth.uid());

-- Also ensure users can update their own profiles
DROP POLICY IF EXISTS "User profiles can be updated by the user" ON user_profiles;
CREATE POLICY "User profiles can be updated by the user" ON user_profiles 
  FOR UPDATE USING (id = auth.uid());
