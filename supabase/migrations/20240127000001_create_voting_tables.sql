-- Create voting system tables
-- This migration creates tables for polls, poll options, and user votes

-- Polls table
CREATE TABLE polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('music', 'artist', 'genre', 'general')) DEFAULT 'general',
    poll_type TEXT CHECK (poll_type IN ('multiple_choice', 'single_choice', 'rating')) DEFAULT 'single_choice',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_votes INTEGER DEFAULT 0,
    max_votes_per_user INTEGER DEFAULT 1,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options table
CREATE TABLE poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, position)
);

-- User votes table
CREATE TABLE poll_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- For anonymous voting
    anonymous_id TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- For rating polls
    comment TEXT,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate votes
    UNIQUE(poll_id, user_id),
    UNIQUE(poll_id, anonymous_id),
    -- Ensure either user_id or anonymous_id is provided
    CHECK ((user_id IS NOT NULL AND anonymous_id IS NULL) OR (user_id IS NULL AND anonymous_id IS NOT NULL))
);

-- Poll analytics table for insights
CREATE TABLE poll_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    anonymous_votes INTEGER DEFAULT 0,
    registered_votes INTEGER DEFAULT 0,
    demographic_data JSONB DEFAULT '{}',
    geographic_data JSONB DEFAULT '{}',
    device_data JSONB DEFAULT '{}',
    hourly_votes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_polls_active ON polls(is_active);
CREATE INDEX idx_polls_featured ON polls(is_featured);
CREATE INDEX idx_polls_category ON polls(category);
CREATE INDEX idx_polls_dates ON polls(start_date, end_date);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_position ON poll_options(poll_id, position);
CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX idx_poll_votes_voted_at ON poll_votes(voted_at DESC);
CREATE INDEX idx_poll_analytics_poll_date ON poll_analytics(poll_id, date DESC);

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update option vote count
    IF TG_OP = 'INSERT' THEN
        UPDATE poll_options 
        SET vote_count = vote_count + 1 
        WHERE id = NEW.option_id;
        
        UPDATE polls 
        SET total_votes = total_votes + 1 
        WHERE id = NEW.poll_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE poll_options 
        SET vote_count = vote_count - 1 
        WHERE id = OLD.option_id;
        
        UPDATE polls 
        SET total_votes = total_votes - 1 
        WHERE id = OLD.poll_id;
        
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If option changed, update both old and new
        IF OLD.option_id != NEW.option_id THEN
            UPDATE poll_options 
            SET vote_count = vote_count - 1 
            WHERE id = OLD.option_id;
            
            UPDATE poll_options 
            SET vote_count = vote_count + 1 
            WHERE id = NEW.option_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for vote counting
CREATE TRIGGER update_poll_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON poll_votes
    FOR EACH ROW EXECUTE FUNCTION update_poll_vote_counts();

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON polls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get poll results with percentages
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE (
    option_id UUID,
    option_text TEXT,
    vote_count INTEGER,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        po.id,
        po.text,
        po.vote_count,
        CASE 
            WHEN p.total_votes > 0 THEN ROUND((po.vote_count::DECIMAL / p.total_votes::DECIMAL) * 100, 2)
            ELSE 0::DECIMAL(5,2)
        END as percentage
    FROM poll_options po
    JOIN polls p ON po.poll_id = p.id
    WHERE po.poll_id = poll_uuid
    ORDER BY po.position ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can vote
CREATE OR REPLACE FUNCTION can_user_vote(poll_uuid UUID, user_uuid UUID DEFAULT NULL, anon_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    poll_record RECORD;
    existing_votes INTEGER;
BEGIN
    -- Get poll information
    SELECT * INTO poll_record FROM polls WHERE id = poll_uuid;
    
    -- Check if poll exists and is active
    IF NOT FOUND OR NOT poll_record.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Check if poll has ended
    IF poll_record.end_date IS NOT NULL AND poll_record.end_date < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Check if poll hasn't started yet
    IF poll_record.start_date > NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Count existing votes
    IF user_uuid IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_votes 
        FROM poll_votes 
        WHERE poll_id = poll_uuid AND user_id = user_uuid;
    ELSIF anon_id IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_votes 
        FROM poll_votes 
        WHERE poll_id = poll_uuid AND anonymous_id = anon_id;
    ELSE
        RETURN FALSE;
    END IF;
    
    -- Check if user has exceeded vote limit
    IF existing_votes >= poll_record.max_votes_per_user THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
