-- Safe fix for the users table constraint issue
-- This script checks for column existence before making changes

-- First, let's see what columns actually exist in the users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create a function to safely alter columns
CREATE OR REPLACE FUNCTION safe_alter_column(
    p_table_name TEXT,
    p_column_name TEXT,
    p_action TEXT
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = p_table_name 
        AND column_name = p_column_name
        AND table_schema = 'public'
    ) THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I %s', p_table_name, p_column_name, p_action);
        RAISE NOTICE 'Column %.% altered successfully', p_table_name, p_column_name;
    ELSE
        RAISE NOTICE 'Column %.% does not exist, skipping', p_table_name, p_column_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error altering %.%: %', p_table_name, p_column_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Now safely make columns nullable
SELECT safe_alter_column('users', 'address', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'username', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'display_name', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'bio', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'avatar_url', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'cover_url', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'location', 'DROP NOT NULL');
SELECT safe_alter_column('users', 'website_url', 'DROP NOT NULL');

-- Set defaults for columns that exist
SELECT safe_alter_column('users', 'social_links', 'SET DEFAULT ''{}''');
SELECT safe_alter_column('users', 'preferences', 'SET DEFAULT ''{}''');
SELECT safe_alter_column('users', 'subscription_tier', 'SET DEFAULT ''free''');
SELECT safe_alter_column('users', 'total_listening_time_ms', 'SET DEFAULT 0');
SELECT safe_alter_column('users', 'created_at', 'SET DEFAULT NOW()');
SELECT safe_alter_column('users', 'updated_at', 'SET DEFAULT NOW()');

-- Drop the temporary function
DROP FUNCTION IF EXISTS safe_alter_column(TEXT, TEXT, TEXT);

-- Show the final table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
