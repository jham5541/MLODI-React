-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'fan', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card', 'apple', 'eth')),
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_subscriptions' 
                 AND column_name = 'status') THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'cancelled', 'expired', 'pending'));
  END IF;

  -- Add payment_method column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_subscriptions' 
                 AND column_name = 'payment_method') THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'card' 
    CHECK (payment_method IN ('card', 'apple', 'eth'));
  END IF;

  -- Add transaction_hash column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_subscriptions' 
                 AND column_name = 'transaction_hash') THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN transaction_hash TEXT;
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_subscriptions' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);

-- Update any existing subscriptions based on their dates
UPDATE user_subscriptions 
SET status = CASE 
  WHEN end_date < NOW() THEN 'expired'
  WHEN auto_renew = false AND end_date > NOW() THEN 'cancelled'
  ELSE 'active'
END
WHERE status IS NULL OR status = '';

-- Add RLS (Row Level Security) policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE user_subscriptions IS 'Stores user subscription information for the platform';
COMMENT ON COLUMN user_subscriptions.id IS 'Unique identifier for the subscription';
COMMENT ON COLUMN user_subscriptions.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN user_subscriptions.plan_id IS 'Identifier for the subscription plan';
COMMENT ON COLUMN user_subscriptions.tier IS 'Subscription tier: free, fan, or enterprise';
COMMENT ON COLUMN user_subscriptions.status IS 'Current status of the subscription: active, cancelled, expired, or pending';
COMMENT ON COLUMN user_subscriptions.start_date IS 'When the subscription started';
COMMENT ON COLUMN user_subscriptions.end_date IS 'When the subscription ends';
COMMENT ON COLUMN user_subscriptions.auto_renew IS 'Whether the subscription auto-renews';
COMMENT ON COLUMN user_subscriptions.payment_method IS 'Payment method used: card, apple, or eth';
COMMENT ON COLUMN user_subscriptions.transaction_hash IS 'Transaction hash for blockchain payments';
COMMENT ON COLUMN user_subscriptions.created_at IS 'When the subscription record was created';
COMMENT ON COLUMN user_subscriptions.updated_at IS 'When the subscription record was last updated';

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at column
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
