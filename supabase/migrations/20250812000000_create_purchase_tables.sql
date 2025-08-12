-- Create purchase tables for songs, albums, videos, and tickets
CREATE TABLE IF NOT EXISTS song_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('apple_pay', 'web3_wallet')),
    price DECIMAL(10,2) NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS album_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('apple_pay', 'web3_wallet')),
    price DECIMAL(10,2) NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('apple_pay', 'web3_wallet')),
    price DECIMAL(10,2) NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_date_id UUID REFERENCES tour_dates(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('apple_pay', 'web3_wallet')),
    tickets JSONB NOT NULL DEFAULT '[]'::jsonb,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_song_purchases_user_id ON song_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_album_purchases_user_id ON album_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_video_purchases_user_id ON video_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_user_id ON ticket_purchases(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE song_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (idempotent)
-- Users can view their own purchases
DROP POLICY IF EXISTS "Users can view their own song purchases" ON song_purchases;
CREATE POLICY "Users can view their own song purchases"
    ON song_purchases FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own album purchases" ON album_purchases;
CREATE POLICY "Users can view their own album purchases"
    ON album_purchases FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own video purchases" ON video_purchases;
CREATE POLICY "Users can view their own video purchases"
    ON video_purchases FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own ticket purchases" ON ticket_purchases;
CREATE POLICY "Users can view their own ticket purchases"
    ON ticket_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own purchases
DROP POLICY IF EXISTS "Users can insert their own song purchases" ON song_purchases;
CREATE POLICY "Users can insert their own song purchases"
    ON song_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own album purchases" ON album_purchases;
CREATE POLICY "Users can insert their own album purchases"
    ON album_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own video purchases" ON video_purchases;
CREATE POLICY "Users can insert their own video purchases"
    ON video_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ticket purchases" ON ticket_purchases;
CREATE POLICY "Users can insert their own ticket purchases"
    ON ticket_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Enable realtime for these tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'song_purchases'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.song_purchases';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'album_purchases'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.album_purchases';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'video_purchases'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.video_purchases';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ticket_purchases'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_purchases';
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (idempotent)
DROP TRIGGER IF EXISTS update_song_purchases_updated_at ON song_purchases;
CREATE TRIGGER update_song_purchases_updated_at
    BEFORE UPDATE ON song_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_album_purchases_updated_at ON album_purchases;
CREATE TRIGGER update_album_purchases_updated_at
    BEFORE UPDATE ON album_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_purchases_updated_at ON video_purchases;
CREATE TRIGGER update_video_purchases_updated_at
    BEFORE UPDATE ON video_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_purchases_updated_at ON ticket_purchases;
CREATE TRIGGER update_ticket_purchases_updated_at
    BEFORE UPDATE ON ticket_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
