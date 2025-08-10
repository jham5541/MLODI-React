-- Function to get playlists featuring an artist
CREATE OR REPLACE FUNCTION public.get_playlists_featuring_artist(artist_id_param UUID)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name TEXT,
    playlist_cover_url TEXT,
    track_count INTEGER,
    owner_id UUID,
    owner_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id AS playlist_id,
        p.name AS playlist_name,
        p.cover_url AS playlist_cover_url,
        (SELECT COUNT(*) FROM playlist_tracks pt2 WHERE pt2.playlist_id = p.id) AS track_count,
        p.owner_id,
        u.username AS owner_name
    FROM playlists p
    JOIN playlist_tracks pt ON p.id = pt.playlist_id
    JOIN tracks t ON pt.track_id = t.id
    JOIN users u ON p.owner_id = u.id
    WHERE t.artist_id = artist_id_param
    AND p.is_public = true
    ORDER BY track_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get track reaction counts
CREATE OR REPLACE FUNCTION public.get_track_reaction_counts()
RETURNS TABLE (
    track_id UUID,
    reaction_type TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.track_id,
        tr.reaction_type,
        COUNT(*) as count
    FROM track_reactions tr
    GROUP BY tr.track_id, tr.reaction_type;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key relationship between track_comments and users
ALTER TABLE track_comments
ADD CONSTRAINT fk_track_comments_user
FOREIGN KEY (user_id) 
REFERENCES users(id)
ON DELETE CASCADE;
