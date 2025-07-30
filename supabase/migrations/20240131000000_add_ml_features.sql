-- Create ML-specific tables and functions

-- 1. User Listening Profiles
CREATE TABLE user_listening_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    top_genres TEXT[],
    top_artists UUID[],
    avg_tempo FLOAT,
    avg_energy FLOAT,
    avg_valence FLOAT,
    listening_time_distribution JSONB,
    total_listening_time BIGINT,
    unique_tracks INTEGER,
    repeat_listens JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recommendation Logs
CREATE TABLE recommendation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    algorithm TEXT,
    recommendations JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Functions for Recommendations
CREATE OR REPLACE FUNCTION find_similar_users(target_user_id UUID, user_song_ids UUID[], similarity_threshold FLOAT, limit_users INTEGER)
RETURNS TABLE(user_id UUID, similarity FLOAT) AS $$
BEGIN
    -- Find users who have listened to the same songs
    RETURN QUERY
    SELECT 
        uh.user_id,
        COUNT(*)::FLOAT / (SELECT COUNT(*) FROM unnest(user_song_ids))::FLOAT AS similarity
    FROM play_history uh
    WHERE uh.user_id != target_user_id AND uh.song_id = ANY(user_song_ids)
    GROUP BY uh.user_id
    HAVING COUNT(*)::FLOAT / (SELECT COUNT(*) FROM unnest(user_song_ids))::FLOAT >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT limit_users;
END; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_similar_songs_by_features(target_bpm FLOAT, target_energy FLOAT, target_danceability FLOAT, target_valence FLOAT, preferred_genres TEXT[], exclude_song_ids UUID[], similarity_threshold FLOAT, limit_songs INTEGER)
RETURNS SETOF songs AS $$
BEGIN
    -- Find songs with similar audio features
    RETURN QUERY
    SELECT *
    FROM songs
    WHERE NOT (id = ANY(exclude_song_ids)) AND (
        -- Weighted distance function
        (0.2 * abs(bpm - target_bpm) / 60) +
        (0.25 * abs(energy - target_energy)) +
        (0.25 * abs(danceability - target_danceability)) +
        (0.2 * abs(valence - target_valence)) +
        (CASE WHEN genre = ANY(preferred_genres) THEN -0.1 ELSE 0 END)
    ) <= (1 - similarity_threshold)
    ORDER BY play_count DESC NULLS LAST
    LIMIT limit_songs;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_emerging_artists(p_limit INTEGER)
RETURNS TABLE(artist_id UUID, growth_rate FLOAT, engagement_score FLOAT, viral_potential FLOAT) AS $$
BEGIN
    -- Simplified emerging artists function (replace with more complex logic)
    RETURN QUERY
    SELECT a.id, 
           (a.monthly_listeners - (a.monthly_listeners * 0.9)) / (a.monthly_listeners * 0.9) AS growth_rate,
           (AVG(s.like_count) / 1000.0) AS engagement_score,
           ((a.monthly_listeners - (a.monthly_listeners * 0.9)) / (a.monthly_listeners * 0.9) * 0.5) + ((AVG(s.like_count) / 1000.0) * 0.5) AS viral_potential
    FROM artists a
    JOIN songs s ON s.artist_id = a.id
    WHERE a.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY a.id
    ORDER BY viral_potential DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
