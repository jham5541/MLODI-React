-- Quick fix for artist_subscriptions permissions
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE artist_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own subscriptions
CREATE POLICY "Users can create subscriptions" ON artist_subscriptions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view subscriptions" ON artist_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own subscriptions
CREATE POLICY "Users can update subscriptions" ON artist_subscriptions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own transactions
CREATE POLICY "Users can create transactions" ON transactions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own transactions
CREATE POLICY "Users can view transactions" ON transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
