-- Insert sample popular songs data (simplified version)
-- Creates sample artists and tracks for the popular songs section

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

    -- Wait a moment for triggers to fire
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
    -- Note: genre column is added to tracks table if it doesn't exist
    ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS genre text;
    ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS play_count int DEFAULT 0;

    INSERT INTO public.tracks (id, artist_id, title, description, duration, audio_url, cover_url, genre, play_count, created_at)
    VALUES
        -- Most Popular Track - Bass Drop Phenomenon
        ('770e8400-e29b-41d4-a716-446655440003', artist2_id, 'Bass Drop Phenomenon', 
         'Future bass anthem with massive drops', 320, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=23', 'Future Bass', 15678, now() - interval '28 days'),
        
        -- Electric Sunset - Recent Hit
        ('770e8400-e29b-41d4-a716-446655440013', artist5_id, 'Electric Sunset', 
         'Synthwave journey through neon-lit horizons', 280, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=33', 'Synthwave', 13456, now() - interval '1 day'),
        
        -- Midnight Synthesis
        ('770e8400-e29b-41d4-a716-446655440001', artist1_id, 'Midnight Synthesis', 
         'A dark electronic journey through synthetic soundscapes', 300, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=21', 'Electronic', 12456, now() - interval '30 days'),
        
        -- Coffee Shop Vibes - Trending Lo-fi
        ('770e8400-e29b-41d4-a716-446655440011', artist4_id, 'Coffee Shop Vibes', 
         'Morning coffee beats', 240, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=31', 'Lo-fi Hip Hop', 11234, now() - interval '3 days'),
        
        -- Neon Highway
        ('770e8400-e29b-41d4-a716-446655440006', artist5_id, 'Neon Highway', 
         'Synthwave night drive anthem', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=26', 'Synthwave', 10234, now() - interval '12 days'),
        
        -- Lo-fi Memories
        ('770e8400-e29b-41d4-a716-446655440005', artist4_id, 'Lo-fi Memories', 
         'Nostalgic lo-fi beats for studying', 275, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=25', 'Lo-fi Hip Hop', 9876, now() - interval '18 days'),
        
        -- Solar Flare
        ('770e8400-e29b-41d4-a716-446655440002', artist1_id, 'Solar Flare', 
         'High-energy electronic track with cosmic vibes', 285, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=22', 'Electronic', 8934, now() - interval '25 days'),
        
        -- Rainy Day Beats
        ('770e8400-e29b-41d4-a716-446655440010', artist4_id, 'Rainy Day Beats', 
         'Chill lo-fi for rainy days', 260, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=30', 'Lo-fi Hip Hop', 8234, now() - interval '5 days'),
        
        -- Neon Dreams
        ('770e8400-e29b-41d4-a716-446655440008', artist2_id, 'Neon Dreams', 
         'Melodic dubstep journey', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=28', 'Dubstep', 7890, now() - interval '15 days'),
        
        -- Ethereal Drift
        ('770e8400-e29b-41d4-a716-446655440004', artist3_id, 'Ethereal Drift', 
         'Peaceful ambient soundscape', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=24', 'Ambient', 6789, now() - interval '22 days')
    ON CONFLICT (id) DO NOTHING;

    -- Add reactions to make tracks appear popular
    INSERT INTO public.track_reactions (track_id, user_id, reaction_type, created_at)
    VALUES
        -- Most popular track reactions
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'fire', now() - interval '26 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist3_id, 'love', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist5_id, 'fire', now() - interval '24 days'),
        
        -- Recent hit reactions
        ('770e8400-e29b-41d4-a716-446655440013', artist1_id, 'fire', now() - interval '12 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'fire', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist3_id, 'love', now() - interval '3 hours'),
        
        -- Trending lo-fi reactions
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'chill', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist2_id, 'love', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist5_id, 'chill', now() - interval '1 day')
    ON CONFLICT (track_id, user_id, reaction_type) DO NOTHING;

    -- Add a few engaging comments
    INSERT INTO public.track_comments (track_id, user_id, content, created_at)
    VALUES
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'That bass drop is legendary! 🔥🔥🔥', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'Perfect synthwave vibes! Taking me back to the 80s 🌅', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'My go-to track for morning coffee ☕', now() - interval '2 days')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Popular songs data inserted successfully!';
END $$;

-- Verify and display the results
SELECT '✅ Data insertion complete!' as status;

-- Summary statistics
SELECT 
    COUNT(DISTINCT p.id) as "Artists",
    COUNT(DISTINCT t.id) as "Tracks",
    COUNT(DISTINCT r.id) as "Reactions",
    COUNT(DISTINCT c.id) as "Comments"
FROM public.profiles p
LEFT JOIN public.tracks t ON p.id = t.artist_id
LEFT JOIN public.track_reactions r ON t.id = r.track_id
LEFT JOIN public.track_comments c ON t.id = c.track_id
WHERE p.username IN ('lunaeclipse', 'neonpulse', 'cosmicwaves', 'digitaldreams', 'aurorasynthetics');

-- Display the Popular Songs Section
SELECT '🎵 POPULAR SONGS' as "SECTION";

SELECT 
    ROW_NUMBER() OVER (ORDER BY t.play_count DESC) as "Rank",
    t.title AS "Song",
    p.display_name AS "Artist",
    t.genre AS "Genre",
    TO_CHAR(t.play_count, 'FM99,999') AS "Plays",
    COUNT(DISTINCT r.id) AS "Reactions",
    CASE 
        WHEN t.created_at > now() - interval '3 days' THEN '🔥 NEW'
        WHEN t.play_count > 10000 THEN '📈 TRENDING'
        WHEN t.genre = 'Lo-fi Hip Hop' THEN '☕ CHILL'
        ELSE ''
    END as "Badge"
FROM public.tracks t
JOIN public.profiles p ON t.artist_id = p.id
LEFT JOIN public.track_reactions r ON t.id = r.track_id
GROUP BY t.id, t.title, p.display_name, t.genre, t.play_count, t.created_at
ORDER BY t.play_count DESC
LIMIT 10;
