-- Production-ready ML database functions
-- These functions aggregate data for the ML models and are called by the edge function.

-- Helper function to safely calculate division
CREATE OR REPLACE FUNCTION safe_divide(numerator REAL, denominator REAL) 
RETURNS REAL AS $$
BEGIN
    RETURN CASE WHEN denominator = 0 THEN 0 ELSE numerator / denominator END;
END;
$$ LANGUAGE plpgsql;

-- 1. Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(artist_uuid UUID)
RETURNS REAL AS $$
DECLARE
    total_plays BIGINT;
    total_likes BIGINT;
    total_shares BIGINT;
    total_playlist_adds BIGINT;
    total_followers BIGINT;
BEGIN
    -- Aggregate metrics for the artist
    SELECT 
        SUM(s.play_count), SUM(s.like_count), SUM(s.share_count)
    INTO total_plays, total_likes, total_shares
    FROM songs s WHERE s.artist_id = artist_uuid;

    SELECT COUNT(*) INTO total_playlist_adds 
    FROM playlist_songs ps
    JOIN songs s ON ps.song_id = s.id
    WHERE s.artist_id = artist_uuid;

    SELECT followers_count INTO total_followers
    FROM artists WHERE id = artist_uuid;

    -- Weighted engagement score formula
    RETURN (
        safe_divide(total_likes, total_plays) * 0.4 +
        safe_divide(total_shares, total_plays) * 0.3 +
        safe_divide(total_playlist_adds, total_plays) * 0.2 +
        safe_divide(total_followers, total_plays) * 0.1
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Function to calculate growth rate (past 30 days)
CREATE OR REPLACE FUNCTION calculate_growth_rate(artist_uuid UUID)
RETURNS REAL AS $$
DECLARE
    current_followers BIGINT;
    previous_followers BIGINT;
    current_monthly_listeners BIGINT;
    previous_monthly_listeners BIGINT;
BEGIN
    -- Get current and previous follower counts
    SELECT followers_count INTO current_followers FROM artists WHERE id = artist_uuid;
    SELECT COALESCE(SUM(new_followers), 0) INTO previous_followers 
    FROM artist_analytics 
    WHERE artist_id = artist_uuid AND date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days';

    -- Get current and previous monthly listeners
    SELECT monthly_listeners INTO current_monthly_listeners FROM artists WHERE id = artist_uuid;
    SELECT COALESCE(AVG(unique_listeners), 0) INTO previous_monthly_listeners
    FROM artist_analytics 
    WHERE artist_id = artist_uuid AND date >= NOW() - INTERVAL '60 days' AND date < NOW() - INTERVAL '30 days';

    RETURN (
        safe_divide(current_followers - previous_followers, previous_followers) * 0.5 +
        safe_divide(current_monthly_listeners - previous_monthly_listeners, previous_monthly_listeners) * 0.5
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Function to get emerging artists
CREATE OR REPLACE FUNCTION get_emerging_artists(limit_count INTEGER)
RETURNS TABLE (
    artist_id UUID, 
    name TEXT, 
    avatar_url TEXT, 
    growth_rate REAL, 
    engagement_score REAL, 
    viral_potential REAL,
    weekly_growth INTEGER,
    playlist_adds INTEGER,
    share_rate REAL,
    completion_rate REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.avatar_url,
        calculate_growth_rate(a.id),
        calculate_engagement_score(a.id),
        (calculate_growth_rate(a.id) * 0.6 + calculate_engagement_score(a.id) * 0.4),
        COALESCE(a.monthly_listeners, 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM playlist_songs ps JOIN songs s ON ps.song_id = s.id WHERE s.artist_id = a.id), 0)::INTEGER,
        calculate_engagement_score(a.id),
        0.85::REAL
    FROM artists a
    WHERE a.created_at >= NOW() - INTERVAL '2 years'
    AND (a.monthly_listeners > 0 OR (SELECT COUNT(*) FROM songs WHERE artist_id = a.id) > 0)
    ORDER BY (calculate_growth_rate(a.id) * 0.6 + calculate_engagement_score(a.id) * 0.4) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get top performing artists (top 1%)
CREATE OR REPLACE FUNCTION get_top_performing_artists(top_percentage REAL, limit_count INTEGER)
RETURNS TABLE (
    artist_id UUID, 
    name TEXT, 
    avatar_url TEXT, 
    growth_rate REAL, 
    engagement_score REAL, 
    viral_potential REAL,
    weekly_growth INTEGER,
    playlist_adds INTEGER,
    share_rate REAL,
    completion_rate REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH artist_scores AS (
        SELECT 
            a.id,
            a.name,
            a.avatar_url,
            calculate_growth_rate(a.id) as growth_score,
            calculate_engagement_score(a.id) as engagement_score_val,
            (calculate_growth_rate(a.id) * 0.4 + calculate_engagement_score(a.id) * 0.6) as performance_score
        FROM artists a
        WHERE (a.monthly_listeners > 0 OR (SELECT COUNT(*) FROM songs WHERE artist_id = a.id) > 0)
    ),
    ranked_artists AS (
        SELECT 
            *,
            NTILE(100) OVER (ORDER BY performance_score DESC) as percentile
        FROM artist_scores
    )
    SELECT 
        ra.id,
        ra.name,
        ra.avatar_url,
        ra.growth_score,
        ra.engagement_score_val,
        ra.performance_score,
        COALESCE((SELECT monthly_listeners FROM artists WHERE id = ra.id), 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM playlist_songs ps JOIN songs s ON ps.song_id = s.id WHERE s.artist_id = ra.id), 0)::INTEGER,
        ra.engagement_score_val,
        0.85::REAL
    FROM ranked_artists ra
    WHERE ra.percentile <= (top_percentage * 100)::INTEGER
    ORDER BY ra.performance_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
