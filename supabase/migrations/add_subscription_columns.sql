-- Add missing columns to the user_subscriptions table

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card', 'apple', 'eth'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);

-- Update any existing subscriptions based on their dates
UPDATE user_subscriptions 
SET status = CASE 
  WHEN end_date < NOW() THEN 'expired'
  WHEN auto_renew = false AND end_date > NOW() THEN 'cancelled'
  ELSE 'active'
END
WHERE status IS NULL OR status = '';

-- Add comments to the columns
COMMENT ON COLUMN user_subscriptions.status IS 'Current status of the subscription: active, cancelled, expired, or pending';
COMMENT ON COLUMN user_subscriptions.payment_method IS 'Payment method used for the subscription: card, apple, or eth';

