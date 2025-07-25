-- Seed database with sample data for development and testing
-- This migration populates the database with realistic sample data

-- Insert sample artists
INSERT INTO artists (id, name, bio, avatar_url, cover_url, genres, followers_count, monthly_listeners, is_verified, wallet_address, social_links) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Luna Eclipse', 'Electronic music producer pushing the boundaries of sound and technology. Pioneering the Web3 music revolution.', 'https://picsum.photos/300/300?random=1', 'https://picsum.photos/800/400?random=1', ARRAY['Electronic', 'Ambient', 'Synthwave'], 45678, 123456, true, '0x1234567890123456789012345678901234567890', '{"twitter": "@lunaeclipse", "instagram": "@luna_eclipse_music", "website": "https://lunaeclipse.com"}'),
('550e8400-e29b-41d4-a716-446655440002', 'Neon Pulse', 'Future bass and melodic dubstep artist creating immersive sonic experiences for the digital age.', 'https://picsum.photos/300/300?random=2', 'https://picsum.photos/800/400?random=2', ARRAY['Electronic', 'Future Bass', 'Dubstep'], 32145, 89234, true, '0x2345678901234567890123456789012345678901', '{"twitter": "@neonpulse", "soundcloud": "neonpulse", "spotify": "neonpulse"}'),
('550e8400-e29b-41d4-a716-446655440003', 'Cosmic Waves', 'Ambient and downtempo producer crafting ethereal soundscapes for meditation and focus.', 'https://picsum.photos/300/300?random=3', 'https://picsum.photos/800/400?random=3', ARRAY['Ambient', 'Downtempo', 'Chillout'], 28934, 67890, false, '0x3456789012345678901234567890123456789012', '{"bandcamp": "cosmicwaves", "youtube": "cosmicwavesmusic"}'),
('550e8400-e29b-41d4-a716-446655440004', 'Digital Dreams', 'Lo-fi hip hop and chillwave artist creating nostalgic beats for the modern world.', 'https://picsum.photos/300/300?random=4', 'https://picsum.photos/800/400?random=4', ARRAY['Lo-fi', 'Hip Hop', 'Chillwave'], 56789, 145678, true, '0x4567890123456789012345678901234567890123', '{"twitter": "@digitaldreams", "instagram": "@digital_dreams_beats"}'),
('550e8400-e29b-41d4-a716-446655440005', 'Aurora Synthetics', 'Synthpop and retrowave artist bringing 80s nostalgia to the blockchain era.', 'https://picsum.photos/300/300?random=5', 'https://picsum.photos/800/400?random=5', ARRAY['Synthpop', 'Retrowave', 'New Wave'], 41234, 98765, true, '0x5678901234567890123456789012345678901234', '{"twitter": "@aurorasynthetics", "website": "https://aurorasynthetics.io"}');

-- Insert sample albums
INSERT INTO albums (id, title, artist_id, description, cover_url, release_date, album_type, total_tracks, duration_ms) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Lunar Phases', '550e8400-e29b-41d4-a716-446655440001', 'A journey through the cycles of night and electronic dreams.', 'https://picsum.photos/400/400?random=11', '2024-01-15', 'album', 8, 2400000),
('660e8400-e29b-41d4-a716-446655440002', 'Neon Nights', '550e8400-e29b-41d4-a716-446655440002', 'High-energy tracks for late night adventures in the digital realm.', 'https://picsum.photos/400/400?random=12', '2024-01-10', 'album', 6, 1800000),
('660e8400-e29b-41d4-a716-446655440003', 'Infinite Horizons', '550e8400-e29b-41d4-a716-446655440003', 'Expansive ambient compositions for deep contemplation.', 'https://picsum.photos/400/400?random=13', '2024-01-05', 'album', 5, 3000000),
('660e8400-e29b-41d4-a716-446655440004', 'City Echoes', '550e8400-e29b-41d4-a716-446655440004', 'Lo-fi beats inspired by urban landscapes and memories.', 'https://picsum.photos/400/400?random=14', '2024-01-20', 'ep', 4, 1200000),
('660e8400-e29b-41d4-a716-446655440005', 'Retro Future', '550e8400-e29b-41d4-a716-446655440005', 'Synthwave anthems for the modern nostalgia enthusiast.', 'https://picsum.photos/400/400?random=15', '2024-01-18', 'album', 7, 2100000);

-- Insert sample songs
INSERT INTO songs (id, title, artist_id, album_id, audio_url, cover_url, duration_ms, genre, mood, play_count, like_count, share_count, nft_total_supply, nft_available_supply, nft_price, waveform_data) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Midnight Synthesis', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/400/400?random=21', 300000, 'Electronic', 'dark', 12456, 892, 156, 1000, 750, 0.05, '{"peaks": [0.1, 0.3, 0.7, 0.4, 0.8, 0.2, 0.6, 0.9, 0.3, 0.5]}'),
('770e8400-e29b-41d4-a716-446655440002', 'Solar Flare', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/400/400?random=22', 285000, 'Electronic', 'energetic', 8934, 634, 89, 500, 320, 0.08, '{"peaks": [0.2, 0.6, 0.8, 0.3, 0.9, 0.4, 0.7, 0.5, 0.6, 0.8]}'),
('770e8400-e29b-41d4-a716-446655440003', 'Bass Drop Phenomenon', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/400/400?random=23', 320000, 'Future Bass', 'energetic', 15678, 1234, 267, 750, 600, 0.06, '{"peaks": [0.3, 0.8, 0.9, 0.5, 0.7, 0.8, 0.4, 0.9, 0.6, 0.7]}'),
('770e8400-e29b-41d4-a716-446655440004', 'Ethereal Drift', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/400/400?random=24', 420000, 'Ambient', 'chill', 6789, 445, 67, 300, 280, 0.04, '{"peaks": [0.1, 0.2, 0.3, 0.2, 0.4, 0.3, 0.2, 0.5, 0.3, 0.2]}'),
('770e8400-e29b-41d4-a716-446655440005', 'Lo-fi Memories', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/400/400?random=25', 275000, 'Lo-fi', 'chill', 9876, 678, 123, 200, 150, 0.03, '{"peaks": [0.2, 0.4, 0.3, 0.5, 0.4, 0.3, 0.6, 0.4, 0.3, 0.5]}'),
('770e8400-e29b-41d4-a716-446655440006', 'Neon Highway', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', 'https://picsum.photos/400/400?random=26', 295000, 'Synthwave', 'energetic', 11234, 789, 145, 400, 350, 0.07, '{"peaks": [0.4, 0.7, 0.8, 0.6, 0.9, 0.5, 0.7, 0.8, 0.6, 0.7]}');

-- Insert sample achievements
INSERT INTO achievements (id, title, description, icon, category, rarity, points_awarded, unlock_criteria) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'First Listen', 'Played your first song', 'play', 'listening', 'common', 10, '{"songs_played": 1}'),
('880e8400-e29b-41d4-a716-446655440002', 'Music Explorer', 'Listened to 100 different songs', 'compass', 'listening', 'rare', 100, '{"unique_songs_played": 100}'),
('880e8400-e29b-41d4-a716-446655440003', 'Playlist Creator', 'Created your first playlist', 'albums', 'engagement', 'common', 25, '{"playlists_created": 1}'),
('880e8400-e29b-41d4-a716-446655440004', 'Social Butterfly', 'Shared 10 songs with friends', 'share-social', 'social', 'rare', 75, '{"songs_shared": 10}'),
('880e8400-e29b-41d4-a716-446655440005', 'Dedicated Fan', 'Reached Silver tier with an artist', 'medal', 'loyalty', 'epic', 200, '{"fan_tier": "Silver"}'),
('880e8400-e29b-41d4-a716-446655440006', 'NFT Collector', 'Purchased your first music NFT', 'diamond', 'engagement', 'legendary', 500, '{"nfts_purchased": 1}');

-- Insert sample challenges
INSERT INTO challenges (id, title, description, icon, category, difficulty, challenge_type, target_value, points_reward, badge_reward, requirements, tips) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Daily Listener', 'Listen to 5 songs today', 'headset', 'listening', 'easy', 'daily', 5, 50, null, '["Listen to any 5 complete songs", "Must be completed within 24 hours"]', '["Try exploring new genres!", "Skip counts against progress"]'),
('990e8400-e29b-41d4-a716-446655440002', 'Social Sharer', 'Share 3 songs this week', 'share-social', 'social', 'medium', 'weekly', 3, 150, 'Social Influencer', '["Share songs to social media", "Must include artist tag"]', '["Use hashtags for better reach", "Tag the artist for bonus points"]'),
('990e8400-e29b-41d4-a716-446655440003', 'Playlist Master', 'Create a themed playlist with 15 songs', 'musical-notes', 'creative', 'hard', 'weekly', 1, 300, 'Curator', '["Create playlist with 15+ songs", "Must have a clear theme", "Share with community"]', '["Choose a specific mood or genre", "Add descriptions to your playlist"]'),
('990e8400-e29b-41d4-a716-446655440004', 'Marathon Listener', 'Listen for 3 hours in one day', 'time', 'listening', 'medium', 'daily', 10800000, 200, 'Music Marathon', '["Continuous listening time", "Minimum 30s per song counts"]', '["Use background play", "Create long playlists"]');

-- Insert sample milestones
INSERT INTO milestones (id, title, description, icon, category, required_points, reward, points_awarded) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'Bronze Fan', 'Reach Bronze fan tier', 'trophy', 'loyalty', 100, 'Exclusive profile badge', 50),
('aa0e8400-e29b-41d4-a716-446655440002', 'First Playlist', 'Create your first playlist', 'albums', 'engagement', 50, 'Playlist creation bonus', 25),
('aa0e8400-e29b-41d4-a716-446655440003', 'Social Starter', 'Make your first share', 'share', 'social', 25, 'Social media integration', 15),
('aa0e8400-e29b-41d4-a716-446655440004', 'Music Discovery', 'Discover 50 new songs', 'compass', 'listening', 200, 'Discovery algorithm boost', 100),
('aa0e8400-e29b-41d4-a716-446655440005', 'Community Member', 'Join fan community', 'people', 'engagement', 75, 'Community access', 35);

-- Insert sample NFT collections
INSERT INTO nft_collections (id, name, description, artist_id, contract_address, symbol, total_supply, floor_price, volume_traded, is_verified) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'Luna Eclipse Genesis', 'First collection by Luna Eclipse featuring exclusive tracks and artwork', '550e8400-e29b-41d4-a716-446655440001', '0xabcdef1234567890abcdef1234567890abcdef12', 'LEG', 1000, 0.05, 12.5, true),
('bb0e8400-e29b-41d4-a716-446655440002', 'Neon Pulse Beats', 'High-energy NFT collection with unique visual experiences', '550e8400-e29b-41d4-a716-446655440002', '0xbcdef1234567890abcdef1234567890abcdef123', 'NPB', 500, 0.08, 8.7, true),
('bb0e8400-e29b-41d4-a716-446655440003', 'Digital Dreams Collective', 'Lo-fi NFTs for the modern collector', '550e8400-e29b-41d4-a716-446655440004', '0xcdef1234567890abcdef1234567890abcdef1234', 'DDC', 300, 0.03, 4.2, false);

-- Insert sample NFT listings
INSERT INTO nft_listings (id, token_id, collection_id, seller_id, song_id, price, currency, status, rarity_rank, traits) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '1', 'bb0e8400-e29b-41d4-a716-446655440001', (SELECT id FROM auth.users LIMIT 1), '770e8400-e29b-41d4-a716-446655440001', 0.05, 'ETH', 'active', 1, '{"rarity": "Legendary", "background": "Cosmic", "effect": "Glowing"}'),
('cc0e8400-e29b-41d4-a716-446655440002', '15', 'bb0e8400-e29b-41d4-a716-446655440001', (SELECT id FROM auth.users LIMIT 1), '770e8400-e29b-41d4-a716-446655440002', 0.03, 'ETH', 'active', 45, '{"rarity": "Rare", "background": "Galaxy", "effect": "Pulsing"}'),
('cc0e8400-e29b-41d4-a716-446655440003', '7', 'bb0e8400-e29b-41d4-a716-446655440002', (SELECT id FROM auth.users LIMIT 1), '770e8400-e29b-41d4-a716-446655440003', 0.08, 'ETH', 'active', 12, '{"rarity": "Epic", "background": "Neon", "effect": "Lightning"}');

-- Create function to update counters
CREATE OR REPLACE FUNCTION update_play_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update song play count
  UPDATE songs 
  SET play_count = play_count + 1 
  WHERE id = NEW.song_id;
  
  -- Update artist analytics
  INSERT INTO artist_analytics (artist_id, date, total_plays, unique_listeners)
  SELECT 
    s.artist_id,
    CURRENT_DATE,
    1,
    1
  FROM songs s 
  WHERE s.id = NEW.song_id
  ON CONFLICT (artist_id, date) 
  DO UPDATE SET 
    total_plays = artist_analytics.total_plays + 1,
    unique_listeners = artist_analytics.unique_listeners + CASE 
      WHEN NEW.user_id NOT IN (
        SELECT DISTINCT ph.user_id 
        FROM play_history ph 
        JOIN songs s2 ON ph.song_id = s2.id 
        WHERE s2.artist_id = EXCLUDED.artist_id 
        AND ph.played_at::date = CURRENT_DATE
        AND ph.id != NEW.id
      ) THEN 1 ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for play count updates
CREATE TRIGGER update_play_count_trigger
  AFTER INSERT ON play_history
  FOR EACH ROW EXECUTE FUNCTION update_play_count();

-- Create function to update like counts
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    CASE NEW.liked_type
      WHEN 'song' THEN
        UPDATE songs SET like_count = like_count + 1 WHERE id = NEW.liked_id;
      WHEN 'album' THEN
        UPDATE albums SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.liked_id;
      WHEN 'playlist' THEN
        UPDATE playlists SET like_count = like_count + 1 WHERE id = NEW.liked_id;
    END CASE;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    CASE OLD.liked_type
      WHEN 'song' THEN
        UPDATE songs SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.liked_id;
      WHEN 'album' THEN
        UPDATE albums SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.liked_id;
      WHEN 'playlist' THEN
        UPDATE playlists SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.liked_id;
    END CASE;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like count updates
CREATE TRIGGER update_like_count_trigger
  AFTER INSERT OR DELETE ON user_likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.followed_type = 'artist' THEN
      UPDATE artists SET followers_count = followers_count + 1 WHERE id = NEW.followed_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.followed_type = 'artist' THEN
      UPDATE artists SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.followed_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower count updates
CREATE TRIGGER update_follower_count_trigger
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_count();