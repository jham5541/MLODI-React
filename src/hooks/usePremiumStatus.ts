import { useSubscriptionStore } from '../store/subscriptionStore';

// Centralized hook for checking a user's premium subscription status
// Usage: const { isPremium, tier, isFreeTier, isFanTier, isSuperfanTier } = usePremiumStatus();
export function usePremiumStatus() {
  const { subscription } = useSubscriptionStore();
  const tier = subscription?.tier ?? 'free';
  const isPremium = tier !== 'free';

  return {
    isPremium,
    tier,
    isFreeTier: tier === 'free',
    isFanTier: tier === 'fan',
    isSuperfanTier: tier === 'superfan',
  };
}

