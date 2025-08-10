-- Insert sample popular songs data
-- This script adds sample artists and their tracks to the database

DO $$
DECLARE
    artist1_id uuid := '550e8400-e29b-41d4-a716-446655440001';
    artist2_id uuid := '550e8400-e29b-41d4-a716-446655440002';
    artist3_id uuid := '550e8400-e29b-41d4-a716-446655440003';
    artist4_id uuid := '550e8400-e29b-41d4-a716-446655440004';
    artist5_id uuid := '550e8400-e29b-41d4-a716-446655440005';
BEGIN
    -- Create auth.users entries for our sample artists
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
    VALUES 
        (artist1_id, 'lunaeclipse@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist2_id, 'neonpulse@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist3_id, 'cosmicwaves@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist4_id, 'digitaldreams@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist5_id, 'aurorasynthetics@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- Wait for trigger to create profiles
    PERFORM pg_sleep(0.5);

    -- Update the auto-created profiles with proper artist data
    UPDATE public.profiles SET 
        username = 'lunaeclipse',
        display_name = 'Luna Eclipse',
        avatar_url = 'https://picsum.photos/300/300?random=1',
        onboarding_completed = true
    WHERE id = artist1_id;

    UPDATE public.profiles SET 
        username = 'neonpulse',
        display_name = 'Neon Pulse',
        avatar_url = 'https://picsum.photos/300/300?random=2',
        onboarding_completed = true
    WHERE id = artist2_id;

    UPDATE public.profiles SET 
        username = 'cosmicwaves',
        display_name = 'Cosmic Waves',
        avatar_url = 'https://picsum.photos/300/300?random=3',
        onboarding_completed = true
    WHERE id = artist3_id;

    UPDATE public.profiles SET 
        username = 'digitaldreams',
        display_name = 'Digital Dreams',
        avatar_url = 'https://picsum.photos/300/300?random=4',
        onboarding_completed = true
    WHERE id = artist4_id;

    UPDATE public.profiles SET 
        username = 'aurorasynthetics',
        display_name = 'Aurora Synthetics',
        avatar_url = 'https://picsum.photos/300/300?random=5',
        onboarding_completed = true
    WHERE id = artist5_id;

    -- Insert popular tracks with various genres and play counts
    INSERT INTO public.tracks (id, artist_id, title, description, duration, audio_url, cover_url, genre, play_count, created_at)
    VALUES
        -- Luna Eclipse - Electronic/Synthwave (Popular Artist)
        ('770e8400-e29b-41d4-a716-446655440001', artist1_id, 'Midnight Synthesis', 
         'A dark electronic journey through synthetic soundscapes', 300, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=21', 'Electronic', 12456, now() - interval '30 days'),
        
        ('770e8400-e29b-41d4-a716-446655440002', artist1_id, 'Solar Flare', 
         'High-energy electronic track with cosmic vibes', 285, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=22', 'Electronic', 8934, now() - interval '25 days'),
        
        ('770e8400-e29b-41d4-a716-446655440007', artist1_id, 'Digital Horizon', 
         'Ambient electronic exploration', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=27', 'Ambient', 5678, now() - interval '20 days'),

        -- Neon Pulse - Future Bass/Dubstep (Most Popular Track)
        ('770e8400-e29b-41d4-a716-446655440003', artist2_id, 'Bass Drop Phenomenon', 
         'Future bass anthem with massive drops', 320, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=23', 'Future Bass', 15678, now() - interval '28 days'),
        
        ('770e8400-e29b-41d4-a716-446655440008', artist2_id, 'Neon Dreams', 
         'Melodic dubstep journey', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=28', 'Dubstep', 7890, now() - interval '15 days'),

        -- Cosmic Waves - Ambient/Downtempo
        ('770e8400-e29b-41d4-a716-446655440004', artist3_id, 'Ethereal Drift', 
         'Peaceful ambient soundscape', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=24', 'Ambient', 6789, now() - interval '22 days'),
        
        ('770e8400-e29b-41d4-a716-446655440009', artist3_id, 'Celestial Journey', 
         'Cosmic ambient exploration', 480, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=29', 'Ambient', 4567, now() - interval '10 days'),

        -- Digital Dreams - Lo-fi Hip Hop (Trending)
        ('770e8400-e29b-41d4-a716-446655440005', artist4_id, 'Lo-fi Memories', 
         'Nostalgic lo-fi beats for studying', 275, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=25', 'Lo-fi Hip Hop', 9876, now() - interval '18 days'),
        
        ('770e8400-e29b-41d4-a716-446655440010', artist4_id, 'Rainy Day Beats', 
         'Chill lo-fi for rainy days', 260, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=30', 'Lo-fi Hip Hop', 8234, now() - interval '5 days'),
        
        ('770e8400-e29b-41d4-a716-446655440011', artist4_id, 'Coffee Shop Vibes', 
         'Morning coffee beats', 240, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=31', 'Lo-fi Hip Hop', 11234, now() - interval '3 days'),

        -- Aurora Synthetics - Synthwave/Retrowave (Recently Popular)
        ('770e8400-e29b-41d4-a716-446655440006', artist5_id, 'Neon Highway', 
         'Synthwave night drive anthem', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=26', 'Synthwave', 10234, now() - interval '12 days'),
        
        ('770e8400-e29b-41d4-a716-446655440012', artist5_id, 'Retro Future', 
         '80s-inspired synthpop', 310, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=32', 'Synthpop', 6543, now() - interval '7 days'),
        
        ('770e8400-e29b-41d4-a716-446655440013', artist5_id, 'Electric Sunset', 
         'Synthwave sunset vibes', 280, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=33', 'Synthwave', 13456, now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- Add reactions to popular tracks
    INSERT INTO public.track_reactions (track_id, user_id, reaction_type, created_at)
    VALUES
        -- Most reacted track
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'fire', now() - interval '26 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist3_id, 'love', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist5_id, 'fire', now() - interval '24 days'),
        
        -- Second most popular
        ('770e8400-e29b-41d4-a716-446655440001', artist2_id, 'fire', now() - interval '29 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist3_id, 'love', now() - interval '28 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist4_id, 'fire', now() - interval '27 days'),
        
        -- Recently trending
        ('770e8400-e29b-41d4-a716-446655440013', artist1_id, 'fire', now() - interval '12 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'fire', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist3_id, 'love', now() - interval '3 hours'),
        
        -- Lo-fi favorite
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'chill', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist2_id, 'love', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist5_id, 'chill', now() - interval '1 day')
    ON CONFLICT (track_id, user_id, reaction_type) DO NOTHING;

    -- Add engaging comments
    INSERT INTO public.track_comments (track_id, user_id, content, created_at)
    VALUES
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'That bass drop though! 🔥🔥🔥', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist2_id, 'Dark and mysterious, love it!', now() - interval '28 days'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'Perfect synthwave vibes! 🌅', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'My go-to track for morning coffee ☕', now() - interval '2 days')
    ON CONFLICT DO NOTHING;

    -- Add artist follows
    INSERT INTO public.user_follows (follower_id, followed_id, created_at)
    VALUES
        (artist1_id, artist2_id, now() - interval '29 days'),
        (artist2_id, artist1_id, now() - interval '27 days'),
        (artist3_id, artist1_id, now() - interval '25 days'),
        (artist4_id, artist2_id, now() - interval '22 days'),
        (artist5_id, artist1_id, now() - interval '21 days')
    ON CONFLICT (follower_id, followed_id) DO NOTHING;

    RAISE NOTICE 'Sample data insertion completed successfully!';
END $$;

-- Show summary of what was created
SELECT 'Summary of Popular Songs Data:' as info;

SELECT 
    COUNT(DISTINCT p.id) as "Total Artists",
    COUNT(DISTINCT t.id) as "Total Tracks",
    COUNT(DISTINCT r.id) as "Total Reactions",
    COUNT(DISTINCT c.id) as "Total Comments"
FROM public.profiles p
LEFT JOIN public.tracks t ON p.id = t.artist_id
LEFT JOIN public.track_reactions r ON t.id = r.track_id
LEFT JOIN public.track_comments c ON t.id = c.track_id
WHERE p.username IN ('lunaeclipse', 'neonpulse', 'cosmicwaves', 'digitaldreams', 'aurorasynthetics');

-- Display the popular songs section
SELECT 
    '🎵 Popular Songs Section' as section,
    '' as "";

SELECT 
    ROW_NUMBER() OVER (ORDER BY t.play_count DESC) as "#",
    t.title AS "Song Title",
    p.display_name AS "Artist",
    t.genre AS "Genre",
    t.play_count AS "Plays",
    COUNT(DISTINCT r.id) AS "❤️",
    CASE 
        WHEN t.created_at > now() - interval '7 days' THEN '🔥 NEW'
        WHEN t.play_count > 10000 THEN '📈 TRENDING'
        ELSE ''
    END as "Status"
FROM public.tracks t
JOIN public.profiles p ON t.artist_id = p.id
LEFT JOIN public.track_reactions r ON t.id = r.track_id
GROUP BY t.id, t.title, p.display_name, t.genre, t.play_count, t.created_at
ORDER BY t.play_count DESC
LIMIT 10;
