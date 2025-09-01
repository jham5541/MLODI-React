-- Examples for updating artist avatar URLs in the database

-- 1. Update a specific artist's avatar by ID
UPDATE artists 
SET avatar_url = 'https://your-cdn.com/path/to/avatar-image.jpg',
    updated_at = NOW()
WHERE id = 'artist-uuid-here';

-- 2. Update a specific artist's avatar by name
UPDATE artists 
SET avatar_url = 'https://your-cdn.com/path/to/avatar-image.jpg',
    updated_at = NOW()
WHERE name = 'Artist Name';

-- 3. Set avatar URLs from Supabase storage (recommended approach)
-- First upload the avatar to Supabase storage, then update the URL
UPDATE artists 
SET avatar_url = 'https://your-project.supabase.co/storage/v1/object/public/user_profiles/artist-id/avatar.jpg',
    updated_at = NOW()
WHERE id = 'artist-uuid-here';

-- 4. Clear an avatar URL (will show initial placeholder in app)
UPDATE artists 
SET avatar_url = NULL,
    updated_at = NOW()
WHERE id = 'artist-uuid-here';

-- 5. Query to check current avatar URLs
SELECT id, name, display_name, avatar_url 
FROM artists 
WHERE avatar_url IS NOT NULL
ORDER BY updated_at DESC;

-- Note: Avatar images should ideally be square and at least 300x300px for best display quality
