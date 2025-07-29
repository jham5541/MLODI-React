-- Test script to verify all tables exist and have the correct structure

-- Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('engagements', 'fan_scores', 'users', 'artists') 
    THEN 'Required table exists' 
    ELSE 'Table exists but not required for fan scoring' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check engagements table structure
SELECT 'engagements' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'engagements' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check fan_scores table structure
SELECT 'fan_scores' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fan_scores' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check users table structure
SELECT 'users' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check artists table structure (existing)
SELECT 'artists' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'artists' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check indexes on engagements table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'engagements' AND schemaname = 'public';

-- Check indexes on fan_scores table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'fan_scores' AND schemaname = 'public';

-- Test inserting sample data (optional - comment out if you don't want test data)
/*
-- Insert test user
INSERT INTO users (id, username, email) 
VALUES (gen_random_uuid(), 'test_user', 'test@example.com')
ON CONFLICT (username) DO NOTHING;

-- Insert test engagement (replace UUIDs with actual values)
INSERT INTO engagements (user_id, artist_id, engagement_type, points) 
VALUES (
  (SELECT id FROM users WHERE username = 'test_user' LIMIT 1),
  (SELECT id FROM artists LIMIT 1),
  'SONG_PLAY',
  1
)
ON CONFLICT DO NOTHING;

-- Insert test fan score
INSERT INTO fan_scores (user_id, artist_id, total_score, streaming_points) 
VALUES (
  (SELECT id FROM users WHERE username = 'test_user' LIMIT 1),
  (SELECT id FROM artists LIMIT 1),
  100,
  100
)
ON CONFLICT (user_id, artist_id) DO UPDATE SET 
  total_score = EXCLUDED.total_score,
  streaming_points = EXCLUDED.streaming_points,
  last_updated = NOW();
*/
