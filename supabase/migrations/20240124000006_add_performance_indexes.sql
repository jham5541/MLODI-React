-- Performance Optimization Indexes for M3lodi Database
-- This migration adds critical indexes to improve query performance

-- ============================================================================
-- CORE MUSIC TABLE INDEXES
-- ============================================================================

-- Songs table indexes (most frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_artist_genre_created 
ON songs(artist_id, genre, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_play_count_public 
ON songs(play_count DESC, is_public) WHERE is_public = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_genre_trending 
ON songs(genre, play_count DESC, created_at DESC) WHERE is_public = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_artist_popular 
ON songs(artist_id, play_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_search_text 
ON songs USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Artists table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_followers_verified 
ON artists(followers_count DESC, is_verified);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_genre_followers 
ON artists USING gin(genres) WHERE followers_count > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_search_text 
ON artists USING gin(to_tsvector('english', name || ' ' || COALESCE(bio, '')));

-- Albums table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_artist_release 
ON albums(artist_id, release_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_release_public 
ON albums(release_date DESC, is_public) WHERE is_public = true;

-- ============================================================================
-- USER INTERACTION INDEXES
-- ============================================================================

-- Play history indexes (critical for analytics and recommendations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_play_history_user_time 
ON play_history(user_id, played_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_play_history_song_time 
ON play_history(song_id, played_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_play_history_recent_trending 
ON play_history(played_at DESC) WHERE played_at > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_play_history_completion 
ON play_history(user_id, completion_percentage) WHERE completion_percentage > 0.8;

-- User follows indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_user_type 
ON user_follows(user_id, followed_type, followed_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_follows_followed_type 
ON user_follows(followed_type, followed_id, created_at DESC);

-- User likes indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_likes_user_type 
ON user_likes(user_id, liked_type, liked_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_likes_liked_type 
ON user_likes(liked_type, liked_id, created_at DESC);

-- ============================================================================
-- PLAYLIST SYSTEM INDEXES
-- ============================================================================

-- Playlists indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_owner_public 
ON playlists(owner_id, is_private, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_public_popular 
ON playlists(is_private, play_count DESC) WHERE is_private = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_collaborative 
ON playlists(is_collaborative, updated_at DESC) WHERE is_collaborative = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_search_text 
ON playlists USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Playlist songs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_songs_playlist_position 
ON playlist_songs(playlist_id, position);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_songs_song_playlists 
ON playlist_songs(song_id, playlist_id);

-- Playlist collaborators indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_collaborators_user 
ON playlist_collaborators(user_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_collaborators_playlist 
ON playlist_collaborators(playlist_id, role);

-- ============================================================================
-- FAN ENGAGEMENT INDEXES
-- ============================================================================

-- Fan tiers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_tiers_artist_points 
ON fan_tiers(artist_id, points DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_tiers_user_tier 
ON fan_tiers(user_id, tier, points DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_tiers_tier_leaderboard 
ON fan_tiers(tier, points DESC, artist_id);

-- User achievements indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user_artist 
ON user_achievements(user_id, artist_id, unlocked_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_recent 
ON user_achievements(unlocked_at DESC) WHERE unlocked_at > NOW() - INTERVAL '30 days';

-- User challenge progress indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_challenge_progress_active 
ON user_challenge_progress(user_id, artist_id, is_completed, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_challenge_progress_completion 
ON user_challenge_progress(challenge_id, is_completed, progress DESC);

-- ============================================================================
-- NFT MARKETPLACE INDEXES
-- ============================================================================

-- NFT collections indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_collections_artist_verified 
ON nft_collections(artist_id, is_verified, floor_price);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_collections_volume_trending 
ON nft_collections(volume_traded DESC, updated_at DESC);

-- NFT listings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_listings_collection_price 
ON nft_listings(collection_id, price ASC, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_listings_song_price 
ON nft_listings(song_id, price ASC) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_listings_seller_active 
ON nft_listings(seller_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_listings_trending 
ON nft_listings(created_at DESC, price) WHERE status = 'active';

-- NFT transactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_transactions_buyer_time 
ON nft_transactions(buyer_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_transactions_seller_time 
ON nft_transactions(seller_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nft_transactions_recent_volume 
ON nft_transactions(created_at DESC, price) WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- REAL-TIME FEATURES INDEXES
-- ============================================================================

-- Listening sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listening_sessions_active_user 
ON listening_sessions(user_id, is_active, started_at DESC) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listening_sessions_active_artist 
ON listening_sessions(artist_id, is_active, started_at DESC) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listening_sessions_active_song 
ON listening_sessions(song_id, is_active, started_at DESC) WHERE is_active = true;

-- Fan activity log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_activity_log_artist_time 
ON fan_activity_log(artist_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_activity_log_user_time 
ON fan_activity_log(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_activity_log_recent_activity 
ON fan_activity_log(activity_type, created_at DESC) WHERE created_at > NOW() - INTERVAL '7 days';

-- User notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_unread 
ON user_notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_type_recent 
ON user_notifications(type, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

-- User analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_user_date 
ON user_analytics(user_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_date_listening 
ON user_analytics(date DESC, total_listening_time_ms DESC);

-- Artist analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_analytics_artist_date 
ON artist_analytics(artist_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_analytics_date_plays 
ON artist_analytics(date DESC, total_plays DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Trending songs composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_trending_composite 
ON songs(is_public, created_at DESC, play_count DESC) 
WHERE is_public = true AND created_at > NOW() - INTERVAL '30 days';

-- User music discovery composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_music_discovery 
ON play_history(user_id, played_at DESC, completion_percentage) 
WHERE completion_percentage > 0.5;

-- Artist fan engagement composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artist_fan_engagement 
ON fan_tiers(artist_id, tier, last_activity_at DESC, points DESC);

-- Marketplace trending composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_trending 
ON nft_listings(status, created_at DESC, price) 
WHERE status = 'active' AND created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Active only indexes (reduce index size)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_active_public 
ON playlists(updated_at DESC, play_count DESC) 
WHERE is_private = false AND updated_at > NOW() - INTERVAL '1 year';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_active_trending 
ON songs(play_count DESC, created_at DESC) 
WHERE is_public = true AND created_at > NOW() - INTERVAL '2 years';

-- ============================================================================
-- EXPRESSION INDEXES FOR CALCULATED FIELDS
-- ============================================================================

-- Duration-based indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_duration_category 
ON songs((CASE 
    WHEN duration_ms < 180000 THEN 'short'
    WHEN duration_ms < 300000 THEN 'medium' 
    ELSE 'long' 
END), play_count DESC);

-- Fan tier ranking index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fan_tiers_rank_calculation 
ON fan_tiers(artist_id, (points + total_listening_time_ms/1000 + songs_liked*10) DESC);

-- ============================================================================
-- FOREIGN KEY INDEXES (if not automatically created)
-- ============================================================================

-- Ensure all foreign key columns have indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_owner_id ON playlists(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_play_history_user_id ON play_history(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_play_history_song_id ON play_history(song_id);

-- ============================================================================
-- CLEANUP AND MAINTENANCE
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE songs;
ANALYZE artists;
ANALYZE albums;
ANALYZE playlists;
ANALYZE play_history;
ANALYZE user_follows;
ANALYZE user_likes;
ANALYZE fan_tiers;
ANALYZE nft_listings;
ANALYZE nft_collections;

-- Create a function to maintain index statistics
CREATE OR REPLACE FUNCTION maintain_index_statistics()
RETURNS void AS $$
BEGIN
  -- Update statistics on main tables
  ANALYZE songs;
  ANALYZE artists;
  ANALYZE play_history;
  ANALYZE user_likes;
  ANALYZE user_follows;
  ANALYZE playlists;
  ANALYZE fan_tiers;
  ANALYZE nft_listings;
  
  -- Log maintenance
  INSERT INTO maintenance_log (action, description, executed_at)
  VALUES ('index_maintenance', 'Updated table statistics for query optimization', NOW());
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors but don't fail
  INSERT INTO maintenance_log (action, description, executed_at, error)
  VALUES ('index_maintenance', 'Error updating statistics', NOW(), SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Schedule regular statistics updates (requires pg_cron extension)
-- SELECT cron.schedule('maintain-stats', '0 2 * * *', 'SELECT maintain_index_statistics();');

-- ============================================================================
-- INDEX MONITORING QUERIES
-- ============================================================================

-- Create a view to monitor index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE WHEN idx_scan > 0 THEN idx_tup_read::float / idx_scan ELSE 0 END as avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create a view to identify unused indexes
CREATE OR REPLACE VIEW unused_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;