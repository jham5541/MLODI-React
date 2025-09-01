-- Examples for updating artist banner URLs in the database

-- 1. Update a specific artist's banner by ID
UPDATE artists 
SET banner_url = 'https://your-cdn.com/path/to/banner-image.jpg',
    updated_at = NOW()
WHERE id = 'artist-uuid-here';

-- 2. Update a specific artist's banner by name
UPDATE artists 
SET banner_url = 'https://your-cdn.com/path/to/banner-image.jpg',
    updated_at = NOW()
WHERE name = 'Artist Name';

-- 3. Update multiple artists with different banners
UPDATE artists 
SET banner_url = CASE 
    WHEN name = 'Artist 1' THEN 'https://cdn.com/artist1-banner.jpg'
    WHEN name = 'Artist 2' THEN 'https://cdn.com/artist2-banner.jpg'
    WHEN name = 'Artist 3' THEN 'https://cdn.com/artist3-banner.gif'
    ELSE banner_url  -- Keep existing banner for others
END,
updated_at = NOW()
WHERE name IN ('Artist 1', 'Artist 2', 'Artist 3');

-- 4. Set banner URLs from Supabase storage (recommended approach)
-- First upload the banner to Supabase storage, then update the URL
UPDATE artists 
SET banner_url = 'https://your-project.supabase.co/storage/v1/object/public/showcase/artist-id/showcase.jpg',
    updated_at = NOW()
WHERE id = 'artist-uuid-here';

-- 5. Clear a banner URL (will show default in app)
UPDATE artists 
SET banner_url = NULL,
    updated_at = NOW()
WHERE id = 'artist-uuid-here';

-- 6. Batch update all artists without banners to use a default
UPDATE artists 
SET banner_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    updated_at = NOW()
WHERE banner_url IS NULL OR banner_url = '';

-- 7. Query to check current banner URLs
SELECT id, name, display_name, banner_url 
FROM artists 
ORDER BY updated_at DESC;

-- Note: The app supports image files (.jpg, .png), GIFs (.gif), and videos (.mp4, .mov, etc.)
-- Videos will autoplay and loop in the artist header
