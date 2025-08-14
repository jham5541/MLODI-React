-- 20250813095000_create_listening_rewards_system.sql
-- Purpose: Create secure server-side listening rewards with duplicate prevention
-- Prevents users from gaming the system by awarding points only once per song per user per day

BEGIN;

-- Table to track listening rewards (prevents duplicate rewards)
CREATE TABLE IF NOT EXISTS public.user_listening_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  points_awarded integer NOT NULL DEFAULT 50,
  rewarded_at timestamptz NOT NULL DEFAULT now(),
  -- Ensure one reward per song per user per day
  UNIQUE(user_id, song_id, DATE(rewarded_at))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_listening_rewards_user_date 
  ON public.user_listening_rewards(user_id, DATE(rewarded_at));
CREATE INDEX IF NOT EXISTS idx_user_listening_rewards_artist 
  ON public.user_listening_rewards(artist_id);

-- RLS
ALTER TABLE public.user_listening_rewards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rewards
CREATE POLICY user_listening_rewards_select 
  ON public.user_listening_rewards 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Only the RPC function can insert rewards (not direct user inserts)
CREATE POLICY user_listening_rewards_insert_rpc_only 
  ON public.user_listening_rewards 
  FOR INSERT TO authenticated 
  WITH CHECK (false); -- Block all direct inserts

-- Secure RPC function to award listening points
CREATE OR REPLACE FUNCTION public.award_listening_points(
  p_song_id uuid,
  p_artist_id uuid,
  p_duration_listened_seconds integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  v_user_id uuid;
  v_points_awarded integer := 50;
  v_result jsonb;
  v_fan_tier_id uuid;
  v_current_points integer;
  v_new_points integer;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Validate inputs
  IF p_song_id IS NULL OR p_artist_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Song ID and Artist ID are required'
    );
  END IF;

  -- Optional: Validate minimum listening duration (server-side enforcement)
  -- For now, we trust the client sent this after full completion
  -- In production, you might want to track listening sessions server-side

  -- Check if reward already exists for this user/song/day
  IF EXISTS (
    SELECT 1 FROM public.user_listening_rewards 
    WHERE user_id = v_user_id 
      AND song_id = p_song_id 
      AND DATE(rewarded_at) = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Already rewarded for this song today',
      'points_awarded', 0
    );
  END IF;

  -- Insert reward record (with RLS bypass via SECURITY DEFINER)
  INSERT INTO public.user_listening_rewards (user_id, song_id, artist_id, points_awarded)
  VALUES (v_user_id, p_song_id, p_artist_id, v_points_awarded);

  -- Get or create fan tier for this artist
  SELECT id, points INTO v_fan_tier_id, v_current_points
  FROM public.fan_tiers 
  WHERE user_id = v_user_id AND artist_id = p_artist_id;

  IF v_fan_tier_id IS NULL THEN
    -- Create new fan tier
    INSERT INTO public.fan_tiers (user_id, artist_id, tier, points)
    VALUES (v_user_id, p_artist_id, 'Bronze', v_points_awarded)
    RETURNING id, points INTO v_fan_tier_id, v_new_points;
  ELSE
    -- Update existing fan tier
    v_new_points := v_current_points + v_points_awarded;
    UPDATE public.fan_tiers 
    SET 
      points = v_new_points,
      tier = CASE 
        WHEN v_new_points >= 40000 THEN 'Platinum'
        WHEN v_new_points >= 15000 THEN 'Diamond'
        WHEN v_new_points >= 5000 THEN 'Gold'
        WHEN v_new_points >= 1000 THEN 'Silver'
        ELSE 'Bronze'
      END,
      updated_at = now()
    WHERE id = v_fan_tier_id;
  END IF;

  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points_awarded,
    'total_points', v_new_points,
    'message', 'Listening reward awarded successfully'
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error details for debugging
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Server error: ' || SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.award_listening_points(uuid, uuid, integer) TO authenticated;

-- Optional: RPC to get user's listening reward stats
CREATE OR REPLACE FUNCTION public.get_user_listening_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_today_rewards integer;
  v_total_rewards integer;
  v_total_points integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Count today's rewards
  SELECT COUNT(*) INTO v_today_rewards
  FROM public.user_listening_rewards 
  WHERE user_id = v_user_id AND DATE(rewarded_at) = CURRENT_DATE;

  -- Count total rewards
  SELECT COUNT(*), COALESCE(SUM(points_awarded), 0) INTO v_total_rewards, v_total_points
  FROM public.user_listening_rewards 
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'today_rewards', v_today_rewards,
    'total_rewards', v_total_rewards,
    'total_points_from_listening', v_total_points
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_listening_stats() TO authenticated;

COMMIT;
