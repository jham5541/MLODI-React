-- Enable RLS on all tables
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_action_logs ENABLE ROW LEVEL SECURITY;

-- Create challenge progress table
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id text NOT NULL,
    current_value integer DEFAULT 0,
    target_value integer NOT NULL,
    started_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    UNIQUE (user_id, challenge_id, status)
);

-- Create action logs table
CREATE TABLE IF NOT EXISTS public.challenge_action_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id text NOT NULL,
    action_type text NOT NULL,
    action_value integer DEFAULT 1,
    timestamp timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON public.challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_status ON public.challenge_progress(status);
CREATE INDEX IF NOT EXISTS idx_challenge_action_logs_user_id ON public.challenge_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_action_logs_challenge_id ON public.challenge_action_logs(challenge_id);

-- RLS policies for challenge_progress
CREATE POLICY "Users can read their own progress"
    ON public.challenge_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON public.challenge_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON public.challenge_progress
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS policies for challenge_action_logs
CREATE POLICY "Users can read their own action logs"
    ON public.challenge_action_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action logs"
    ON public.challenge_action_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.challenge_progress TO authenticated;
GRANT SELECT, INSERT ON public.challenge_action_logs TO authenticated;
