-- Migration to rename 'enterprise' tier to 'superfan'
BEGIN;

-- Update subscription_plans table
UPDATE subscription_plans
SET name = 'Superfan'
WHERE tier = 'enterprise' AND id = '00000000-0000-0000-0000-000000000003';

-- Update any existing platform_subscriptions with enterprise tier in metadata
UPDATE platform_subscriptions
SET metadata = jsonb_set(metadata, '{tier}', '"superfan"')
WHERE metadata->>'tier' = 'enterprise';

-- Update any existing user profiles with enterprise subscription tier
UPDATE profiles
SET subscription_tier = 'superfan'
WHERE subscription_tier = 'enterprise';

-- Update any existing artist_subscriptions if they have tier references
UPDATE artist_subscriptions
SET metadata = jsonb_set(metadata, '{tier}', '"superfan"')
WHERE metadata->>'tier' = 'enterprise';

-- Update the subscription_plans features for Superfan tier
UPDATE subscription_plans
SET features = '["Everything in Fan tier", "Lossless audio quality", "Artist engagement metrics", "AI-powered insights", "Priority customer support", "Multiple device streaming", "Commercial usage rights", "Beta feature access", "Direct artist communication"]'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Add a comment to document this change
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: free, fan, or superfan';

COMMIT;
