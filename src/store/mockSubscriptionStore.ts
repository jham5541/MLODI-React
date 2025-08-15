/**
 * Mock Subscription Store for Development
 * This allows testing subscription features without database access
 */

import { create } from 'zustand';
import { SubscriptionPlan, UserSubscription } from './subscriptionStore';

interface MockSubscriptionState {
  subscription: UserSubscription | null;
  selectedPlan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  mockTier: 'free' | 'fan' | 'superfan';
  
  // Actions
  fetchSubscription: () => Promise<void>;
  selectSubscription: (plan: SubscriptionPlan) => void;
  confirmSubscription: (paymentMethod: 'card' | 'apple' | 'eth') => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  toggleAutoRenew: () => Promise<void>;
  hasActiveSubscription: () => boolean;
  getSubscriptionPlans: () => SubscriptionPlan[];
  setMockTier: (tier: 'free' | 'fan' | 'superfan') => void;
}

// Mock subscription plans
const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Free',
    tier: 'free',
    price: { usd: 0, eth: 0 },
    duration: 365,
    features: [
      'Access to basic music library',
      '30-second previews',
      'Standard audio quality',
      'Basic playlists',
      'Community features'
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Fan',
    tier: 'fan',
    price: { usd: 9.99, eth: 0.005 },
    duration: 30,
    features: [
      'Full song access',
      'High-quality audio streaming',
      'Unlimited playlists',
      'Download for offline listening',
      'Early access to new releases',
      'Artist exclusive content',
      'Ad-free experience'
    ],
    isPopular: true
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Superfan',
    tier: 'superfan',
    price: { usd: 29.99, eth: 0.015 },
    duration: 30,
    features: [
      'Everything in Fan tier',
      'Lossless audio quality',
      'Artist engagement metrics',
      'AI-powered insights',
      'Priority customer support',
      'Multiple device streaming',
      'Commercial usage rights',
      'Beta feature access',
      'Direct artist communication'
    ]
  }
];

export const useMockSubscriptionStore = create<MockSubscriptionState>((set, get) => ({
  subscription: null,
  selectedPlan: null,
  isLoading: false,
  error: null,
  mockTier: 'free',

  fetchSubscription: async () => {
    set({ isLoading: true });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { mockTier } = get();
    const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.tier === mockTier);
    
    if (mockTier !== 'free' && plan) {
      const mockSubscription: UserSubscription = {
        id: `mock-sub-${Date.now()}`,
        user_id: 'mock-user-123',
        plan_id: plan.id,
        tier: mockTier,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        payment_method: 'card',
        metadata: {
          tier: mockTier,
          auto_renew: true,
          payment_method: 'card',
          price: plan.price.usd,
          currency: 'USD'
        },
        subscription_plans: plan
      };
      
      set({ subscription: mockSubscription, isLoading: false });
    } else {
      set({ subscription: null, isLoading: false });
    }
  },

  selectSubscription: (plan: SubscriptionPlan) => {
    set({ selectedPlan: plan });
  },

  confirmSubscription: async (paymentMethod: 'card' | 'apple' | 'eth') => {
    const { selectedPlan } = get();
    if (!selectedPlan) return false;

    set({ isLoading: true, error: null });

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockSubscription: UserSubscription = {
      id: `mock-sub-${Date.now()}`,
      user_id: 'mock-user-123',
      plan_id: selectedPlan.id,
      tier: selectedPlan.tier,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString(),
      auto_renew: selectedPlan.tier !== 'free',
      payment_method: paymentMethod,
      metadata: {
        tier: selectedPlan.tier,
        auto_renew: selectedPlan.tier !== 'free',
        payment_method: paymentMethod,
        price: selectedPlan.price.usd,
        currency: 'USD'
      },
      subscription_plans: selectedPlan
    };

    set({ 
      subscription: mockSubscription, 
      selectedPlan: null, 
      isLoading: false,
      error: null,
      mockTier: selectedPlan.tier
    });

    console.log('🎉 Mock subscription confirmed:', selectedPlan.tier);
    return true;
  },

  cancelSubscription: async () => {
    const { subscription } = get();
    if (!subscription) return;

    set({ isLoading: true, error: null });

    await new Promise(resolve => setTimeout(resolve, 1000));

    set({ 
      subscription: { 
        ...subscription, 
        status: 'cancelled', 
        metadata: { ...subscription.metadata, auto_renew: false } 
      },
      isLoading: false,
      mockTier: 'free'
    });

    console.log('🚫 Mock subscription cancelled');
  },

  toggleAutoRenew: async () => {
    const { subscription } = get();
    if (!subscription) return;

    set({ isLoading: true, error: null });

    await new Promise(resolve => setTimeout(resolve, 500));

    const currentAutoRenew = subscription.metadata?.auto_renew ?? true;
    const newAutoRenew = !currentAutoRenew;

    set({ 
      subscription: { 
        ...subscription, 
        metadata: { ...subscription.metadata, auto_renew: newAutoRenew } 
      },
      isLoading: false 
    });

    console.log(`🔄 Mock auto-renew toggled to: ${newAutoRenew}`);
  },

  hasActiveSubscription: () => {
    const { subscription } = get();
    if (!subscription || subscription.status !== 'active') return false;
    
    const tier = subscription.metadata?.tier || subscription.subscription_plans?.tier || subscription.tier;
    if (tier === 'free') return false;
    
    if (subscription.expires_at) {
      const expiryDate = new Date(subscription.expires_at);
      return expiryDate > new Date();
    }
    
    return true;
  },

  getSubscriptionPlans: () => MOCK_SUBSCRIPTION_PLANS,

  setMockTier: (tier: 'free' | 'fan' | 'superfan') => {
    set({ mockTier: tier });
    console.log(`🎭 Mock tier set to: ${tier}`);
    // Refetch to update the subscription
    get().fetchSubscription();
  }
}));
