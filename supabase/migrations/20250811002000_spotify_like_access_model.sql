-- Purpose: Set up Spotify-like access model with proper RLS policies
BEGIN;

-- 1. Create roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'artist') THEN
    CREATE ROLE artist;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'listener') THEN
    CREATE ROLE listener;
  END IF;
END$$;

-- 2. Public Views (already created in previous migration)
-- tracks_public_view, albums_public_view, artists_public_view, products_public_view

-- 2.1 Ensure required columns exist to avoid policy creation failures
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- 3. RLS Policies for base tables

-- tracks: artists can manage their own tracks
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tracks_artist_all ON public.tracks
  FOR ALL
  TO artist
  USING (artist_id = auth.uid()::uuid)
  WITH CHECK (artist_id = auth.uid()::uuid);

-- For listeners, only published tracks via public view
CREATE POLICY tracks_listener_view ON public.tracks
  FOR SELECT
  TO listener
  USING (COALESCE(is_published, true) = true);

-- albums: artists manage their own
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY albums_artist_all ON public.albums
  FOR ALL
  TO artist
  USING (artist_id = auth.uid()::uuid)
  WITH CHECK (artist_id = auth.uid()::uuid);

-- For listeners, only published albums via public view
CREATE POLICY albums_listener_view ON public.albums
  FOR SELECT
  TO listener
  USING (COALESCE(is_published, true) = true);

-- artists: self-management
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY artists_manage_own ON public.artists
  FOR ALL
  TO artist
  USING (id = auth.uid()::uuid)
  WITH CHECK (id = auth.uid()::uuid);

-- Listeners can view active artists via public view
CREATE POLICY artists_listener_view ON public.artists
  FOR SELECT
  TO listener
  USING (COALESCE(is_active, true) = true);

-- play_events: listeners can create and view own
ALTER TABLE public.play_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY play_events_insert_own ON public.play_events
  FOR INSERT
  TO listener
  WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY play_events_view_own ON public.play_events
  FOR SELECT
  TO listener
  USING (user_id = auth.uid()::uuid);

-- Artists can view play events for their tracks
CREATE POLICY play_events_artist_view ON public.play_events
  FOR SELECT
  TO artist
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks t
      WHERE t.id = track_id
      AND t.artist_id = auth.uid()::uuid
    )
  );

-- listening_sessions: realtime presence
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY listening_sessions_all ON public.listening_sessions
  FOR ALL
  TO listener, artist
  USING (true)
  WITH CHECK (
    CASE 
      WHEN current_user = 'listener' THEN user_id = auth.uid()::uuid
      WHEN current_user = 'artist' THEN artist_id = auth.uid()::uuid
      ELSE false
    END
  );

-- 4. Public functions with appropriate security definer wrappers

-- Premium content URL signing
CREATE OR REPLACE FUNCTION public.get_signed_track_url(p_track_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_premium boolean;
  v_has_access boolean;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if track exists and is published
  SELECT t.is_premium INTO v_is_premium
  FROM public.tracks t
  WHERE t.id = p_track_id
  AND COALESCE(t.is_published, true) = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Track not found or not published';
  END IF;

  -- If premium, verify subscription
  IF v_is_premium THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = v_user_id
      AND us.status = 'active'
      AND (us.current_period_end IS NULL OR us.current_period_end > now())
    ) INTO v_has_access;

    IF NOT v_has_access THEN
      RAISE EXCEPTION 'Premium track requires active subscription';
    END IF;
  END IF;

  -- Return signed URL (replace with actual signing logic)
  RETURN 'https://storage.example.com/tracks/' || p_track_id::text || '?token=' || encode(gen_random_bytes(32), 'hex');
END;
$$;

-- 5. Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO listener;
GRANT INSERT, UPDATE ON public.play_events TO listener;
GRANT INSERT, UPDATE ON public.listening_sessions TO listener;
GRANT EXECUTE ON FUNCTION public.get_signed_track_url TO listener;

GRANT ALL ON ALL TABLES IN SCHEMA public TO artist;
REVOKE DELETE ON public.play_events FROM artist;
REVOKE DELETE ON public.listening_sessions FROM artist;
GRANT EXECUTE ON FUNCTION public.get_signed_track_url TO artist;

-- 6. Enable service-role access for edge functions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;
