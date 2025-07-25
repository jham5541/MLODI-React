-- Create fan engagement and gamification tables
-- This migration creates tables for fan tiers, achievements, challenges, and analytics

-- Fan tiers and progress
CREATE TABLE fan_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    tier TEXT CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum')) DEFAULT 'Bronze',
    points INTEGER DEFAULT 0,
    total_listening_time_ms BIGINT DEFAULT 0,
    songs_liked INTEGER DEFAULT 0,
    playlists_created INTEGER DEFAULT 0,
    concerts_attended INTEGER DEFAULT 0,
    merchandise_purchased INTEGER DEFAULT 0,
    friends_referred INTEGER DEFAULT 0,
    community_interactions INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    tier_upgraded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

-- Achievements system
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT CHECK (category IN ('listening', 'social', 'engagement', 'loyalty', 'creative')) NOT NULL,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    points_awarded INTEGER DEFAULT 0,
    unlock_criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (earned achievements)
CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    progress_data JSONB DEFAULT '{}',
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id, artist_id)
);

-- Challenges system
CREATE TABLE challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT CHECK (category IN ('listening', 'social', 'engagement', 'creative')) NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')) DEFAULT 'easy',
    challenge_type TEXT CHECK (challenge_type IN ('daily', 'weekly', 'special', 'seasonal')) DEFAULT 'daily',
    target_value INTEGER NOT NULL,
    points_reward INTEGER NOT NULL,
    badge_reward TEXT,
    unlock_level INTEGER DEFAULT 1,
    requirements JSONB NOT NULL DEFAULT '[]',
    tips JSONB DEFAULT '[]',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE user_challenge_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_data JSONB DEFAULT '{}',
    UNIQUE(user_id, challenge_id, artist_id)
);

-- Milestones system
CREATE TABLE milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT CHECK (category IN ('listening', 'social', 'engagement', 'loyalty')) NOT NULL,
    required_points INTEGER NOT NULL,
    reward TEXT NOT NULL,
    points_awarded INTEGER NOT NULL,
    unlock_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User milestone progress
CREATE TABLE user_milestone_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    reward_claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, milestone_id, artist_id)
);

-- User analytics and insights
CREATE TABLE user_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Listening metrics
    total_listening_time_ms BIGINT DEFAULT 0,
    songs_played INTEGER DEFAULT 0,
    unique_artists INTEGER DEFAULT 0,
    unique_genres INTEGER DEFAULT 0,
    skip_rate DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    -- Social metrics
    songs_shared INTEGER DEFAULT 0,
    playlists_created INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,
    -- Engagement metrics
    challenges_completed INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    fan_points_earned INTEGER DEFAULT 0,
    -- Top content
    top_genre TEXT,
    top_artist_id UUID REFERENCES artists(id),
    top_song_id UUID REFERENCES songs(id),
    listening_mood TEXT,
    most_active_hour INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Artist analytics
CREATE TABLE artist_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Play metrics
    total_plays INTEGER DEFAULT 0,
    unique_listeners INTEGER DEFAULT 0,
    total_listening_time_ms BIGINT DEFAULT 0,
    skip_rate DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    -- Fan metrics
    new_followers INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    fan_tier_distribution JSONB DEFAULT '{}',
    average_fan_points DECIMAL(10,2) DEFAULT 0,
    -- Social metrics
    songs_shared INTEGER DEFAULT 0,
    playlist_additions INTEGER DEFAULT 0,
    comments_received INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    -- Revenue metrics
    revenue_generated DECIMAL(20,8) DEFAULT 0,
    nft_sales INTEGER DEFAULT 0,
    merchandise_sales INTEGER DEFAULT 0,
    -- Geographic data
    top_countries JSONB DEFAULT '[]',
    top_cities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(artist_id, date)
);

-- NFT marketplace tables
CREATE TABLE nft_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    contract_address TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    total_supply INTEGER NOT NULL,
    floor_price DECIMAL(20,8) DEFAULT 0,
    volume_traded DECIMAL(20,8) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE nft_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token_id TEXT NOT NULL,
    collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
    price DECIMAL(20,8) NOT NULL,
    currency TEXT DEFAULT 'ETH',
    is_auction BOOLEAN DEFAULT FALSE,
    auction_end_time TIMESTAMP WITH TIME ZONE,
    highest_bid DECIMAL(20,8) DEFAULT 0,
    highest_bidder_id UUID REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('active', 'sold', 'cancelled', 'expired')) DEFAULT 'active',
    metadata_uri TEXT,
    rarity_rank INTEGER,
    traits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE nft_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES nft_listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    price DECIMAL(20,8) NOT NULL,
    currency TEXT DEFAULT 'ETH',
    transaction_hash TEXT,
    gas_fee DECIMAL(20,8) DEFAULT 0,
    marketplace_fee DECIMAL(20,8) DEFAULT 0,
    royalty_fee DECIMAL(20,8) DEFAULT 0,
    transaction_type TEXT CHECK (transaction_type IN ('sale', 'mint', 'transfer')) DEFAULT 'sale',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace stats (aggregated data)
CREATE TABLE marketplace_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    total_volume DECIMAL(20,8) DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    unique_buyers INTEGER DEFAULT 0,
    unique_sellers INTEGER DEFAULT 0,
    average_price DECIMAL(20,8) DEFAULT 0,
    floor_price DECIMAL(20,8) DEFAULT 0,
    top_collection_id UUID REFERENCES nft_collections(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Create indexes for fan engagement tables
CREATE INDEX idx_fan_tiers_user_artist ON fan_tiers(user_id, artist_id);
CREATE INDEX idx_fan_tiers_tier ON fan_tiers(tier);
CREATE INDEX idx_fan_tiers_points ON fan_tiers(points DESC);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_artist_id ON user_achievements(artist_id);
CREATE INDEX idx_user_challenge_progress_user_id ON user_challenge_progress(user_id);
CREATE INDEX idx_user_challenge_progress_challenge_id ON user_challenge_progress(challenge_id);
CREATE INDEX idx_user_analytics_user_date ON user_analytics(user_id, date DESC);
CREATE INDEX idx_artist_analytics_artist_date ON artist_analytics(artist_id, date DESC);
CREATE INDEX idx_nft_listings_collection_id ON nft_listings(collection_id);
CREATE INDEX idx_nft_listings_seller_id ON nft_listings(seller_id);
CREATE INDEX idx_nft_listings_status ON nft_listings(status);
CREATE INDEX idx_nft_listings_price ON nft_listings(price);
CREATE INDEX idx_nft_transactions_listing_id ON nft_transactions(listing_id);
CREATE INDEX idx_marketplace_stats_date ON marketplace_stats(date DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_fan_tiers_updated_at BEFORE UPDATE ON fan_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nft_collections_updated_at BEFORE UPDATE ON nft_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nft_listings_updated_at BEFORE UPDATE ON nft_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();