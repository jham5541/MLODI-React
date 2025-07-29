-- Create engagements table
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  engagement_type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for engagements table
CREATE INDEX IF NOT EXISTS idx_engagements_user_artist ON engagements(user_id, artist_id);
CREATE INDEX IF NOT EXISTS idx_engagements_artist_timestamp ON engagements(artist_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_engagements_user_timestamp ON engagements(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_engagements_type ON engagements(engagement_type);

-- Create fan_scores table
CREATE TABLE IF NOT EXISTS fan_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  streaming_points INTEGER NOT NULL DEFAULT 0,
  purchase_points INTEGER NOT NULL DEFAULT 0,
  social_points INTEGER NOT NULL DEFAULT 0,
  video_points INTEGER NOT NULL DEFAULT 0,
  event_points INTEGER NOT NULL DEFAULT 0,
  consecutive_days INTEGER NOT NULL DEFAULT 0,
  fan_since TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Create indexes for fan_scores table
CREATE INDEX IF NOT EXISTS idx_fan_scores_artist_score ON fan_scores(artist_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_fan_scores_user ON fan_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_scores_total_score ON fan_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_fan_scores_last_updated ON fan_scores(last_updated);

-- Create users table if it doesn't exist (for fan scoring purposes)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  profile_picture TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Create engagement types enum (optional, for data validation)
CREATE TYPE IF NOT EXISTS engagement_type_enum AS ENUM (
  'SONG_PLAY',
  'SONG_COMPLETE', 
  'ALBUM_PLAY',
  'PLAYLIST_ADD',
  'SONG_SHARE',
  'SONG_REPEAT',
  'SONG_PURCHASE',
  'ALBUM_PURCHASE',
  'MERCHANDISE',
  'CONCERT_TICKET',
  'VIDEO_VIEW',
  'VIDEO_COMPLETE',
  'VIDEO_LIKE',
  'VIDEO_SHARE',
  'VIDEO_COMMENT',
  'ARTIST_FOLLOW',
  'POST_LIKE',
  'POST_COMMENT',
  'POST_SHARE',
  'CONCERT_ATTENDANCE',
  'MEET_GREET',
  'VIP_EXPERIENCE',
  'NEW_RELEASE_EARLY_ACCESS'
);

-- Add foreign key constraints if you want referential integrity
-- (Uncomment these if you want strict foreign key relationships)
-- ALTER TABLE engagements ADD CONSTRAINT fk_engagements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE engagements ADD CONSTRAINT fk_engagements_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
-- ALTER TABLE fan_scores ADD CONSTRAINT fk_fan_scores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE fan_scores ADD CONSTRAINT fk_fan_scores_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_engagements_updated_at BEFORE UPDATE ON engagements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fan_scores_updated_at BEFORE UPDATE ON fan_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
