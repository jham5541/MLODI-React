-- Enable RLS on purchase tables
ALTER TABLE public.song_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for song_purchases (idempotent)
DROP POLICY IF EXISTS "Users can view their own song purchases" ON public.song_purchases;
CREATE POLICY "Users can view their own song purchases"
    ON public.song_purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for album_purchases (idempotent)
DROP POLICY IF EXISTS "Users can view their own album purchases" ON public.album_purchases;
CREATE POLICY "Users can view their own album purchases"
    ON public.album_purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for video_purchases (idempotent)
DROP POLICY IF EXISTS "Users can view their own video purchases" ON public.video_purchases;
CREATE POLICY "Users can view their own video purchases"
    ON public.video_purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for ticket_purchases (idempotent)
DROP POLICY IF EXISTS "Users can view their own ticket purchases" ON public.ticket_purchases;
CREATE POLICY "Users can view their own ticket purchases"
    ON public.ticket_purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.song_purchases TO authenticated;
GRANT SELECT ON public.album_purchases TO authenticated;
GRANT SELECT ON public.video_purchases TO authenticated;
GRANT SELECT ON public.ticket_purchases TO authenticated;
