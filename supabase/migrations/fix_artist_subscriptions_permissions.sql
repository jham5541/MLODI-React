-- Enable RLS on artist_subscriptions table if not already enabled
ALTER TABLE artist_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own artist subscriptions" ON artist_subscriptions;
DROP POLICY IF EXISTS "Users can create their own artist subscriptions" ON artist_subscriptions;
DROP POLICY IF EXISTS "Users can update their own artist subscriptions" ON artist_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own artist subscriptions" ON artist_subscriptions;

-- Create policy for users to view their own subscriptions
CREATE POLICY "Users can view their own artist subscriptions" ON artist_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to create their own subscriptions
CREATE POLICY "Users can create their own artist subscriptions" ON artist_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own subscriptions
CREATE POLICY "Users can update their own artist subscriptions" ON artist_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to cancel/delete their own subscriptions
CREATE POLICY "Users can delete their own artist subscriptions" ON artist_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Also check and fix permissions for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;

-- Create policy for users to view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to create their own transactions
CREATE POLICY "Users can create their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON artist_subscriptions TO authenticated;
GRANT SELECT, INSERT ON transactions TO authenticated;

-- Ensure the tables have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_subscriptions_user_id ON artist_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_subscriptions_artist_id ON artist_subscriptions(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_subscriptions_status ON artist_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
