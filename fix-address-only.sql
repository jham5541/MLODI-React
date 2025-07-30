-- Minimal fix for the address constraint issue
-- First check what columns exist in the users table

-- Show current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Fix only the address constraint if it exists
DO $$ 
BEGIN
    -- Check if address column exists and make it nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'address'
        AND table_schema = 'public'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN address DROP NOT NULL;
        RAISE NOTICE 'Made address column nullable';
    ELSE
        RAISE NOTICE 'Address column does not exist or is already nullable';
    END IF;
    
    -- Also check and fix other common required fields
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'username'
        AND table_schema = 'public'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
        RAISE NOTICE 'Made username column nullable';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'display_name'
        AND table_schema = 'public'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;
        RAISE NOTICE 'Made display_name column nullable';
    END IF;
END $$;
