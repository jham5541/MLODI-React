-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'fan', 'enterprise')),
  price_usd DECIMAL(10, 2) NOT NULL,
  price_eth DECIMAL(10, 6),
  duration_days INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, tier, price_usd, price_eth, duration_days, features, is_popular) VALUES
('00000000-0000-0000-0000-000000000001', 'Free', 'free', 0.00, 0.000000, 365, 
  '["Access to basic music library", "30-second previews", "Standard audio quality", "Basic playlists", "Community features"]'::jsonb, 
  false),
('00000000-0000-0000-0000-000000000002', 'Fan', 'fan', 9.99, 0.005000, 30, 
  '["Full song access", "High-quality audio streaming", "Unlimited playlists", "Download for offline listening", "Early access to new releases", "Artist exclusive content", "Ad-free experience"]'::jsonb, 
  true),
('00000000-0000-0000-0000-000000000003', 'Enterprise', 'enterprise', 29.99, 0.015000, 30, 
  '["Everything in Fan tier", "Lossless audio quality", "Advanced analytics", "Priority customer support", "Multiple device streaming", "Commercial usage rights", "Beta feature access", "Direct artist communication"]'::jsonb, 
  false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_usd = EXCLUDED.price_usd,
  price_eth = EXCLUDED.price_eth,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans for the platform';
COMMENT ON COLUMN subscription_plans.id IS 'Unique identifier for the plan';
COMMENT ON COLUMN subscription_plans.name IS 'Display name of the plan';
COMMENT ON COLUMN subscription_plans.tier IS 'Subscription tier level';
COMMENT ON COLUMN subscription_plans.price_usd IS 'Price in USD';
COMMENT ON COLUMN subscription_plans.price_eth IS 'Price in ETH';
COMMENT ON COLUMN subscription_plans.duration_days IS 'Duration of the subscription in days';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of features included in the plan';
COMMENT ON COLUMN subscription_plans.is_popular IS 'Whether this plan should be highlighted as popular';
COMMENT ON COLUMN subscription_plans.is_active IS 'Whether this plan is currently available for purchase';

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
