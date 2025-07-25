-- Setup Row Level Security (RLS) policies for all tables
-- This migration creates security policies to control data access

-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_stats ENABLE ROW LEVEL SECURITY;

-- Artists policies
CREATE POLICY "Artists are viewable by everyone" ON artists FOR SELECT USING (true);
CREATE POLICY "Artists can be created by authenticated users" ON artists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Artists can be updated by their creators" ON artists FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Albums policies
CREATE POLICY "Public albums are viewable by everyone" ON albums FOR SELECT USING (is_public = true);
CREATE POLICY "Private albums are viewable by artist" ON albums FOR SELECT USING (
  is_public = false AND 
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);
CREATE POLICY "Albums can be created by authenticated users" ON albums FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Albums can be updated by artist" ON albums FOR UPDATE USING (
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);

-- Songs policies
CREATE POLICY "Public songs are viewable by everyone" ON songs FOR SELECT USING (is_public = true);
CREATE POLICY "Private songs are viewable by artist" ON songs FOR SELECT USING (
  is_public = false AND 
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);
CREATE POLICY "Songs can be created by authenticated users" ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Songs can be updated by artist" ON songs FOR UPDATE USING (
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);

-- Playlists policies
CREATE POLICY "Public playlists are viewable by everyone" ON playlists FOR SELECT USING (is_private = false);
CREATE POLICY "Private playlists are viewable by owner and collaborators" ON playlists FOR SELECT USING (
  is_private = true AND (
    owner_id = auth.uid() OR
    id IN (SELECT playlist_id FROM playlist_collaborators WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Playlists can be created by authenticated users" ON playlists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Playlists can be updated by owner" ON playlists FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Playlists can be deleted by owner" ON playlists FOR DELETE USING (owner_id = auth.uid());

-- Playlist collaborators policies
CREATE POLICY "Playlist collaborators are viewable by playlist members" ON playlist_collaborators FOR SELECT USING (
  playlist_id IN (
    SELECT id FROM playlists WHERE 
    owner_id = auth.uid() OR 
    id IN (SELECT playlist_id FROM playlist_collaborators WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Playlist collaborators can be added by owner/admin" ON playlist_collaborators FOR INSERT WITH CHECK (
  playlist_id IN (
    SELECT id FROM playlists WHERE owner_id = auth.uid()
    UNION
    SELECT playlist_id FROM playlist_collaborators WHERE user_id = auth.uid() AND role IN ('admin')
  )
);
CREATE POLICY "Playlist collaborators can be updated by owner/admin" ON playlist_collaborators FOR UPDATE USING (
  playlist_id IN (
    SELECT id FROM playlists WHERE owner_id = auth.uid()
    UNION
    SELECT playlist_id FROM playlist_collaborators WHERE user_id = auth.uid() AND role IN ('admin')
  )
);

-- Playlist songs policies
CREATE POLICY "Playlist songs are viewable by playlist members" ON playlist_songs FOR SELECT USING (
  playlist_id IN (
    SELECT id FROM playlists WHERE 
    is_private = false OR
    owner_id = auth.uid() OR 
    id IN (SELECT playlist_id FROM playlist_collaborators WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Playlist songs can be added by collaborators with permission" ON playlist_songs FOR INSERT WITH CHECK (
  playlist_id IN (
    SELECT id FROM playlists WHERE owner_id = auth.uid()
    UNION
    SELECT playlist_id FROM playlist_collaborators 
    WHERE user_id = auth.uid() AND (permissions->>'can_add')::boolean = true
  )
);
CREATE POLICY "Playlist songs can be removed by collaborators with permission" ON playlist_songs FOR DELETE USING (
  playlist_id IN (
    SELECT id FROM playlists WHERE owner_id = auth.uid()
    UNION
    SELECT playlist_id FROM playlist_collaborators 
    WHERE user_id = auth.uid() AND (permissions->>'can_remove')::boolean = true
  ) OR
  added_by = auth.uid()
);

-- User follows policies
CREATE POLICY "User follows are viewable by the user" ON user_follows FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User follows can be created by the user" ON user_follows FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User follows can be deleted by the user" ON user_follows FOR DELETE USING (user_id = auth.uid());

-- User likes policies
CREATE POLICY "User likes are viewable by the user" ON user_likes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User likes can be created by the user" ON user_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User likes can be deleted by the user" ON user_likes FOR DELETE USING (user_id = auth.uid());

-- Play history policies
CREATE POLICY "Play history is viewable by the user" ON play_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Play history can be created by the user" ON play_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- User profiles policies
CREATE POLICY "User profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "User profiles can be updated by the user" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "User profiles can be inserted by the user" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Fan engagement policies
CREATE POLICY "Fan tiers are viewable by the user and artist" ON fan_tiers FOR SELECT USING (
  user_id = auth.uid() OR 
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);
CREATE POLICY "Fan tiers can be updated by the user" ON fan_tiers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Fan tiers can be inserted by the user" ON fan_tiers FOR INSERT WITH CHECK (user_id = auth.uid());

-- Achievements policies
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (is_active = true);

-- User achievements policies
CREATE POLICY "User achievements are viewable by the user and artist" ON user_achievements FOR SELECT USING (
  user_id = auth.uid() OR 
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);
CREATE POLICY "User achievements can be created by the user" ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Challenges policies
CREATE POLICY "Active challenges are viewable by everyone" ON challenges FOR SELECT USING (is_active = true);

-- User challenge progress policies
CREATE POLICY "User challenge progress is viewable by the user and artist" ON user_challenge_progress FOR SELECT USING (
  user_id = auth.uid() OR 
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);
CREATE POLICY "User challenge progress can be managed by the user" ON user_challenge_progress FOR ALL USING (user_id = auth.uid());

-- Milestones policies
CREATE POLICY "Milestones are viewable by everyone" ON milestones FOR SELECT USING (is_active = true);

-- User milestone progress policies
CREATE POLICY "User milestone progress is viewable by the user and artist" ON user_milestone_progress FOR SELECT USING (
  user_id = auth.uid() OR 
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);
CREATE POLICY "User milestone progress can be managed by the user" ON user_milestone_progress FOR ALL USING (user_id = auth.uid());

-- Analytics policies
CREATE POLICY "User analytics are viewable by the user" ON user_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User analytics can be created by the user" ON user_analytics FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Artist analytics are viewable by the artist" ON artist_analytics FOR SELECT USING (
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);

-- NFT marketplace policies
CREATE POLICY "NFT collections are viewable by everyone" ON nft_collections FOR SELECT USING (true);
CREATE POLICY "NFT collections can be created by artists" ON nft_collections FOR INSERT WITH CHECK (
  artist_id IN (SELECT id FROM artists WHERE wallet_address = auth.uid()::text)
);

CREATE POLICY "NFT listings are viewable by everyone" ON nft_listings FOR SELECT USING (status = 'active');
CREATE POLICY "NFT listings can be created by authenticated users" ON nft_listings FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "NFT listings can be updated by seller" ON nft_listings FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "NFT transactions are viewable by buyer and seller" ON nft_transactions FOR SELECT USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);

CREATE POLICY "Marketplace stats are viewable by everyone" ON marketplace_stats FOR SELECT USING (true);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();