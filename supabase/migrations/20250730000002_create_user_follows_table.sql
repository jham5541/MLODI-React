-- Create user_follows table for artist following functionality

-- Drop table if it exists (in case it has wrong structure)
DROP TABLE IF EXISTS user_follows;

-- Create user_follows table with correct structure
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    followed_type VARCHAR(50) NOT NULL CHECK (followed_type IN ('artist', 'user', 'playlist')),
    followed_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can't follow the same entity twice
    UNIQUE(user_id, followed_type, followed_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX idx_user_follows_followed ON user_follows(followed_type, followed_id);
CREATE INDEX idx_user_follows_composite ON user_follows(user_id, followed_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users can only see their own follows
CREATE POLICY "Users can view their own follows" ON user_follows
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create their own follows
CREATE POLICY "Users can create their own follows" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own follows
CREATE POLICY "Users can delete their own follows" ON user_follows
    FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_follows_updated_at
    BEFORE UPDATE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample follows for testing (optional)
-- These will be removed in production
INSERT INTO user_follows (user_id, followed_type, followed_id) VALUES
    ('demo_user', 'artist', 'artist_1'),
    ('demo_user', 'artist', 'artist_2')
ON CONFLICT (user_id, followed_type, followed_id) DO NOTHING;
