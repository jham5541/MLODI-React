-- Fix permissions for artist_subscriptions table
ALTER TABLE artist_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create artist subscriptions" ON artist_subscriptions;
DROP POLICY IF EXISTS "Users can view artist subscriptions" ON artist_subscriptions;
DROP POLICY IF EXISTS "Users can update artist subscriptions" ON artist_subscriptions;

-- Allow authenticated users to create their own subscriptions
CREATE POLICY "Users can create artist subscriptions" 
ON artist_subscriptions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view artist subscriptions" 
ON artist_subscriptions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to update their own subscriptions
CREATE POLICY "Users can update artist subscriptions" 
ON artist_subscriptions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix permissions for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;

-- Allow authenticated users to create their own transactions
CREATE POLICY "Users can create transactions" 
ON transactions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own transactions
CREATE POLICY "Users can view transactions" 
ON transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
