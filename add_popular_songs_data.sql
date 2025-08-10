-- Add sample popular songs data to the database
-- This script adds artists as profiles and then their tracks

-- First, let's create some sample artist profiles
-- We'll use generated UUIDs for consistency
DO $$
DECLARE
    artist1_id uuid := '550e8400-e29b-41d4-a716-446655440001';
    artist2_id uuid := '550e8400-e29b-41d4-a716-446655440002';
    artist3_id uuid := '550e8400-e29b-41d4-a716-446655440003';
    artist4_id uuid := '550e8400-e29b-41d4-a716-446655440004';
    artist5_id uuid := '550e8400-e29b-41d4-a716-446655440005';
BEGIN
    -- Insert artist profiles
    INSERT INTO public.profiles (id, username, display_name, avatar_url, onboarding_completed, created_at)
    VALUES 
        (artist1_id, 'lunaeclipse', 'Luna Eclipse', 'https://picsum.photos/300/300?random=1', true, now()),
        (artist2_id, 'neonpulse', 'Neon Pulse', 'https://picsum.photos/300/300?random=2', true, now()),
        (artist3_id, 'cosmicwaves', 'Cosmic Waves', 'https://picsum.photos/300/300?random=3', true, now()),
        (artist4_id, 'digitaldreams', 'Digital Dreams', 'https://picsum.photos/300/300?random=4', true, now()),
        (artist5_id, 'aurorasynthetics', 'Aurora Synthetics', 'https://picsum.photos/300/300?random=5', true, now())
    ON CONFLICT (id) DO NOTHING;

    -- Insert user settings for artists
    INSERT INTO public.user_settings (user_id)
    VALUES 
        (artist1_id),
        (artist2_id),
        (artist3_id),
        (artist4_id),
        (artist5_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert popular tracks
    INSERT INTO public.tracks (id, artist_id, title, description, duration, audio_url, cover_url, created_at)
    VALUES
        -- Luna Eclipse tracks
        ('770e8400-e29b-41d4-a716-446655440001', artist1_id, 'Midnight Synthesis', 
         'A dark electronic journey through synthetic soundscapes', 300, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=21', now() - interval '30 days'),
        
        ('770e8400-e29b-41d4-a716-446655440002', artist1_id, 'Solar Flare', 
         'High-energy electronic track with cosmic vibes', 285, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=22', now() - interval '25 days'),
        
        ('770e8400-e29b-41d4-a716-446655440007', artist1_id, 'Digital Horizon', 
         'Ambient electronic exploration of digital landscapes', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=27', now() - interval '20 days'),

        -- Neon Pulse tracks
        ('770e8400-e29b-41d4-a716-446655440003', artist2_id, 'Bass Drop Phenomenon', 
         'Future bass anthem with massive drops', 320, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=23', now() - interval '28 days'),
        
        ('770e8400-e29b-41d4-a716-446655440008', artist2_id, 'Neon Dreams', 
         'Melodic dubstep journey through neon-lit cityscapes', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=28', now() - interval '15 days'),

        -- Cosmic Waves tracks
        ('770e8400-e29b-41d4-a716-446655440004', artist3_id, 'Ethereal Drift', 
         'Peaceful ambient soundscape for meditation and focus', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=24', now() - interval '22 days'),
        
        ('770e8400-e29b-41d4-a716-446655440009', artist3_id, 'Celestial Journey', 
         'Ambient exploration through cosmic realms', 480, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=29', now() - interval '10 days'),

        -- Digital Dreams tracks
        ('770e8400-e29b-41d4-a716-446655440005', artist4_id, 'Lo-fi Memories', 
         'Nostalgic lo-fi hip hop beats for studying and relaxation', 275, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=25', now() - interval '18 days'),
        
        ('770e8400-e29b-41d4-a716-446655440010', artist4_id, 'Rainy Day Beats', 
         'Chill lo-fi beats perfect for a rainy afternoon', 260, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=30', now() - interval '5 days'),
        
        ('770e8400-e29b-41d4-a716-446655440011', artist4_id, 'Coffee Shop Vibes', 
         'Warm lo-fi beats for your morning coffee', 240, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=31', now() - interval '3 days'),

        -- Aurora Synthetics tracks
        ('770e8400-e29b-41d4-a716-446655440006', artist5_id, 'Neon Highway', 
         'Synthwave anthem for late night drives', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=26', now() - interval '12 days'),
        
        ('770e8400-e29b-41d4-a716-446655440012', artist5_id, 'Retro Future', 
         '80s-inspired synthpop for the modern era', 310, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=32', now() - interval '7 days'),
        
        ('770e8400-e29b-41d4-a716-446655440013', artist5_id, 'Electric Sunset', 
         'Synthwave journey through neon-lit horizons', 280, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=33', now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- Add some sample reactions to make tracks appear popular
    -- We'll add reactions from the artists themselves to their tracks
    INSERT INTO public.track_reactions (track_id, user_id, reaction_type, created_at)
    VALUES
        -- Reactions for Midnight Synthesis
        ('770e8400-e29b-41d4-a716-446655440001', artist2_id, 'fire', now() - interval '29 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist3_id, 'love', now() - interval '28 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist4_id, 'fire', now() - interval '27 days'),
        
        -- Reactions for Bass Drop Phenomenon
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'fire', now() - interval '26 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist3_id, 'love', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist5_id, 'fire', now() - interval '24 days'),
        
        -- Reactions for Lo-fi Memories
        ('770e8400-e29b-41d4-a716-446655440005', artist1_id, 'love', now() - interval '17 days'),
        ('770e8400-e29b-41d4-a716-446655440005', artist2_id, 'chill', now() - interval '16 days'),
        ('770e8400-e29b-41d4-a716-446655440005', artist3_id, 'love', now() - interval '15 days'),
        
        -- Reactions for Neon Highway
        ('770e8400-e29b-41d4-a716-446655440006', artist1_id, 'fire', now() - interval '11 days'),
        ('770e8400-e29b-41d4-a716-446655440006', artist2_id, 'fire', now() - interval '10 days'),
        ('770e8400-e29b-41d4-a716-446655440006', artist4_id, 'love', now() - interval '9 days'),
        
        -- Reactions for Coffee Shop Vibes
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'chill', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist2_id, 'love', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist5_id, 'chill', now() - interval '1 day'),
        
        -- Reactions for Electric Sunset
        ('770e8400-e29b-41d4-a716-446655440013', artist1_id, 'fire', now() - interval '12 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'fire', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist3_id, 'love', now() - interval '3 hours')
    ON CONFLICT (track_id, user_id, reaction_type) DO NOTHING;

    -- Add some sample comments to popular tracks
    INSERT INTO public.track_comments (track_id, user_id, content, created_at)
    VALUES
        ('770e8400-e29b-41d4-a716-446655440001', artist2_id, 'This track is absolutely fire! Love the dark vibes 🔥', now() - interval '28 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist3_id, 'Been listening to this on repeat. Amazing production!', now() - interval '26 days'),
        
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'That drop is insane! 🎵', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist5_id, 'Future bass at its finest!', now() - interval '23 days'),
        
        ('770e8400-e29b-41d4-a716-446655440005', artist1_id, 'Perfect for my study sessions 📚', now() - interval '16 days'),
        ('770e8400-e29b-41d4-a716-446655440005', artist2_id, 'So chill and relaxing, love it!', now() - interval '14 days'),
        
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'This is my morning anthem now ☕', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist5_id, 'Perfect coffee shop vibes indeed!', now() - interval '1 day'),
        
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'Taking me back to the 80s! 🌅', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist3_id, 'This is pure synthwave gold!', now() - interval '2 hours');

    -- Create some playlists for the artists
    INSERT INTO public.playlists (user_id, name, description, is_public, created_at)
    VALUES
        (artist1_id, 'Electronic Essentials', 'My favorite electronic tracks', true, now() - interval '30 days'),
        (artist2_id, 'Bass Heaven', 'Heavy bass tracks that hit different', true, now() - interval '25 days'),
        (artist3_id, 'Ambient Meditation', 'Peaceful tracks for meditation and focus', true, now() - interval '20 days'),
        (artist4_id, 'Lo-fi Study Beats', 'Chill beats for studying and working', true, now() - interval '15 days'),
        (artist5_id, 'Synthwave Nights', 'Retro-futuristic vibes for late night drives', true, now() - interval '10 days')
    ON CONFLICT DO NOTHING;

    -- Add some follows between artists
    INSERT INTO public.user_follows (follower_id, followed_id, created_at)
    VALUES
        (artist1_id, artist2_id, now() - interval '29 days'),
        (artist1_id, artist3_id, now() - interval '28 days'),
        (artist2_id, artist1_id, now() - interval '27 days'),
        (artist2_id, artist4_id, now() - interval '26 days'),
        (artist3_id, artist1_id, now() - interval '25 days'),
        (artist3_id, artist5_id, now() - interval '24 days'),
        (artist4_id, artist1_id, now() - interval '23 days'),
        (artist4_id, artist2_id, now() - interval '22 days'),
        (artist5_id, artist1_id, now() - interval '21 days'),
        (artist5_id, artist3_id, now() - interval '20 days')
    ON CONFLICT (follower_id, followed_id) DO NOTHING;

END $$;

-- Verify the data was inserted
SELECT 'Artists created:' as info, COUNT(*) as count FROM public.profiles WHERE username IN ('lunaeclipse', 'neonpulse', 'cosmicwaves', 'digitaldreams', 'aurorasynthetics')
UNION ALL
SELECT 'Tracks created:', COUNT(*) FROM public.tracks
UNION ALL
SELECT 'Reactions created:', COUNT(*) FROM public.track_reactions
UNION ALL
SELECT 'Comments created:', COUNT(*) FROM public.track_comments
UNION ALL
SELECT 'Playlists created:', COUNT(*) FROM public.playlists WHERE name IN ('Electronic Essentials', 'Bass Heaven', 'Ambient Meditation', 'Lo-fi Study Beats', 'Synthwave Nights')
UNION ALL
SELECT 'Follows created:', COUNT(*) FROM public.user_follows;

-- Display popular tracks with reaction counts
SELECT 
    t.title,
    p.display_name as artist,
    t.duration,
    COUNT(DISTINCT r.id) as reaction_count,
    COUNT(DISTINCT c.id) as comment_count,
    t.created_at
FROM public.tracks t
JOIN public.profiles p ON t.artist_id = p.id
LEFT JOIN public.track_reactions r ON t.id = r.track_id
LEFT JOIN public.track_comments c ON t.id = c.track_id
GROUP BY t.id, t.title, p.display_name, t.duration, t.created_at
ORDER BY reaction_count DESC, comment_count DESC
LIMIT 10;
