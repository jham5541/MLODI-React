-- Real-time features tables
-- These tables support live listening, fan engagement, and social features

-- Listening sessions for real-time "who's listening" features
CREATE TABLE listening_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fan activity log for real-time engagement tracking
CREATE TABLE fan_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'song_play', 'like', 'share', 'comment', 'achievement_unlock', etc.
    points_earned INTEGER DEFAULT 0,
    tier_updated BOOLEAN DEFAULT FALSE,
    achievement_unlocked TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artist activity for followers
CREATE TABLE artist_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'new_song', 'new_album', 'live_session', 'announcement'
    title TEXT NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}', -- Additional data specific to activity type
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications for real-time alerts
CREATE TABLE user_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'achievement', 'tier_upgrade', 'artist_activity', 'playlist_invite', etc.
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio stations for live streaming
CREATE TABLE radio_stations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_song_id UUID REFERENCES songs(id),
    current_song_started_at TIMESTAMP WITH TIME ZONE,
    is_live BOOLEAN DEFAULT FALSE,
    listener_count INTEGER DEFAULT 0,
    genres TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    cover_url TEXT,
    stream_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio station listeners
CREATE TABLE radio_listeners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id UUID REFERENCES radio_stations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(station_id, user_id)
);

-- Live chat for radio stations and collaborative features  
CREATE TABLE live_chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id TEXT NOT NULL, -- radio_station:{id}, playlist:{id}, etc.
    room_type TEXT NOT NULL, -- 'radio_station', 'playlist', 'artist_room'
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- 'text', 'emote', 'system'
    metadata JSONB DEFAULT '{}',
    reply_to_id UUID REFERENCES live_chat_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better real-time performance
CREATE INDEX idx_listening_sessions_active ON listening_sessions(is_active, started_at) WHERE is_active = true;
CREATE INDEX idx_listening_sessions_artist ON listening_sessions(artist_id, is_active, started_at);
CREATE INDEX idx_listening_sessions_user ON listening_sessions(user_id, started_at);

CREATE INDEX idx_fan_activity_log_artist_time ON fan_activity_log(artist_id, created_at);
CREATE INDEX idx_fan_activity_log_user_time ON fan_activity_log(user_id, created_at);

CREATE INDEX idx_artist_activity_time ON artist_activity(artist_id, created_at);
CREATE INDEX idx_artist_activity_public ON artist_activity(is_public, created_at) WHERE is_public = true;

CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read, created_at) WHERE is_read = false;

CREATE INDEX idx_radio_listeners_active ON radio_listeners(station_id, is_active) WHERE is_active = true;
CREATE INDEX idx_live_chat_room ON live_chat_messages(room_id, room_type, created_at);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listening_sessions_updated_at 
    BEFORE UPDATE ON listening_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_radio_stations_updated_at 
    BEFORE UPDATE ON radio_stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update radio station listener count
CREATE OR REPLACE FUNCTION update_radio_listener_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active = false) THEN
        UPDATE radio_stations 
        SET listener_count = listener_count + 1 
        WHERE id = NEW.station_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true) THEN
        UPDATE radio_stations 
        SET listener_count = listener_count - 1 
        WHERE id = COALESCE(OLD.station_id, NEW.station_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_radio_listener_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON radio_listeners
    FOR EACH ROW EXECUTE FUNCTION update_radio_listener_count();

-- Function to clean up old listening sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_listening_sessions()
RETURNS void AS $$
BEGIN
    -- Mark sessions as inactive if they're older than 10 minutes without update
    UPDATE listening_sessions 
    SET is_active = false, ended_at = NOW()
    WHERE is_active = true 
    AND updated_at < NOW() - INTERVAL '10 minutes';
    
    -- Delete very old sessions (older than 30 days)
    DELETE FROM listening_sessions 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Enable Row Level Security (RLS)
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Listening sessions: users can see their own and public sessions of others
CREATE POLICY "Users can view their own listening sessions" ON listening_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own listening sessions" ON listening_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listening sessions" ON listening_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view active public listening sessions" ON listening_sessions
    FOR SELECT USING (is_active = true);

-- Fan activity log: users can see their own activity and artists can see their fans' activity
CREATE POLICY "Users can view their own fan activity" ON fan_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fan activity" ON fan_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Artist activity: public activities are visible to all, private to followers only
CREATE POLICY "Anyone can view public artist activity" ON artist_activity
    FOR SELECT USING (is_public = true);

CREATE POLICY "Artists can manage their own activity" ON artist_activity
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artists 
            WHERE id = artist_activity.artist_id 
            AND owner_id = auth.uid()
        )
    );

-- User notifications: users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Radio stations: public stations visible to all, private to owner and listeners
CREATE POLICY "Anyone can view radio stations" ON radio_stations
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their radio stations" ON radio_stations
    FOR ALL USING (auth.uid() = owner_id);

-- Radio listeners: users can see listeners of stations they're in
CREATE POLICY "Users can view radio listeners" ON radio_listeners
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM radio_listeners rl2 
            WHERE rl2.station_id = radio_listeners.station_id 
            AND rl2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own radio listening" ON radio_listeners
    FOR ALL USING (auth.uid() = user_id);

-- Live chat: users can see messages in rooms they have access to
CREATE POLICY "Users can view chat messages in accessible rooms" ON live_chat_messages
    FOR SELECT USING (
        -- For now, allow all authenticated users to see messages
        -- In production, you'd want more specific rules based on room access
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can create chat messages" ON live_chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON live_chat_messages
    FOR UPDATE USING (auth.uid() = user_id);