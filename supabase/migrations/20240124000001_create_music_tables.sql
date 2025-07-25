-- Create music platform database schema
-- This migration creates the core tables for the M3lodi music platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists table
CREATE TABLE artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    genres TEXT[] DEFAULT '{}',
    followers_count INTEGER DEFAULT 0,
    monthly_listeners INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    wallet_address TEXT,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 70.00,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums table
CREATE TABLE albums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    description TEXT,
    cover_url TEXT,
    release_date DATE,
    album_type TEXT CHECK (album_type IN ('album', 'ep', 'single')) DEFAULT 'album',
    total_tracks INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    nft_collection_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs table
CREATE TABLE songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    duration_ms INTEGER NOT NULL,
    genre TEXT,
    mood TEXT,
    tempo INTEGER,
    key_signature TEXT,
    lyrics TEXT,
    is_explicit BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    -- NFT-related fields
    nft_token_address TEXT,
    nft_total_supply INTEGER DEFAULT 0,
    nft_available_supply INTEGER DEFAULT 0,
    nft_price DECIMAL(20,8) DEFAULT 0,
    nft_royalty_percentage DECIMAL(5,2) DEFAULT 10.00,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    waveform_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlists table
CREATE TABLE playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE,
    is_collaborative BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    mood TEXT,
    genre TEXT,
    total_tracks INTEGER DEFAULT 0,
    total_duration_ms INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlist collaborators
CREATE TABLE playlist_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) DEFAULT 'editor',
    permissions JSONB DEFAULT '{"can_add": true, "can_remove": false, "can_reorder": true}',
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, user_id)
);

-- Playlist songs (tracks in playlists)
CREATE TABLE playlist_songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, song_id),
    UNIQUE(playlist_id, position)
);

-- User follows (artists and playlists)
CREATE TABLE user_follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_type TEXT CHECK (followed_type IN ('artist', 'playlist', 'user')) NOT NULL,
    followed_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, followed_type, followed_id)
);

-- User likes (songs, albums, playlists)
CREATE TABLE user_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_type TEXT CHECK (liked_type IN ('song', 'album', 'playlist')) NOT NULL,
    liked_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, liked_type, liked_id)
);

-- Play history
CREATE TABLE play_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_played_ms INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}'
);

-- User profiles extension (add to existing users table)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    location TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    total_listening_time_ms BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_verified ON artists(is_verified);
CREATE INDEX idx_albums_artist_id ON albums(artist_id);
CREATE INDEX idx_albums_release_date ON albums(release_date);
CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_songs_album_id ON songs(album_id);
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_songs_play_count ON songs(play_count DESC);
CREATE INDEX idx_playlists_owner_id ON playlists(owner_id);
CREATE INDEX idx_playlists_public ON playlists(is_private);
CREATE INDEX idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_position ON playlist_songs(playlist_id, position);
CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX idx_user_follows_followed ON user_follows(followed_type, followed_id);
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_likes_liked ON user_likes(liked_type, liked_id);
CREATE INDEX idx_play_history_user_id ON play_history(user_id);
CREATE INDEX idx_play_history_song_id ON play_history(song_id);
CREATE INDEX idx_play_history_played_at ON play_history(played_at DESC);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();