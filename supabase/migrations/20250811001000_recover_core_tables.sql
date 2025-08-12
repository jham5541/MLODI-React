-- 20250811001000_recover_core_tables.sql
-- Purpose: Safely recover core tables and compatibility views used by the mobile and project apps.
-- Strategy: Create tables IF NOT EXISTS with minimal columns required by the app. Adds basic indexes and RLS placeholders.

BEGIN;

-- Enable extensions needed
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid

-- artists
CREATE TABLE IF NOT EXISTS public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  avatar_url text,
  is_verified boolean DEFAULT false,
  followers_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- albums
CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  is_published boolean DEFAULT true,
  release_date date,
  total_tracks integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Ensure critical columns exist on existing installations
ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
-- Indexes conditional on table/column existence
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='albums' AND column_name='artist_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_albums_artist ON public.albums(artist_id);
  END IF;
END$$;

-- tracks (core music table)
CREATE TABLE IF NOT EXISTS public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  is_published boolean DEFAULT true,
  play_count integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  genre text,
  duration_ms integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Ensure critical columns exist on existing installations
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Tracks indexes conditional on columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tracks' AND column_name='artist_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON public.tracks(artist_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='tracks' AND column_name='album_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tracks_album ON public.tracks(album_id);
  END IF;
END$$;

-- Compatibility view for legacy references to "songs" (defensive check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tracks'
  ) THEN
    DROP VIEW IF EXISTS public.songs;
    CREATE VIEW public.songs AS SELECT * FROM public.tracks;
  END IF;
END$$;

-- comments on tracks
CREATE TABLE IF NOT EXISTS public.track_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- Track comments index conditional on column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='track_comments' AND column_name='track_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_track_comments_track ON public.track_comments(track_id);
  END IF;
END$$;

-- listening sessions used by realtime service
CREATE TABLE IF NOT EXISTS public.listening_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  song_id uuid,
  artist_id uuid,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  is_active boolean DEFAULT true
);
-- Listening sessions indexes conditional on columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='listening_sessions' AND column_name='user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='listening_sessions' AND column_name='is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listening_sessions_user_active ON public.listening_sessions(user_id, is_active);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='listening_sessions' AND column_name='artist_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='listening_sessions' AND column_name='is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listening_sessions_artist_active ON public.listening_sessions(artist_id, is_active);
  END IF;
END$$;

-- marketplace / commerce minimal schema
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  type text,
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  category_id uuid,
  is_public boolean DEFAULT true,
  is_active boolean DEFAULT true,
  is_on_sale boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);
-- Carts index conditional on column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='carts' AND column_name='user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts(user_id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- Cart items index conditional on all columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='cart_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='product_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='variant_id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_cart_product_variant
      ON public.cart_items (cart_id, product_id, coalesce(variant_id::text, 'null'));
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_payment_id text,
  amount numeric(12,2),
  currency text,
  status text,
  created_at timestamptz DEFAULT now()
);
-- Transactions index conditional on column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='transactions' AND column_name='provider_payment_id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_provider_payment_id 
      ON public.transactions(provider_payment_id);
  END IF;
END$$;

-- user library for purchased products
CREATE TABLE IF NOT EXISTS public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  purchased_at timestamptz DEFAULT now()
);
-- User library index conditional on column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_library' AND column_name='user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_library_user ON public.user_library(user_id);
  END IF;
END$$;

-- playlists
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE,
  position integer
);
-- Playlist songs index conditional on columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='playlist_songs' AND column_name='playlist_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='playlist_songs' AND column_name='track_id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_playlist_songs_playlist_track 
      ON public.playlist_songs(playlist_id, track_id);
  END IF;
END$$;

-- subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);
-- User subscriptions index conditional on column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_subscriptions' AND column_name='user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
  END IF;
END$$;

-- reactions/likes minimal
CREATE TABLE IF NOT EXISTS public.user_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_type text NOT NULL,
  liked_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- User likes index conditional on columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_likes' AND column_name='user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_likes' AND column_name='liked_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_likes_user_type ON public.user_likes(user_id, liked_type);
  END IF;
END$$;

-- Public products view (defensive if not already in earlier migration)
DO $$
DECLARE
  has_products boolean := false;
  has_category boolean := false;
  has_is_public boolean := false;
  has_is_active boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products'
  ) INTO has_products;

  IF has_products THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category_id'
    ) INTO has_category;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_public'
    ) INTO has_is_public;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_active'
    ) INTO has_is_active;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.products_public_view AS
       SELECT
         p.id, p.title, p.description, (p.price)::numeric AS price, p.currency, p.type, p.artist_id,
         %s, %s, p.is_on_sale, p.is_featured, p.tags, p.created_at
       FROM public.products p
       %s %s',
       CASE WHEN has_category THEN 'p.category_id' ELSE 'NULL::uuid AS category_id' END,
       CASE WHEN has_is_active THEN 'p.is_active' ELSE 'true AS is_active' END,
       CASE WHEN has_is_public THEN 'WHERE COALESCE(p.is_public, true) = true' ELSE '' END,
       CASE WHEN has_is_active THEN (CASE WHEN has_is_public THEN ' AND COALESCE(p.is_active, true) = true' ELSE 'WHERE COALESCE(p.is_active, true) = true' END) ELSE '' END
    );
  ELSE
    -- Create empty-compatible view
    EXECUTE 'CREATE OR REPLACE VIEW public.products_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS title, NULL::text AS description,
                    NULL::numeric AS price, NULL::text AS currency, NULL::text AS type,
                    NULL::uuid AS artist_id, NULL::uuid AS category_id, true AS is_active,
                    false AS is_on_sale, false AS is_featured, NULL::text[] AS tags,
                    NULL::timestamptz AS created_at WHERE false';
  END IF;
END$$;

-- Public views for music (defensive if earlier migration not yet applied)
DO $$
DECLARE
  has_tracks boolean := false;
  has_album boolean := false;
  has_artist boolean := false;
  has_play_count boolean := false;
  has_is_published boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tracks'
  ) INTO has_tracks;

  IF has_tracks THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tracks' AND column_name='album_id'
    ) INTO has_album;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tracks' AND column_name='artist_id'
    ) INTO has_artist;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tracks' AND column_name='play_count'
    ) INTO has_play_count;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tracks' AND column_name='is_published'
    ) INTO has_is_published;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.tracks_public_view AS
       SELECT t.id, t.title, %s, %s, %s, t.created_at
       FROM public.tracks t
       %s',
       CASE WHEN has_album THEN 't.album_id' ELSE 'NULL::uuid AS album_id' END,
       CASE WHEN has_artist THEN 't.artist_id' ELSE 'NULL::uuid AS artist_id' END,
       CASE WHEN has_play_count THEN 't.play_count' ELSE '0 AS play_count' END,
       CASE WHEN has_is_published THEN 'WHERE COALESCE(t.is_published, true) = true' ELSE '' END
    );
  ELSE
    -- Create empty-compatible view
    EXECUTE 'CREATE OR REPLACE VIEW public.tracks_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS title, NULL::uuid AS album_id,
                    NULL::uuid AS artist_id, 0 AS play_count, NULL::timestamptz AS created_at
             WHERE false';
  END IF;
END$$;

-- Public albums view (defensive if earlier migration not yet applied)
DO $$
DECLARE
  has_albums boolean := false;
  has_is_published boolean := false;
  has_artist boolean := false;
  has_release_date boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='albums'
  ) INTO has_albums;

  IF has_albums THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='is_published'
    ) INTO has_is_published;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='artist_id'
    ) INTO has_artist;
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='albums' AND column_name='release_date'
    ) INTO has_release_date;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.albums_public_view AS
       SELECT a.id, a.title, %s, %s
       FROM public.albums a
       %s',
       CASE WHEN has_artist THEN 'a.artist_id' ELSE 'NULL::uuid AS artist_id' END,
       CASE WHEN has_release_date THEN 'a.release_date' ELSE 'NULL::date AS release_date' END,
       CASE WHEN has_is_published THEN 'WHERE COALESCE(a.is_published, true) = true' ELSE '' END
    );
  ELSE
    -- Create empty-compatible view
    EXECUTE 'CREATE OR REPLACE VIEW public.albums_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS title,
                    NULL::uuid AS artist_id, NULL::date AS release_date
             WHERE false';
  END IF;
END$$;

-- Public artists view (defensive if earlier migration not yet applied)
DO $$
DECLARE
  has_artists boolean := false;
  has_is_active boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='artists'
  ) INTO has_artists;

  IF has_artists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='artists' AND column_name='is_active'
    ) INTO has_is_active;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.artists_public_view AS
       SELECT r.id, r.name
       FROM public.artists r
       %s',
       CASE WHEN has_is_active THEN 'WHERE COALESCE(r.is_active, true) = true' ELSE '' END
    );
  ELSE
    -- Create empty-compatible view
    EXECUTE 'CREATE OR REPLACE VIEW public.artists_public_view AS
             SELECT NULL::uuid AS id, NULL::text AS name
             WHERE false';
  END IF;
END$$;

GRANT SELECT ON public.tracks_public_view, public.albums_public_view, public.artists_public_view, public.products_public_view TO anon, authenticated;

COMMIT;

