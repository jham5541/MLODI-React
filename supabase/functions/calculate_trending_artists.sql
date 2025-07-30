-- Function to calculate trending artists
CREATE OR REPLACE FUNCTION calculate_trending_artists(limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    score FLOAT,
    name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        ((SUM(ap.play_count) * 0.7) + (SUM(se.likes) * 0.2) + (SUM(se.shares) * 0.1) ) as score,
        a.name
    FROM artists a
    JOIN artist_plays ap ON a.id = ap.artist_id
    JOIN social_engagements se ON a.id = se.artist_id
    WHERE ap.date >= NOW() - INTERVAL '30 days'
    AND se.date >= NOW() - INTERVAL '30 days'
    GROUP BY a.id, a.name
    ORDER BY score DESC
    LIMIT limit;
END;
$$ LANGUAGE plpgsql;
