-- Add user_id column to artists table to link artists with auth users
-- This is needed for RLS policies and artist account management

-- Add user_id column to artists table if it doesn't exist
ALTER TABLE artists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);

-- Make user_id unique to ensure one artist profile per user
ALTER TABLE artists ADD CONSTRAINT unique_artist_user_id UNIQUE (user_id);

-- Update existing RLS policies for artists table
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public artists are viewable by everyone" ON artists;
DROP POLICY IF EXISTS "Artists can update their own profile" ON artists;
DROP POLICY IF EXISTS "Artists can insert their own profile" ON artists;

-- Create new RLS policies
CREATE POLICY "Public artists are viewable by everyone" ON artists
    FOR SELECT USING (true);

CREATE POLICY "Users can create their artist profile" ON artists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artists can update their own profile" ON artists
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON artists TO authenticated;
GRANT SELECT ON artists TO anon;
