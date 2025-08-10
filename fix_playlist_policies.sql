-- Fix RLS policies for playlist tables to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view playlists they collaborate on" ON playlists;
DROP POLICY IF EXISTS "Users can view public playlists" ON playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Collaborators can update playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;

DROP POLICY IF EXISTS "Users can view their own collaborations" ON playlist_collaborators;
DROP POLICY IF EXISTS "Users can view collaborations for their playlists" ON playlist_collaborators;
DROP POLICY IF EXISTS "Users can add collaborators to their playlists" ON playlist_collaborators;
DROP POLICY IF EXISTS "Users can update collaborations on their playlists" ON playlist_collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators from their playlists" ON playlist_collaborators;
DROP POLICY IF EXISTS "Users can leave collaborations" ON playlist_collaborators;

-- Create simple, non-recursive policies for playlists
CREATE POLICY "Enable read access for playlists" ON playlists
    FOR SELECT USING (
        is_private = false OR 
        user_id = auth.uid()
    );

CREATE POLICY "Enable insert for own playlists" ON playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own playlists" ON playlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own playlists" ON playlists
    FOR DELETE USING (auth.uid() = user_id);

-- Create simple, non-recursive policies for playlist_collaborators
CREATE POLICY "Enable read access for playlist collaborators" ON playlist_collaborators
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for playlist collaborators" ON playlist_collaborators
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for playlist collaborators" ON playlist_collaborators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for playlist collaborators" ON playlist_collaborators
    FOR DELETE USING (auth.uid() = user_id);

-- Create simple policies for playlist_songs
DROP POLICY IF EXISTS "Users can view playlist songs" ON playlist_songs;
DROP POLICY IF EXISTS "Users can add songs to their playlists" ON playlist_songs;
DROP POLICY IF EXISTS "Collaborators can add songs" ON playlist_songs;
DROP POLICY IF EXISTS "Users can update playlist songs" ON playlist_songs;
DROP POLICY IF EXISTS "Users can remove songs from their playlists" ON playlist_songs;

CREATE POLICY "Enable read access for playlist songs" ON playlist_songs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for playlist songs" ON playlist_songs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for playlist songs" ON playlist_songs
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for playlist songs" ON playlist_songs
    FOR DELETE USING (auth.uid() IS NOT NULL);
