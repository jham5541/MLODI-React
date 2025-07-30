-- Fix users table constraints - make address nullable
ALTER TABLE users 
ALTER COLUMN address DROP NOT NULL;

-- Also ensure other fields that might cause issues are nullable
ALTER TABLE users 
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN display_name DROP NOT NULL,
ALTER COLUMN bio DROP NOT NULL,
ALTER COLUMN avatar_url DROP NOT NULL,
ALTER COLUMN cover_url DROP NOT NULL,
ALTER COLUMN location DROP NOT NULL,
ALTER COLUMN website_url DROP NOT NULL,
ALTER COLUMN social_links DROP NOT NULL,
ALTER COLUMN preferences DROP NOT NULL,
ALTER COLUMN total_listening_time_ms DROP NOT NULL;

-- Add default values for some fields
ALTER TABLE users 
ALTER COLUMN subscription_tier SET DEFAULT 'free',
ALTER COLUMN total_listening_time_ms SET DEFAULT 0,
ALTER COLUMN social_links SET DEFAULT '{}',
ALTER COLUMN preferences SET DEFAULT '{}';

-- Ensure timestamps have defaults
ALTER TABLE users 
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
