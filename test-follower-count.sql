-- Test Script: Verify Artist Follower Count System
-- Run this in Supabase SQL Editor to test the follower count system

-- 1. Check current trigger setup
SELECT 
    '🔧 Trigger Status' as check_type,
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN '✅ Enabled'
        WHEN 'D' THEN '❌ Disabled'
        ELSE '⚠️ Unknown'
    END as status
FROM pg_trigger
WHERE tgrelid = 'public.user_follows'::regclass
AND tgname = 'artist_follow_count_trigger';

-- 2. Test follow/unfollow with a specific artist
DO $$
DECLARE
    test_user_id UUID := 'bdc41bd0-9e72-48bc-a610-ca6e20e4efce'; -- Your user ID
    test_artist_id UUID;
    before_count INTEGER;
    after_count INTEGER;
BEGIN
    -- Get an artist to test with
    SELECT id INTO test_artist_id 
    FROM artists 
    WHERE name = 'Hefty Da King' 
    LIMIT 1;
    
    IF test_artist_id IS NULL THEN
        RAISE NOTICE '❌ Test artist not found';
        RETURN;
    END IF;
    
    -- Get current count
    SELECT followers_count INTO before_count 
    FROM artists 
    WHERE id = test_artist_id;
    
    RAISE NOTICE '📊 Before count: %', before_count;
    
    -- Try to follow (ignore if already following)
    INSERT INTO user_follows (user_id, followed_type, followed_id)
    VALUES (test_user_id, 'artist', test_artist_id)
    ON CONFLICT DO NOTHING;
    
    -- Get new count
    SELECT followers_count INTO after_count 
    FROM artists 
    WHERE id = test_artist_id;
    
    RAISE NOTICE '📊 After follow count: %', after_count;
    
    -- Unfollow
    DELETE FROM user_follows 
    WHERE user_id = test_user_id 
    AND followed_type = 'artist' 
    AND followed_id = test_artist_id;
    
    -- Get final count
    SELECT followers_count INTO after_count 
    FROM artists 
    WHERE id = test_artist_id;
    
    RAISE NOTICE '📊 After unfollow count: %', after_count;
    
    IF after_count = before_count THEN
        RAISE NOTICE '✅ Follower count system working correctly!';
    ELSE
        RAISE NOTICE '⚠️ Count mismatch detected';
    END IF;
END $$;

-- 3. Show all artists with their follower counts
SELECT 
    '👥 Artist Follower Summary' as report,
    '' as "";
    
SELECT 
    a.name AS "Artist Name",
    a.followers_count AS "Stored Count",
    COUNT(f.id) AS "Actual Follows",
    CASE 
        WHEN a.followers_count = COUNT(f.id) THEN '✅'
        ELSE '❌'
    END AS "Match"
FROM artists a
LEFT JOIN user_follows f ON f.followed_id = a.id AND f.followed_type = 'artist'
GROUP BY a.id, a.name, a.followers_count
ORDER BY a.followers_count DESC, a.name
LIMIT 20;

-- 4. Check for any orphaned follows (artist doesn't exist)
SELECT 
    '⚠️ Orphaned Follows Check' as check,
    COUNT(*) as orphaned_count
FROM user_follows f
WHERE f.followed_type = 'artist'
AND NOT EXISTS (
    SELECT 1 FROM artists a WHERE a.id = f.followed_id
);

-- 5. Manual count fix (if needed)
-- Uncomment to fix all counts:
/*
UPDATE artists a
SET followers_count = (
    SELECT COUNT(*)
    FROM user_follows f
    WHERE f.followed_id = a.id
    AND f.followed_type = 'artist'
);
*/
