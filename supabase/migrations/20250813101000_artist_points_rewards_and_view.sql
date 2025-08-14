-- 20250813101000_artist_points_rewards_and_view.sql
-- Purpose: Add generic per-artist rewards table and RPC, and a fan_scores view sourced from fan_tiers

BEGIN;

-- Generic artist rewards audit table (dedup by ref)
CREATE TABLE IF NOT EXISTS public.user_artist_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL,
  ref_type text NOT NULL, -- e.g., 'merch_order','song_purchase','video_purchase','video_watch'
  ref_id uuid,            -- reference ID when available (order id, video id, etc.)
  points_awarded integer NOT NULL,
  rewarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, artist_id, ref_type, ref_id)
);

ALTER TABLE public.user_artist_rewards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_artist_rewards' AND policyname='user_artist_rewards_select'
  ) THEN
    CREATE POLICY user_artist_rewards_select ON public.user_artist_rewards
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_artist_rewards' AND policyname='user_artist_rewards_insert_block'
  ) THEN
    CREATE POLICY user_artist_rewards_insert_block ON public.user_artist_rewards
      FOR INSERT TO authenticated WITH CHECK (false);
  END IF;
END $$;

-- RPC: award points once per (user, artist, ref_type, ref_id)
CREATE OR REPLACE FUNCTION public.award_artist_points_once(
  p_artist_id uuid,
  p_points integer,
  p_ref_type text,
  p_ref_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_fan_tier_id uuid;
  v_current_points integer := 0;
  v_new_points integer := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Insert audit row (enforced unique)
  INSERT INTO public.user_artist_rewards(user_id, artist_id, ref_type, ref_id, points_awarded)
  VALUES (v_user_id, p_artist_id, p_ref_type, p_ref_id, p_points);

  -- Upsert fan_tiers points
  SELECT id, COALESCE(points,0) INTO v_fan_tier_id, v_current_points
  FROM public.fan_tiers WHERE user_id = v_user_id AND artist_id = p_artist_id;

  IF v_fan_tier_id IS NULL THEN
    INSERT INTO public.fan_tiers(user_id, artist_id, tier, points)
    VALUES (v_user_id, p_artist_id, 'Bronze', p_points)
    RETURNING id, points INTO v_fan_tier_id, v_new_points;
  ELSE
    v_new_points := v_current_points + p_points;
    UPDATE public.fan_tiers
    SET points = v_new_points,
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

  RETURN jsonb_build_object('success', true, 'total_points', v_new_points);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'error', 'Reward already granted for this reference');
WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Server error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_artist_points_once(uuid, integer, text, uuid) TO authenticated;

-- View: fan_scores backed by fan_tiers to support leaderboard and rank APIs
CREATE OR REPLACE VIEW public.fan_scores AS
SELECT
  ft.user_id,
  ft.artist_id,
  ft.points,
  ft.points AS total_score,
  0::integer AS streaming_points,
  0::integer AS purchase_points,
  0::integer AS social_points,
  0::integer AS video_points,
  0::integer AS event_points,
  0::integer AS consecutive_days,
  ft.created_at AS fan_since,
  ft.updated_at AS last_updated
FROM public.fan_tiers ft;

COMMIT;
