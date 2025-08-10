-- Create missing tables
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    release_date DATE,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
    duration INTEGER,
    audio_url TEXT,
    cover_url TEXT,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id)
);

CREATE TABLE IF NOT EXISTS public.user_likes (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id)
);

CREATE TABLE IF NOT EXISTS public.play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_played INTEGER
);

CREATE TABLE IF NOT EXISTS public.fan_scores (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    streaming_points INTEGER DEFAULT 0,
    purchase_points INTEGER DEFAULT 0,
    social_points INTEGER DEFAULT 0,
    video_points INTEGER DEFAULT 0,
    event_points INTEGER DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    fan_since TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE IF NOT EXISTS public.engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    engagement_type TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create merchandise tables
CREATE TABLE IF NOT EXISTS public.merchandise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.merchandise_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchandise_id UUID REFERENCES public.merchandise(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create track comments and reactions tables
CREATE TABLE IF NOT EXISTS public.track_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    comment_id UUID REFERENCES public.track_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.track_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create all the missing functions

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
    JOIN songs t ON pt.track_id = t.id
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

-- Function to get top performing artists
CREATE OR REPLACE FUNCTION public.get_top_performing_artists(
    limit_count INTEGER DEFAULT 10,
    top_percentage FLOAT DEFAULT 0.1
)
RETURNS TABLE (
    artist_id UUID,
    artist_name TEXT,
    total_plays BIGINT,
    unique_listeners INTEGER,
    engagement_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH play_metrics AS (
        SELECT 
            s.artist_id,
            COUNT(ph.id) as total_plays,
            COUNT(DISTINCT ph.user_id) as unique_listeners
        FROM songs s
        LEFT JOIN play_history ph ON s.id = ph.song_id
        GROUP BY s.artist_id
    ),
    engagement_metrics AS (
        SELECT
            artist_id,
            COUNT(*) as total_engagements,
            SUM(points) as total_points
        FROM engagements
        GROUP BY artist_id
    )
    SELECT 
        a.id as artist_id,
        a.name as artist_name,
        COALESCE(pm.total_plays, 0) as total_plays,
        COALESCE(pm.unique_listeners, 0) as unique_listeners,
        (
            COALESCE(pm.total_plays, 0) * 0.4 +
            COALESCE(pm.unique_listeners, 0) * 0.3 +
            COALESCE(em.total_engagements, 0) * 0.2 +
            COALESCE(em.total_points, 0) * 0.1
        ) as engagement_score
    FROM artists a
    LEFT JOIN play_metrics pm ON a.id = pm.artist_id
    LEFT JOIN engagement_metrics em ON a.id = em.artist_id
    WHERE (
        SELECT COUNT(*) 
        FROM artists
    ) * top_percentage >= ROW_NUMBER() OVER (
        ORDER BY (
            COALESCE(pm.total_plays, 0) * 0.4 +
            COALESCE(pm.unique_listeners, 0) * 0.3 +
            COALESCE(em.total_engagements, 0) * 0.2 +
            COALESCE(em.total_points, 0) * 0.1
        ) DESC
    )
    ORDER BY engagement_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
