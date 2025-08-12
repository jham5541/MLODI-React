-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'artist', 'admin');
CREATE TYPE content_type AS ENUM ('song', 'album', 'video', 'playlist');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    role user_role DEFAULT 'user'
);

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    bio TEXT,
    profile_picture TEXT,
    cover_url TEXT,
    genres TEXT[],
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id),
    cover_url TEXT,
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id),
    album_id UUID REFERENCES albums(id),
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    duration INTEGER NOT NULL, -- Duration in seconds
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    cover_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create playlist_songs table (junction table)
CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id UUID REFERENCES playlists(id),
    song_id UUID REFERENCES songs(id),
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (playlist_id, song_id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    user_id UUID REFERENCES users(id),
    content_id UUID NOT NULL,
    content_type content_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (user_id, content_id, content_type)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(id),
    following_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (follower_id, following_id)
);

-- Create play_history table
CREATE TABLE IF NOT EXISTS play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    song_id UUID REFERENCES songs(id),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    play_duration INTEGER NOT NULL -- Duration played in seconds
);

-- Create listening_sessions table
CREATE TABLE IF NOT EXISTS listening_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    song_id UUID REFERENCES songs(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- Duration in seconds
    completed BOOLEAN DEFAULT false
);

-- Create RLS Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create policies for artists
CREATE POLICY "Anyone can view artists"
    ON artists FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Artists can update their own profile"
    ON artists FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Create policies for songs
CREATE POLICY "Anyone can view songs"
    ON songs FOR SELECT
    TO authenticated
    USING (true);

-- Create policies for playlists
CREATE POLICY "Users can view public playlists"
    ON playlists FOR SELECT
    TO authenticated
    USING (is_public OR user_id = auth.uid());

CREATE POLICY "Users can create their own playlists"
    ON playlists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
    ON playlists FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for playlist songs
CREATE POLICY "Users can view songs in accessible playlists"
    ON playlist_songs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists
            WHERE id = playlist_id
            AND (is_public OR user_id = auth.uid())
        )
    );

CREATE POLICY "Users can modify their own playlist songs"
    ON playlist_songs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists
            WHERE id = playlist_id
            AND user_id = auth.uid()
        )
    );

-- Create policies for likes
CREATE POLICY "Users can manage their own likes"
    ON likes FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Create policies for play history
CREATE POLICY "Users can view and manage their own play history"
    ON play_history FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Create policies for listening sessions
CREATE POLICY "Users can manage their own listening sessions"
    ON listening_sessions FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
