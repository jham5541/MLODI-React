-- Add sample popular songs data to the database
-- First ensure tracks table exists and create auth users properly

-- Create tracks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tracks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    duration int NOT NULL,
    audio_url text,
    cover_url text,
    genre text,
    play_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create track reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.track_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(track_id, user_id, reaction_type)
);

-- Create track comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.track_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tracks
CREATE POLICY IF NOT EXISTS "Users can view any track"
    ON public.tracks FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Artists can manage own tracks"
    ON public.tracks FOR ALL USING (auth.uid() = artist_id);

CREATE POLICY IF NOT EXISTS "Users can react to tracks"
    ON public.track_reactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can comment on tracks"
    ON public.track_comments FOR ALL USING (auth.uid() = user_id);

-- Now add the sample data
DO $$
DECLARE
    artist1_id uuid := '550e8400-e29b-41d4-a716-446655440001';
    artist2_id uuid := '550e8400-e29b-41d4-a716-446655440002';
    artist3_id uuid := '550e8400-e29b-41d4-a716-446655440003';
    artist4_id uuid := '550e8400-e29b-41d4-a716-446655440004';
    artist5_id uuid := '550e8400-e29b-41d4-a716-446655440005';
BEGIN
    -- First create auth.users entries
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
    VALUES 
        (artist1_id, 'lunaeclipse@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist2_id, 'neonpulse@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist3_id, 'cosmicwaves@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist4_id, 'digitaldreams@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
        (artist5_id, 'aurorasynthetics@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- The trigger should automatically create profiles, but let's update them with proper data
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

    -- Insert popular tracks
    INSERT INTO public.tracks (id, artist_id, title, description, duration, audio_url, cover_url, genre, play_count, created_at)
    VALUES
        -- Luna Eclipse tracks (Electronic/Synthwave)
        ('770e8400-e29b-41d4-a716-446655440001', artist1_id, 'Midnight Synthesis', 
         'A dark electronic journey through synthetic soundscapes', 300, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=21', 'Electronic', 12456, now() - interval '30 days'),
        
        ('770e8400-e29b-41d4-a716-446655440002', artist1_id, 'Solar Flare', 
         'High-energy electronic track with cosmic vibes', 285, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=22', 'Electronic', 8934, now() - interval '25 days'),
        
        ('770e8400-e29b-41d4-a716-446655440007', artist1_id, 'Digital Horizon', 
         'Ambient electronic exploration of digital landscapes', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=27', 'Ambient', 5678, now() - interval '20 days'),

        -- Neon Pulse tracks (Future Bass/Dubstep)
        ('770e8400-e29b-41d4-a716-446655440003', artist2_id, 'Bass Drop Phenomenon', 
         'Future bass anthem with massive drops', 320, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=23', 'Future Bass', 15678, now() - interval '28 days'),
        
        ('770e8400-e29b-41d4-a716-446655440008', artist2_id, 'Neon Dreams', 
         'Melodic dubstep journey through neon-lit cityscapes', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=28', 'Dubstep', 7890, now() - interval '15 days'),

        -- Cosmic Waves tracks (Ambient/Downtempo)
        ('770e8400-e29b-41d4-a716-446655440004', artist3_id, 'Ethereal Drift', 
         'Peaceful ambient soundscape for meditation and focus', 420, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=24', 'Ambient', 6789, now() - interval '22 days'),
        
        ('770e8400-e29b-41d4-a716-446655440009', artist3_id, 'Celestial Journey', 
         'Ambient exploration through cosmic realms', 480, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=29', 'Ambient', 4567, now() - interval '10 days'),

        -- Digital Dreams tracks (Lo-fi Hip Hop)
        ('770e8400-e29b-41d4-a716-446655440005', artist4_id, 'Lo-fi Memories', 
         'Nostalgic lo-fi hip hop beats for studying and relaxation', 275, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=25', 'Lo-fi Hip Hop', 9876, now() - interval '18 days'),
        
        ('770e8400-e29b-41d4-a716-446655440010', artist4_id, 'Rainy Day Beats', 
         'Chill lo-fi beats perfect for a rainy afternoon', 260, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=30', 'Lo-fi Hip Hop', 8234, now() - interval '5 days'),
        
        ('770e8400-e29b-41d4-a716-446655440011', artist4_id, 'Coffee Shop Vibes', 
         'Warm lo-fi beats for your morning coffee', 240, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=31', 'Lo-fi Hip Hop', 11234, now() - interval '3 days'),

        -- Aurora Synthetics tracks (Synthwave/Retrowave)
        ('770e8400-e29b-41d4-a716-446655440006', artist5_id, 'Neon Highway', 
         'Synthwave anthem for late night drives', 295, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=26', 'Synthwave', 10234, now() - interval '12 days'),
        
        ('770e8400-e29b-41d4-a716-446655440012', artist5_id, 'Retro Future', 
         '80s-inspired synthpop for the modern era', 310, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=32', 'Synthpop', 6543, now() - interval '7 days'),
        
        ('770e8400-e29b-41d4-a716-446655440013', artist5_id, 'Electric Sunset', 
         'Synthwave journey through neon-lit horizons', 280, 
         'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 
         'https://picsum.photos/400/400?random=33', 'Synthwave', 13456, now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING;

    -- Add sample reactions to make tracks appear popular
    INSERT INTO public.track_reactions (track_id, user_id, reaction_type, created_at)
    VALUES
        -- Reactions for top tracks
        ('770e8400-e29b-41d4-a716-446655440001', artist2_id, 'fire', now() - interval '29 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist3_id, 'love', now() - interval '28 days'),
        ('770e8400-e29b-41d4-a716-446655440001', artist4_id, 'fire', now() - interval '27 days'),
        
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'fire', now() - interval '26 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist3_id, 'love', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist5_id, 'fire', now() - interval '24 days'),
        
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'chill', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist2_id, 'love', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist5_id, 'chill', now() - interval '1 day'),
        
        ('770e8400-e29b-41d4-a716-446655440013', artist1_id, 'fire', now() - interval '12 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'fire', now() - interval '6 hours'),
        ('770e8400-e29b-41d4-a716-446655440013', artist3_id, 'love', now() - interval '3 hours')
    ON CONFLICT (track_id, user_id, reaction_type) DO NOTHING;

    -- Add sample comments to popular tracks
    INSERT INTO public.track_comments (track_id, user_id, content, created_at)
    VALUES
        ('770e8400-e29b-41d4-a716-446655440001', artist2_id, 'This track is absolutely fire! Love the dark vibes 🔥', now() - interval '28 days'),
        ('770e8400-e29b-41d4-a716-446655440003', artist1_id, 'That drop is insane! 🎵', now() - interval '25 days'),
        ('770e8400-e29b-41d4-a716-446655440011', artist1_id, 'This is my morning anthem now ☕', now() - interval '2 days'),
        ('770e8400-e29b-41d4-a716-446655440013', artist2_id, 'Taking me back to the 80s! 🌅', now() - interval '6 hours')
    ON CONFLICT DO NOTHING;

    -- Add some follows between artists
    INSERT INTO public.user_follows (follower_id, followed_id, created_at)
    VALUES
        (artist1_id, artist2_id, now() - interval '29 days'),
        (artist2_id, artist1_id, now() - interval '27 days'),
        (artist3_id, artist1_id, now() - interval '25 days'),
        (artist4_id, artist2_id, now() - interval '22 days'),
        (artist5_id, artist1_id, now() - interval '21 days')
    ON CONFLICT (follower_id, followed_id) DO NOTHING;

END $$;

-- Verify the data was inserted
SELECT 'Data insertion complete!' as status;

-- Show summary of inserted data
SELECT 
    'Artists created' as category,
    COUNT(*) as count 
FROM public.profiles 
WHERE username IN ('lunaeclipse', 'neonpulse', 'cosmicwaves', 'digitaldreams', 'aurorasynthetics')
UNION ALL
SELECT 'Tracks created', COUNT(*) FROM public.tracks
UNION ALL
SELECT 'Reactions created', COUNT(*) FROM public.track_reactions
UNION ALL
SELECT 'Comments created', COUNT(*) FROM public.track_comments;

-- Display top 10 popular tracks with their stats
SELECT 
    t.title AS "Track Title",
    p.display_name AS "Artist",
    t.genre AS "Genre",
    t.duration AS "Duration (s)",
    t.play_count AS "Play Count",
    COUNT(DISTINCT r.id) AS "Reactions",
    COUNT(DISTINCT c.id) AS "Comments",
    to_char(t.created_at, 'YYYY-MM-DD') AS "Released"
FROM public.tracks t
JOIN public.profiles p ON t.artist_id = p.id
LEFT JOIN public.track_reactions r ON t.id = r.track_id
LEFT JOIN public.track_comments c ON t.id = c.track_id
GROUP BY t.id, t.title, p.display_name, t.genre, t.duration, t.play_count, t.created_at
ORDER BY t.play_count DESC, COUNT(DISTINCT r.id) DESC
LIMIT 10;
