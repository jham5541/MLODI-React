-- Quick fix for the users table constraint issue
-- Run this in your Supabase SQL Editor

-- Check if the address column exists and make it nullable
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ALTER COLUMN address DROP NOT NULL;
        RAISE NOTICE 'Made address column nullable';
    END IF;
END $$;

-- Make other columns nullable to prevent similar issues
ALTER TABLE users 
    ALTER COLUMN username DROP NOT NULL,
    ALTER COLUMN display_name DROP NOT NULL,
    ALTER COLUMN bio DROP NOT NULL,
    ALTER COLUMN avatar_url DROP NOT NULL,
    ALTER COLUMN cover_url DROP NOT NULL,
    ALTER COLUMN location DROP NOT NULL,
    ALTER COLUMN website_url DROP NOT NULL;

-- Set proper defaults
ALTER TABLE users 
    ALTER COLUMN social_links SET DEFAULT '{}',
    ALTER COLUMN preferences SET DEFAULT '{}',
    ALTER COLUMN subscription_tier SET DEFAULT 'free',
    ALTER COLUMN total_listening_time_ms SET DEFAULT 0,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Verify the changes
SELECT 
    column_name, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
