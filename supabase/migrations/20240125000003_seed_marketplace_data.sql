-- Seed marketplace data for M3lodi
-- This migration adds sample products and categories

-- Insert product categories
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
('Electronic Music', 'electronic', 'Electronic and digital music products', 1),
('Physical Media', 'physical-media', 'Vinyl, CDs, and other physical music formats', 2),
('Merchandise', 'merchandise', 'Artist merchandise and branded items', 3),
('Clothing', 'clothing', 'T-shirts, hoodies, and apparel', 4),
('Accessories', 'accessories', 'Bags, mugs, and other accessories', 5),
('Collectibles', 'collectibles', 'Limited edition and collectible items', 6),
('Videos', 'videos', 'Music videos and video content', 7);

-- Get artist IDs for sample data (assuming they exist from previous migrations)
-- We'll create sample products for existing artists or create new ones

-- First, let's ensure we have some sample artists
INSERT INTO artists (name, bio, avatar_url, cover_url, genres, is_verified) VALUES
('Luna Nova', 'Electronic music producer specializing in ambient and synthwave sounds', 'https://picsum.photos/200/200?random=1', 'https://picsum.photos/800/400?random=1', ARRAY['Electronic', 'Ambient', 'Synthwave'], true),
('Cyber Punk', 'Retro-futuristic synthwave artist', 'https://picsum.photos/200/200?random=2', 'https://picsum.photos/800/400?random=2', ARRAY['Synthwave', 'Cyberpunk', 'Retro'], true),
('Acoustic Soul', 'Blues and acoustic music with soulful expression', 'https://picsum.photos/200/200?random=3', 'https://picsum.photos/800/400?random=3', ARRAY['Blues', 'Acoustic', 'Soul'], false)
ON CONFLICT (name) DO NOTHING;

-- Create some sample albums first
INSERT INTO albums (title, artist_id, description, cover_url, release_date, album_type, total_tracks, duration_ms) VALUES
('Midnight Echoes', (SELECT id FROM artists WHERE name = 'Luna Nova'), 'A journey through electronic soundscapes', 'https://picsum.photos/400/400?random=10', '2024-01-15', 'album', 10, 2840000),
('Retro Future', (SELECT id FROM artists WHERE name = 'Cyber Punk'), 'The definitive synthwave experience', 'https://picsum.photos/400/400?random=11', '2024-01-10', 'album', 12, 3120000),
('Coffee Shop Sessions', (SELECT id FROM artists WHERE name = 'Acoustic Soul'), 'Intimate acoustic performances', 'https://picsum.photos/400/400?random=12', '2024-01-08', 'ep', 6, 1440000)
ON CONFLICT DO NOTHING;

-- Create some sample songs
INSERT INTO songs (title, artist_id, album_id, audio_url, cover_url, duration_ms, genre, is_public, play_count) VALUES
('Electric Dreams', (SELECT id FROM artists WHERE name = 'Luna Nova'), (SELECT id FROM albums WHERE title = 'Midnight Echoes'), 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/300/300?random=1', 214000, 'Electronic', true, 1250),
('Neon Nights', (SELECT id FROM artists WHERE name = 'Cyber Punk'), (SELECT id FROM albums WHERE title = 'Retro Future'), 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/300/300?random=2', 198000, 'Synthwave', true, 2100),
('Coffee Shop Blues', (SELECT id FROM artists WHERE name = 'Acoustic Soul'), (SELECT id FROM albums WHERE title = 'Coffee Shop Sessions'), 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/300/300?random=3', 267000, 'Blues', true, 850),
('Digital Horizon', (SELECT id FROM artists WHERE name = 'Luna Nova'), (SELECT id FROM albums WHERE title = 'Midnight Echoes'), 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/300/300?random=4', 189000, 'Electronic', true, 950),
('Synthwave City', (SELECT id FROM artists WHERE name = 'Cyber Punk'), (SELECT id FROM albums WHERE title = 'Retro Future'), 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/300/300?random=5', 223000, 'Synthwave', true, 1800)
ON CONFLICT DO NOTHING;

-- Insert sample products

-- Song products
INSERT INTO products (title, description, type, artist_id, song_id, price, original_price, audio_url, preview_url, duration_ms, cover_url, tags, genre, is_active, is_featured, is_on_sale) VALUES
('Electric Dreams', 'A captivating electronic track that takes you on a journey through digital landscapes', 'song', 
    (SELECT id FROM artists WHERE name = 'Luna Nova'), 
    (SELECT id FROM songs WHERE title = 'Electric Dreams'), 
    1.99, NULL, 
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    214000, 'https://picsum.photos/300/300?random=1', 
    ARRAY['synthwave', 'ambient', 'dreamy'], 'Electronic', true, false, false),

('Neon Nights', 'High-energy synthwave anthem perfect for late-night drives', 'song', 
    (SELECT id FROM artists WHERE name = 'Cyber Punk'), 
    (SELECT id FROM songs WHERE title = 'Neon Nights'), 
    2.49, 2.99, 
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    198000, 'https://picsum.photos/300/300?random=2', 
    ARRAY['80s', 'cyberpunk', 'energetic'], 'Synthwave', true, true, true),

('Coffee Shop Blues', 'Smooth acoustic blues with soulful lyrics about everyday life', 'song', 
    (SELECT id FROM artists WHERE name = 'Acoustic Soul'), 
    (SELECT id FROM songs WHERE title = 'Coffee Shop Blues'), 
    1.49, NULL, 
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    267000, 'https://picsum.photos/300/300?random=3', 
    ARRAY['chill', 'acoustic', 'soulful'], 'Blues', true, false, false);

-- Album products
INSERT INTO products (title, description, type, artist_id, album_id, price, cover_url, tags, genre, is_active, is_featured) VALUES
('Midnight Echoes', 'A complete journey through electronic soundscapes and ambient textures', 'album', 
    (SELECT id FROM artists WHERE name = 'Luna Nova'), 
    (SELECT id FROM albums WHERE title = 'Midnight Echoes'), 
    12.99, 'https://picsum.photos/400/400?random=10', 
    ARRAY['full-album', 'electronic', 'atmospheric'], 'Electronic', true, true),

('Retro Future', 'The definitive synthwave album that captures the essence of the 80s future', 'album', 
    (SELECT id FROM artists WHERE name = 'Cyber Punk'), 
    (SELECT id FROM albums WHERE title = 'Retro Future'), 
    15.99, 'https://picsum.photos/400/400?random=11', 
    ARRAY['synthwave', '80s', 'cyberpunk'], 'Synthwave', true, false);

-- Video products
INSERT INTO products (title, description, type, artist_id, price, video_url, preview_url, duration_ms, quality, cover_url, tags, genre, is_active, is_featured) VALUES
('Electric Dreams - Official Music Video', 'Official music video featuring stunning visual effects and neon aesthetics', 'video', 
    (SELECT id FROM artists WHERE name = 'Luna Nova'), 
    3.99, 
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    214000, 'FHD', 'https://picsum.photos/640/360?random=20', 
    ARRAY['official', 'hd', 'visual-effects'], 'Electronic', true, false),

('Behind the Scenes: Making of Retro Future', 'Exclusive behind-the-scenes footage of the album creation process', 'video', 
    (SELECT id FROM artists WHERE name = 'Cyber Punk'), 
    4.99, 
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    1820000, 'HD', 'https://picsum.photos/640/360?random=21', 
    ARRAY['exclusive', 'documentary', 'album-making'], 'Documentary', true, true);

-- Merchandise products
INSERT INTO products (title, description, type, artist_id, price, category_id, weight_grams, dimensions_json, shipping_required, cover_url, images, tags, stock_quantity, track_inventory, is_active, is_featured) VALUES
('Luna Nova Tour T-Shirt', 'Official tour merchandise featuring the iconic Luna Nova logo', 'merch', 
    (SELECT id FROM artists WHERE name = 'Luna Nova'), 
    24.99, 
    (SELECT id FROM product_categories WHERE slug = 'clothing'), 
    200, '{"length": 25, "width": 20, "height": 2}', true, 
    'https://picsum.photos/400/400?random=30', 
    '["https://picsum.photos/400/400?random=30", "https://picsum.photos/400/400?random=31", "https://picsum.photos/400/400?random=32"]',
    ARRAY['t-shirt', 'tour', 'official'], 100, true, true, false),

('Cyber Punk Vinyl Collection', 'High-quality vinyl pressing of the complete Retro Future album', 'merch', 
    (SELECT id FROM artists WHERE name = 'Cyber Punk'), 
    34.99, 
    (SELECT id FROM product_categories WHERE slug = 'physical-media'), 
    500, '{"length": 32, "width": 32, "height": 3}', true, 
    'https://picsum.photos/400/400?random=40', 
    '["https://picsum.photos/400/400?random=40", "https://picsum.photos/400/400?random=41"]',
    ARRAY['vinyl', 'collectible', 'album'], 55, true, true, true),

('Acoustic Soul Coffee Mug', 'Perfect mug for enjoying your morning coffee while listening to blues', 'merch', 
    (SELECT id FROM artists WHERE name = 'Acoustic Soul'), 
    14.99, 
    (SELECT id FROM product_categories WHERE slug = 'accessories'), 
    400, '{"length": 12, "width": 12, "height": 10}', true, 
    'https://picsum.photos/400/400?random=50', 
    '["https://picsum.photos/400/400?random=50"]',
    ARRAY['mug', 'coffee', 'ceramic'], 30, true, true, false);

-- Insert product variants for merchandise
INSERT INTO product_variants (product_id, name, sku, price, stock_quantity, attributes, sort_order) VALUES
-- Luna Nova T-Shirt variants
((SELECT id FROM products WHERE title = 'Luna Nova Tour T-Shirt'), 'Small Black', 'LN-TOUR-S-BK', 24.99, 15, '{"size": "S", "color": "Black"}', 1),
((SELECT id FROM products WHERE title = 'Luna Nova Tour T-Shirt'), 'Medium Black', 'LN-TOUR-M-BK', 24.99, 22, '{"size": "M", "color": "Black"}', 2),
((SELECT id FROM products WHERE title = 'Luna Nova Tour T-Shirt'), 'Large Black', 'LN-TOUR-L-BK', 24.99, 18, '{"size": "L", "color": "Black"}', 3),
((SELECT id FROM products WHERE title = 'Luna Nova Tour T-Shirt'), 'Small White', 'LN-TOUR-S-WH', 24.99, 12, '{"size": "S", "color": "White"}', 4),
((SELECT id FROM products WHERE title = 'Luna Nova Tour T-Shirt'), 'Medium White', 'LN-TOUR-M-WH', 24.99, 20, '{"size": "M", "color": "White"}', 5),
((SELECT id FROM products WHERE title = 'Luna Nova Tour T-Shirt'), 'Large White', 'LN-TOUR-L-WH', 24.99, 18, '{"size": "L", "color": "White"}', 6),

-- Cyber Punk Vinyl variants
((SELECT id FROM products WHERE title = 'Cyber Punk Vinyl Collection'), 'Limited Edition Purple', 'CP-VINYL-LTD-PUR', 39.99, 5, '{"color": "Purple", "edition": "Limited"}', 1),
((SELECT id FROM products WHERE title = 'Cyber Punk Vinyl Collection'), 'Standard Black', 'CP-VINYL-STD-BK', 34.99, 50, '{"color": "Black", "edition": "Standard"}', 2),

-- Coffee Mug variants
((SELECT id FROM products WHERE title = 'Acoustic Soul Coffee Mug'), 'White Ceramic', 'AS-MUG-CER-WH', 14.99, 30, '{"material": "Ceramic", "color": "White"}', 1);

-- Update the product stock quantities based on variants
UPDATE products 
SET stock_quantity = (
    SELECT SUM(stock_quantity) 
    FROM product_variants 
    WHERE product_id = products.id
)
WHERE type = 'merch' AND track_inventory = true;