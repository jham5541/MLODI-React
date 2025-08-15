import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { useMockSubscriptionStore } from './mockSubscriptionStore';

export interface SubscriptionPlan {
  id: string;
  name: string;
    tier: 'free' | 'fan' | 'superfan';
  price: {
    usd: number;
    eth: number;
  };
  duration: number; // days
  features: string[];
  isPopular?: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id?: string;
  tier?: 'free' | 'fan' | 'superfan';
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at?: string;
  auto_renew?: boolean;
  payment_method?: 'card' | 'apple' | 'eth';
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  subscription_plans?: SubscriptionPlan;
}

interface SubscriptionState {
  subscription: UserSubscription | null;
  selectedPlan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  selectSubscription: (plan: SubscriptionPlan) => void;
  confirmSubscription: (paymentMethod: 'card' | 'apple' | 'eth') => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  toggleAutoRenew: () => Promise<void>;
  hasActiveSubscription: () => boolean;
  getSubscriptionPlans: () => SubscriptionPlan[];
}

// Default subscription plans with proper UUIDs
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for free plan
    name: 'Free',
    tier: 'free',
    price: { usd: 0, eth: 0 },
    duration: 365, // 1 year
    features: [
      'Access to basic music library',
      '30-second previews',
      'Standard audio quality',
      'Basic playlists',
      'Community features'
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000002', // Fixed UUID for fan plan
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
    id: '00000000-0000-0000-0000-000000000003', // Fixed UUID for enterprise plan
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

// Use mock store in development, real store in production
export const useSubscriptionStore = __DEV__ ? useMockSubscriptionStore as any : create<SubscriptionState>((set, get) => ({
  subscription: null,
  selectedPlan: null,
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('platform_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        set({ error: error.message });
        return;
      }

      set({ subscription: data || null, error: null });
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      set({ error: error.message });
    }
  },

  selectSubscription: (plan: SubscriptionPlan) => {
    set({ selectedPlan: plan });
  },

  confirmSubscription: async (paymentMethod: 'card' | 'apple' | 'eth') => {
    const { selectedPlan } = get();
    if (!selectedPlan) return false;

    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Cancel existing subscription if any
      const existingSubscription = get().subscription;
      if (existingSubscription) {
        await supabase
          .from('platform_subscriptions')
          .update({ 
            status: 'cancelled',
            metadata: {
              ...existingSubscription.metadata,
              auto_renew: false,
              cancelled_at: new Date().toISOString()
            }
          })
          .eq('id', existingSubscription.id);
      }

      let transactionHash: string | undefined;

      // Handle payment processing
      if (selectedPlan.tier === 'free') {
        // Free tier - no payment required
      } else if (paymentMethod === 'eth') {
        // Web3 payment - simulate for now
        transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        // TODO: Implement actual Web3 transaction
      } else {
        // Credit card or Apple Pay - simulate payment
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing
      }

      // Create new subscription
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000);

      const subscriptionData = {
        user_id: user.id,
        plan_id: selectedPlan.id,
        status: 'active' as const,
        started_at: startDate.toISOString(),
        expires_at: endDate.toISOString(),
        metadata: {
          tier: selectedPlan.tier,
          auto_renew: selectedPlan.tier !== 'free',
          payment_method: paymentMethod,
          transaction_hash: transactionHash,
          price: selectedPlan.price.usd,
          currency: 'USD'
        }
      };

      const { data: newSubscription, error } = await supabase
        .from('platform_subscriptions')
        .insert(subscriptionData)
        .select('*, subscription_plans(*)')
        .single();

      if (error) throw error;

      // Record transaction if it's a paid subscription
      if (selectedPlan.tier !== 'free') {
        await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'subscription',
            amount: selectedPlan.price.usd,
            currency: paymentMethod === 'eth' ? 'ETH' : 'USD',
            status: 'completed',
            transaction_hash: transactionHash,
            metadata: {
              subscription_id: newSubscription.id,
              plan_id: selectedPlan.id,
              tier: selectedPlan.tier
            },
            created_at: new Date().toISOString()
          });
      }

      // Update user's subscription tier on profiles
      await supabase
        .from('profiles')
        .update({ 
          subscription_tier: selectedPlan.tier,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      set({ 
        subscription: newSubscription, 
        selectedPlan: null, 
        isLoading: false,
        error: null 
      });

      return true;
    } catch (error: any) {
      console.error('Error confirming subscription:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  cancelSubscription: async () => {
    const { subscription } = get();
    if (!subscription) return;

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('platform_subscriptions')
        .update({ 
          status: 'cancelled',
          metadata: {
            ...subscription.metadata,
            auto_renew: false,
            cancelled_at: new Date().toISOString()
          }
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update user's subscription tier to free
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            subscription_tier: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      set({ 
        subscription: { 
          ...subscription, 
          status: 'cancelled', 
          metadata: { ...subscription.metadata, auto_renew: false } 
        },
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  toggleAutoRenew: async () => {
    const { subscription } = get();
    if (!subscription) return;

    set({ isLoading: true, error: null });

    try {
      const currentAutoRenew = subscription.metadata?.auto_renew ?? true;
      const newAutoRenew = !currentAutoRenew;
      const { error } = await supabase
        .from('platform_subscriptions')
        .update({ 
          metadata: {
            ...subscription.metadata,
            auto_renew: newAutoRenew
          }
        })
        .eq('id', subscription.id);

      if (error) throw error;

      set({ 
        subscription: { 
          ...subscription, 
          metadata: { ...subscription.metadata, auto_renew: newAutoRenew } 
        },
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error toggling auto-renew:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  hasActiveSubscription: () => {
    const { subscription } = get();
    if (!subscription || subscription.status !== 'active') return false;
    
    // Check tier from metadata or subscription_plans
    const tier = subscription.metadata?.tier || subscription.subscription_plans?.tier || subscription.tier;
    if (tier === 'free') return false;
    
    // Check expiry date
    if (subscription.expires_at) {
      const expiryDate = new Date(subscription.expires_at);
      return expiryDate > new Date();
    }
    
    return true;
  },

  getSubscriptionPlans: () => SUBSCRIPTION_PLANS
}));
