-- Create missing tables that are referenced in the codebase but not in existing migrations

-- Create fan_scores table (referenced in services/fanScoringService.ts)
CREATE TABLE IF NOT EXISTS fan_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Bronze',
    total_points INTEGER DEFAULT 0,
    listening_points INTEGER DEFAULT 0,
    engagement_points INTEGER DEFAULT 0,
    purchase_points INTEGER DEFAULT 0,
    referral_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

-- Create engagements table (referenced in services/databaseService.ts)
CREATE TABLE IF NOT EXISTS engagements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    engagement_type TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table as an alias/view for auth.users with additional profile data
-- This is referenced in many services but auth.users is the actual table
CREATE OR REPLACE VIEW users AS
SELECT 
    au.id,
    au.email,
    COALESCE(up.username, au.email) as username,
    COALESCE(up.display_name, split_part(au.email, '@', 1)) as display_name,
    up.bio,
    up.avatar_url,
    up.cover_url,
    up.location,
    up.website_url,
    up.social_links,
    up.preferences,
    up.subscription_tier,
    up.subscription_expires_at,
    up.total_listening_time_ms,
    au.created_at,
    up.updated_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fan_scores_user_id ON fan_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_scores_artist_id ON fan_scores(artist_id);
CREATE INDEX IF NOT EXISTS idx_fan_scores_score ON fan_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_engagements_user_id ON engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_artist_id ON engagements(artist_id);
CREATE INDEX IF NOT EXISTS idx_engagements_type ON engagements(engagement_type);
CREATE INDEX IF NOT EXISTS idx_engagements_created_at ON engagements(created_at DESC);

-- Create trigger for updating fan_scores updated_at
CREATE TRIGGER update_fan_scores_updated_at 
    BEFORE UPDATE ON fan_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON users TO anon, authenticated;
GRANT ALL ON fan_scores TO authenticated;
GRANT ALL ON engagements TO authenticated;

-- Create RLS policies for fan_scores
ALTER TABLE fan_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all fan scores" ON fan_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own fan scores" ON fan_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fan scores" ON fan_scores
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for engagements
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all engagements" ON engagements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own engagements" ON engagements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engagements" ON engagements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own engagements" ON engagements
    FOR DELETE USING (auth.uid() = user_id);

-- Create nft_drops table (referenced in edge functions)
CREATE TABLE IF NOT EXISTS nft_drops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    drop_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    supply INTEGER NOT NULL DEFAULT 0,
    minted INTEGER DEFAULT 0,
    cover_image TEXT,
    contract_address TEXT,
    metadata_uri TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drop_notifications table for user notifications
CREATE TABLE IF NOT EXISTS drop_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    drop_id UUID REFERENCES nft_drops(id) ON DELETE CASCADE,
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, drop_id)
);

-- Create indexes for NFT drops
CREATE INDEX IF NOT EXISTS idx_nft_drops_artist_id ON nft_drops(artist_id);
CREATE INDEX IF NOT EXISTS idx_nft_drops_drop_date ON nft_drops(drop_date);
CREATE INDEX IF NOT EXISTS idx_nft_drops_end_date ON nft_drops(end_date);
CREATE INDEX IF NOT EXISTS idx_nft_drops_active ON nft_drops(is_active);
CREATE INDEX IF NOT EXISTS idx_drop_notifications_user_id ON drop_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_drop_notifications_drop_id ON drop_notifications(drop_id);

-- Create trigger for updating nft_drops updated_at
CREATE TRIGGER update_nft_drops_updated_at 
    BEFORE UPDATE ON nft_drops 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for nft_drops
ALTER TABLE nft_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active drops" ON nft_drops
    FOR SELECT USING (is_active = true);

CREATE POLICY "Artists can create their own drops" ON nft_drops
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artists 
            WHERE artists.id = artist_id 
            AND artists.user_id = auth.uid()
        )
    );

CREATE POLICY "Artists can update their own drops" ON nft_drops
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM artists 
            WHERE artists.id = artist_id 
            AND artists.user_id = auth.uid()
        )
    );

-- Create RLS policies for drop_notifications
ALTER TABLE drop_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON drop_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" ON drop_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON drop_notifications
    FOR DELETE USING (auth.uid() = user_id);
