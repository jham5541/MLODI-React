--
-- Database Analysis SQL Queries for M3lodi Supabase Instance
-- Run these queries in your Supabase SQL Editor to see all 87 tables
--

-- Query 1: Get all tables grouped by schema with counts
SELECT 
    schemaname as schema_name,
    COUNT(*) as table_count,
    array_agg(tablename ORDER BY tablename) as table_names
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY schemaname
ORDER BY table_count DESC;

-- Query 2: List ALL tables with details
SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner,
    CASE 
        WHEN schemaname = 'public' THEN '📊 Application Data'
        WHEN schemaname = 'auth' THEN '🔐 Authentication'
        WHEN schemaname = 'storage' THEN '💾 File Storage'
        WHEN schemaname = 'realtime' THEN '⚡ Real-time'
        WHEN schemaname = 'supabase_migrations' THEN '🔄 Migrations'
        WHEN schemaname LIKE 'pg_%' THEN '🔧 PostgreSQL System'
        ELSE '🔍 Other'
    END as category
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    CASE schemaname
        WHEN 'public' THEN 1
        WHEN 'auth' THEN 2
        WHEN 'storage' THEN 3
        WHEN 'realtime' THEN 4
        ELSE 5
    END,
    tablename;

-- Query 3: Count tables by category
SELECT 
    CASE 
        WHEN schemaname = 'public' THEN '📊 Application Data'
        WHEN schemaname = 'auth' THEN '🔐 Authentication'
        WHEN schemaname = 'storage' THEN '💾 File Storage'
        WHEN schemaname = 'realtime' THEN '⚡ Real-time'
        WHEN schemaname = 'supabase_migrations' THEN '🔄 Migrations'
        WHEN schemaname LIKE 'pg_%' THEN '🔧 PostgreSQL System'
        ELSE '🔍 Other (' || schemaname || ')'
    END as category,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY category
ORDER BY table_count DESC;

-- Query 4: Show YOUR custom application tables (from migrations)
SELECT 
    tablename as table_name,
    obj_description(c.oid) as table_comment,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = tablename AND table_schema = 'public') as column_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN (
    -- Core Music Tables
    'artists', 'albums', 'songs', 'playlists', 'playlist_songs', 'playlist_collaborators',
    'user_profiles', 'user_follows', 'user_likes', 'play_history',
    -- Fan Engagement Tables  
    'fan_tiers', 'achievements', 'user_achievements', 'challenges', 'user_challenge_progress',
    'milestones', 'user_milestone_progress', 'user_analytics', 'artist_analytics',
    -- NFT Marketplace Tables
    'nft_collections', 'nft_listings', 'nft_transactions', 'marketplace_stats',
    -- Real-time Tables
    'listening_sessions', 'fan_activity_log', 'artist_activity', 'user_notifications',
    'radio_stations', 'radio_listeners', 'live_chat_messages'
  )
ORDER BY 
    CASE 
        WHEN tablename IN ('artists', 'albums', 'songs') THEN 1
        WHEN tablename LIKE 'playlist%' THEN 2
        WHEN tablename LIKE 'user_%' THEN 3
        WHEN tablename LIKE 'fan_%' OR tablename IN ('achievements', 'challenges', 'milestones') THEN 4
        WHEN tablename LIKE 'nft_%' OR tablename = 'marketplace_stats' THEN 5
        WHEN tablename IN ('listening_sessions', 'artist_activity', 'user_notifications') THEN 6
        WHEN tablename LIKE 'radio_%' OR tablename = 'live_chat_messages' THEN 7
        ELSE 8
    END,
    tablename;

-- Query 5: Show table sizes (number of rows) for your application tables
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as current_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Query 6: Check if migrations have been applied
SELECT 
    version,
    name,
    executed_at
FROM supabase_migrations.schema_migrations 
ORDER BY executed_at DESC;

-- Query 7: Authentication tables overview
SELECT 
    tablename as auth_table,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = tablename AND table_schema = 'auth') as column_count
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Query 8: Storage system tables
SELECT 
    tablename as storage_table,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = tablename AND table_schema = 'storage') as column_count
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;

-- Query 9: Real-time system tables
SELECT 
    tablename as realtime_table,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = tablename AND table_schema = 'realtime') as column_count
FROM pg_tables 
WHERE schemaname = 'realtime'
ORDER BY tablename;