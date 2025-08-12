BEGIN;

-- 1) Public views (avoid non-existent columns; keep a stable minimal shape)
-- Create tracks_public_view defensively based on available schema
DO $$
DECLARE
  src_table text;
  has_album boolean := false;
  has_artist boolean := false;
  has_is_published boolean := false;
BEGIN
  -- Prefer "tracks" table; fallback to "songs"
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tracks'
  ) THEN
    src_table := 'tracks';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'songs'
  ) THEN
    src_table := 'songs';
  ELSE
    RAISE NOTICE 'Neither public.tracks nor public.songs exists; skipping tracks_public_view creation';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = src_table AND column_name = 'album_id'
  ) INTO has_album;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = src_table AND column_name = 'artist_id'
  ) INTO has_artist;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = src_table AND column_name = 'is_published'
  ) INTO has_is_published;

  EXECUTE 'DROP VIEW IF EXISTS public.tracks_public_view CASCADE';

  EXECUTE format(
    'CREATE OR REPLACE VIEW public.tracks_public_view AS
     SELECT
       t.id,
       t.title,
       %s,
       %s
     FROM public.%I t
     %s',
     CASE WHEN has_album THEN 't.album_id' ELSE 'NULL::uuid AS album_id' END,
     CASE WHEN has_artist THEN 't.artist_id' ELSE 'NULL::uuid AS artist_id' END,
     src_table,
     CASE WHEN has_is_published THEN 'WHERE COALESCE(t.is_published, true) = true' ELSE '' END
  );
END $$;

-- Albums public view (defensive)
DO $$
DECLARE
  has_albums boolean := false;
  has_is_published boolean := false;
  has_artist boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='albums'
  ) INTO has_albums;

  EXECUTE 'DROP VIEW IF EXISTS public.albums_public_view CASCADE';

  IF has_albums THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='is_published'
    ) INTO has_is_published;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='artist_id'
    ) INTO has_artist;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.albums_public_view AS
       SELECT a.id, a.title, %s
       FROM public.albums a %s',
       CASE WHEN has_artist THEN 'a.artist_id' ELSE 'NULL::uuid AS artist_id' END,
       CASE WHEN has_is_published THEN 'WHERE COALESCE(a.is_published, true) = true' ELSE '' END
    );
  ELSE
    -- Create empty-compatible view so app queries do not fail
    EXECUTE 'CREATE OR REPLACE VIEW public.albums_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS title, NULL::uuid AS artist_id
             WHERE false';
  END IF;
END$$;

-- Artists public view (defensive)
DO $$
DECLARE
  has_artists boolean := false;
  has_is_active boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='artists'
  ) INTO has_artists;

  EXECUTE 'DROP VIEW IF EXISTS public.artists_public_view CASCADE';

  IF has_artists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='artists' AND column_name='is_active'
    ) INTO has_is_active;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.artists_public_view AS
       SELECT r.id, r.name
       FROM public.artists r %s',
       CASE WHEN has_is_active THEN 'WHERE COALESCE(r.is_active, true) = true' ELSE '' END
    );
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW public.artists_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS name
             WHERE false';
  END IF;
END$$;

GRANT SELECT ON public.tracks_public_view TO anon, authenticated;
GRANT SELECT ON public.albums_public_view TO anon, authenticated;
GRANT SELECT ON public.artists_public_view TO anon, authenticated;

-- 2) Playback events (table + indexes + policies + trigger)
CREATE TABLE IF NOT EXISTS public.play_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  device text,
  app_version text,
  listened_ms integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  _counted boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_play_events_track_time_desc
  ON public.play_events (track_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_play_events_user_track_time_desc
  ON public.play_events (user_id, track_id, started_at DESC);

ALTER TABLE public.play_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='play_events' AND policyname='play_events_select_own'
  ) THEN
    CREATE POLICY play_events_select_own ON public.play_events FOR SELECT
      USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='play_events' AND policyname='play_events_insert_self'
  ) THEN
    CREATE POLICY play_events_insert_self ON public.play_events FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='play_events' AND policyname='play_events_update_self'
  ) THEN
    CREATE POLICY play_events_update_self ON public.play_events FOR UPDATE
      USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
      WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.fn_play_events_count_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW._counted THEN
    RETURN NEW;
  END IF;

  -- Count play when completed or >= 30s listened
  IF NEW.completed OR NEW.listened_ms >= 30000 THEN
    UPDATE public.tracks
      SET play_count = COALESCE(play_count, 0) + 1
      WHERE id = NEW.track_id;
    NEW._counted := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_play_events_count ON public.play_events;
CREATE TRIGGER trg_play_events_count
AFTER UPDATE ON public.play_events
FOR EACH ROW
WHEN (OLD.completed IS DISTINCT FROM NEW.completed OR OLD.listened_ms IS DISTINCT FROM NEW.listened_ms)
EXECUTE FUNCTION public.fn_play_events_count_trigger();

-- 3) Premium gating RPC (stub: returns a placeholder; replace with your signer integration later)
DROP FUNCTION IF EXISTS public.get_signed_audio_url(uuid);
CREATE OR REPLACE FUNCTION public.get_signed_audio_url(p_track_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_is_premium boolean := false;
BEGIN
  PERFORM 1 FROM public.tracks t WHERE t.id = p_track_id AND COALESCE(t.is_published, true) = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Track not found or not public';
  END IF;

  -- If you have a premium flag on tracks, uncomment and enforce
  -- SELECT t.is_premium INTO v_is_premium FROM public.tracks t WHERE t.id = p_track_id;
  -- IF COALESCE(v_is_premium, false) THEN
  --   PERFORM 1 FROM public.user_subscriptions us
  --   WHERE us.user_id = v_user
  --     AND us.status = 'active'
  --     AND (us.current_period_end IS NULL OR us.current_period_end > now());
  --   IF NOT FOUND THEN
  --     RAISE EXCEPTION 'Premium track requires active subscription';
  --   END IF;
  -- END IF;

  RETURN 'https://signed.example/audio/' || p_track_id::text || '?token=shortlived';
END;
$$;

REVOKE ALL ON FUNCTION public.get_signed_audio_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_signed_audio_url(uuid) TO authenticated, anon;

-- 4) Commerce: public products view (defensive if table missing)
DO $$
DECLARE
  has_products boolean := false;
  has_is_public boolean := false;
  has_is_active boolean := false;
  has_category boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products'
  ) INTO has_products;

  EXECUTE 'DROP VIEW IF EXISTS public.products_public_view CASCADE';

  IF has_products THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_public'
    ) INTO has_is_public;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_active'
    ) INTO has_is_active;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category_id'
    ) INTO has_category;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.products_public_view AS
       SELECT
         p.id,
         p.title,
         p.description,
         p.price,
         p.currency,
         p.type,
         p.artist_id,
         %s,
         %s,
         p.is_on_sale,
         p.is_featured,
         p.tags,
         p.created_at
       FROM public.products p
       %s %s',
       CASE WHEN has_category THEN 'p.category_id' ELSE 'NULL::uuid AS category_id' END,
       CASE WHEN has_is_active THEN 'p.is_active' ELSE 'true AS is_active' END,
       CASE WHEN has_is_public THEN 'WHERE COALESCE(p.is_public, true) = true' ELSE '' END,
       CASE WHEN has_is_active THEN (CASE WHEN has_is_public THEN ' AND COALESCE(p.is_active, true) = true' ELSE 'WHERE COALESCE(p.is_active, true) = true' END) ELSE '' END
    );
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW public.products_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS title, NULL::text AS description,
                    NULL::numeric AS price, NULL::text AS currency, NULL::text AS type,
                    NULL::uuid AS artist_id, NULL::uuid AS category_id, true AS is_active,
                    false AS is_on_sale, false AS is_featured, NULL::text[] AS tags,
                    NULL::timestamptz AS created_at WHERE false';
  END IF;
END$$;

GRANT SELECT ON public.products_public_view TO anon, authenticated;

-- 5) Search suggest (materialized view + RPC)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Search index MV created defensively based on available tables/columns
DO $$
DECLARE
  has_tracks boolean := false;
  has_albums boolean := false;
  has_artists boolean := false;
  tracks_has_is_published boolean := false;
  albums_has_is_published boolean := false;
  artists_has_is_active boolean := false;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tracks') INTO has_tracks;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='albums') INTO has_albums;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='artists') INTO has_artists;

  IF has_tracks THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tracks' AND column_name='is_published'
    ) INTO tracks_has_is_published;
  END IF;
  IF has_albums THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='is_published'
    ) INTO albums_has_is_published;
  END IF;
  IF has_artists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='artists' AND column_name='is_active'
    ) INTO artists_has_is_active;
  END IF;

  -- Drop existing MV safely
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname='public' AND matviewname='search_index') THEN
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.search_index';
  END IF;

  -- Construct MV SQL parts conditionally
  EXECUTE 'CREATE MATERIALIZED VIEW public.search_index AS ' ||
    (
      CASE WHEN has_tracks THEN
        format(
          'SELECT ''track''::text AS type, t.id::text AS id, t.title AS title, ' ||
          'setweight(to_tsvector(''simple'', coalesce(t.title,'''')), ''A'') AS doc, lower(t.title) AS kw ' ||
          'FROM public.tracks t %s',
          CASE WHEN tracks_has_is_published THEN 'WHERE COALESCE(t.is_published, true) = true' ELSE '' END
        )
      ELSE
        'SELECT ''track''::text AS type, NULL::text AS id, NULL::text AS title, ' ||
        'setweight(to_tsvector(''simple'', ''''), ''A'') AS doc, NULL::text AS kw WHERE false'
      END
    ) ||
    ' UNION ALL ' ||
    (
      CASE WHEN has_albums THEN
        format(
          'SELECT ''album''::text, a.id::text, a.title, ' ||
          'setweight(to_tsvector(''simple'', coalesce(a.title,'''')), ''A''), lower(a.title) ' ||
          'FROM public.albums a %s',
          CASE WHEN albums_has_is_published THEN 'WHERE COALESCE(a.is_published, true) = true' ELSE '' END
        )
      ELSE
        'SELECT ''album''::text, NULL::text, NULL::text, setweight(to_tsvector(''simple'', ''''), ''A''), NULL::text WHERE false'
      END
    ) ||
    ' UNION ALL ' ||
    (
      CASE WHEN has_artists THEN
        format(
          'SELECT ''artist''::text, r.id::text, r.name, ' ||
          'setweight(to_tsvector(''simple'', coalesce(r.name,'''')), ''A''), lower(r.name) ' ||
          'FROM public.artists r %s',
          CASE WHEN artists_has_is_active THEN 'WHERE COALESCE(r.is_active, true) = true' ELSE '' END
        )
      ELSE
        'SELECT ''artist''::text, NULL::text, NULL::text, setweight(to_tsvector(''simple'', ''''), ''A''), NULL::text WHERE false'
      END
    );
END$$;

CREATE INDEX IF NOT EXISTS idx_search_index_kw ON public.search_index USING gin (kw gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_index_doc ON public.search_index USING gin (doc);

CREATE OR REPLACE FUNCTION public.refresh_search_index()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.search_index;
$$;

CREATE OR REPLACE FUNCTION public.search_suggest(p_q text, p_limit int DEFAULT 10)
RETURNS TABLE (type text, id text, title text)
LANGUAGE sql
STABLE
AS $$
  SELECT s.type, s.id, s.title
  FROM public.search_index s
  WHERE s.kw ILIKE '%' || lower(p_q) || '%'
  ORDER BY similarity(s.kw, lower(p_q)) DESC
  LIMIT greatest(p_limit, 1)
$$;

GRANT EXECUTE ON FUNCTION public.refresh_search_index() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_suggest(text, int) TO anon, authenticated;

-- 6) Uniqueness/index checklist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='playlist_songs') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_playlist_songs_playlist_track
      ON public.playlist_songs (playlist_id, track_id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cart_items') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_cart_product_variant
      ON public.cart_items (cart_id, product_id, coalesce(variant_id::text, 'null'));
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_provider_payment_id
      ON public.transactions (provider_payment_id);
  END IF;
END$$;

COMMIT;

