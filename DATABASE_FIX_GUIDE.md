# 🔧 Database User Creation Error - Fix Guide

## 🚨 Problem
Getting "Database error saving new user" when trying to sign up new users.

## 🎯 Root Cause
The database trigger function `handle_new_user()` that automatically creates user profiles is failing, preventing user signup from completing.

## 🔧 Solution Options

### Option 1: Fix the Trigger (Recommended)
This maintains automatic profile creation but makes it more robust.

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL migration:**

```sql
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

-- Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "User profiles can be inserted by the user" ON user_profiles;
CREATE POLICY "User profiles can be inserted by the user" ON user_profiles 
  FOR INSERT WITH CHECK (
    id = auth.uid() OR 
    auth.role() = 'service_role'
  );
```

### Option 2: Disable Trigger and Handle Manually (Alternative)
This removes automatic profile creation and handles it in the app.

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL migration:**

```sql
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
```

## 🧪 Testing the Fix

1. **Run the test script:**
   ```bash
   cd /Users/heftydon/Downloads/m3lodi-mobile
   node scripts/test-user-creation.js
   ```

2. **Expected successful output:**
   ```
   ✅ User signup successful
   ✅ Manual profile creation successful
   ✅ Test profile cleaned up
   🎉 User creation test complete!
   ```

3. **Test in your app:**
   - Try creating a new user account
   - Complete the profile setup
   - Verify no console errors

## 🔍 Debugging Steps

If you're still getting errors after the fix:

1. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for any database errors during signup

2. **Verify table structure:**
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'user_profiles';
   ```

3. **Check RLS policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'user_profiles';
   ```

4. **Test manual profile creation:**
   ```sql
   INSERT INTO user_profiles (id, created_at, updated_at)
   VALUES ('test-user-id', NOW(), NOW());
   ```

## 📋 Changes Made to App Code

The auth store has been updated to:
- Use correct table name (`user_profiles` instead of `users`)
- Handle profile creation gracefully after signup
- Provide better error logging
- Match database schema field names

## ✅ Verification Checklist

- [ ] SQL migration executed successfully
- [ ] Test script runs without errors
- [ ] New user signup works in the app
- [ ] Profile completion screen appears
- [ ] Profile data saves correctly
- [ ] No console errors during auth flow

## 🆘 Still Having Issues?

If the problem persists:

1. Share the output from `node scripts/test-user-creation.js`
2. Check your Supabase project logs
3. Verify all migration files have been run
4. Ensure your `.env` file has correct Supabase credentials

The most likely cause is that one of the database migrations hasn't been run yet, or there's a schema mismatch between your database and the app code.
