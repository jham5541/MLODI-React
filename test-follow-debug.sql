-- Debug script for testing follow functionality
-- Run this in Supabase SQL Editor to test the follow system

-- 1. Check if user_follows table exists and its structure
SELECT 
    'Table Structure' as check_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_follows'
ORDER BY ordinal_position;

-- 2. Check current RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'user_follows';

-- 3. Test insert as service role (bypasses RLS)
DO $$
DECLARE
    test_user_id UUID;
    test_artist_id UUID;
    test_result RECORD;
BEGIN
    -- Get a real user and artist
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'biigheftydon@gmail.com' LIMIT 1;
    SELECT id INTO test_artist_id FROM public.profiles WHERE username = 'lunaeclipse' LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Test user not found';
    ELSIF test_artist_id IS NULL THEN
        RAISE NOTICE 'Test artist not found';
    ELSE
        -- Try to insert a follow
        INSERT INTO public.user_follows (user_id, followed_type, followed_id)
        VALUES (test_user_id, 'artist', test_artist_id)
        ON CONFLICT (user_id, followed_type, followed_id) DO NOTHING
        RETURNING * INTO test_result;
        
        IF test_result.id IS NOT NULL THEN
            RAISE NOTICE 'Follow created successfully: %', test_result.id;
        ELSE
            RAISE NOTICE 'Follow already exists or insert failed';
        END IF;
    END IF;
END $$;

-- 4. Check recent follows
SELECT 
    'Recent Follows' as check_type,
    f.id,
    f.user_id,
    u.email as user_email,
    f.followed_type,
    f.followed_id,
    a.username as artist_username,
    f.created_at
FROM public.user_follows f
LEFT JOIN auth.users u ON f.user_id = u.id
LEFT JOIN public.profiles a ON f.followed_id = a.id
ORDER BY f.created_at DESC
LIMIT 10;

-- 5. Check follower counts
SELECT 
    'Artist Follower Counts' as check_type,
    p.id,
    p.username,
    p.display_name,
    p.follower_count as stored_count,
    COUNT(f.id) as actual_count
FROM public.profiles p
LEFT JOIN public.user_follows f ON f.followed_id = p.id AND f.followed_type = 'artist'
WHERE p.username IN ('lunaeclipse', 'neonpulse', 'cosmicwaves', 'digitaldreams', 'aurorasynthetics')
GROUP BY p.id, p.username, p.display_name, p.follower_count;

-- 6. Check if trigger exists
SELECT 
    'Trigger Status' as check_type,
    tgname as trigger_name,
    tgtype,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.user_follows'::regclass;

-- 7. Test the trigger by inserting and checking count update
DO $$
DECLARE
    before_count INTEGER;
    after_count INTEGER;
    test_artist_id UUID;
BEGIN
    -- Get an artist
    SELECT id INTO test_artist_id FROM public.profiles WHERE username = 'neonpulse' LIMIT 1;
    
    -- Get current count
    SELECT follower_count INTO before_count FROM public.profiles WHERE id = test_artist_id;
    
    -- Insert a test follow
    INSERT INTO public.user_follows (user_id, followed_type, followed_id)
    VALUES ('d4e5f6a1-b2c3-4757-8b8f-345678901234', 'artist', test_artist_id)
    ON CONFLICT (user_id, followed_type, followed_id) DO NOTHING;
    
    -- Get new count
    SELECT follower_count INTO after_count FROM public.profiles WHERE id = test_artist_id;
    
    RAISE NOTICE 'Follower count before: %, after: %', before_count, after_count;
    
    -- Clean up test
    DELETE FROM public.user_follows 
    WHERE user_id = 'd4e5f6a1-b2c3-4757-8b8f-345678901234' 
    AND followed_id = test_artist_id;
END $$;
