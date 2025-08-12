-- 20250811223620_extend_transactions_for_subscriptions.sql
-- Purpose: Ensure transactions table includes columns the app writes during subscription confirmation

BEGIN;

-- Create transactions table if it does not exist with expected columns
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT,
    amount NUMERIC(12,2),
    currency TEXT,
    status TEXT,
    transaction_hash TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add any missing columns to existing table
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS currency TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

COMMIT;
