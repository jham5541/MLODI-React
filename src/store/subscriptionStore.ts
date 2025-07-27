import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'fan' | 'enterprise';
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
  plan_id: string;
  tier: 'free' | 'fan' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_method: 'card' | 'apple' | 'eth';
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
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

// Default subscription plans
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
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
    id: 'fan',
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
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: { usd: 29.99, eth: 0.015 },
    duration: 30,
    features: [
      'Everything in Fan tier',
      'Lossless audio quality',
      'Advanced analytics',
      'Priority customer support',
      'Multiple device streaming',
      'Commercial usage rights',
      'Beta feature access',
      'Direct artist communication'
    ]
  }
];

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  selectedPlan: null,
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
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
          .from('user_subscriptions')
          .update({ 
            status: 'cancelled', 
            auto_renew: false,
            updated_at: new Date().toISOString()
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
        tier: selectedPlan.tier,
        status: 'active' as const,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: selectedPlan.tier !== 'free',
        payment_method: paymentMethod,
        transaction_hash: transactionHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newSubscription, error } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
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

      // Update user's subscription tier
      await supabase
        .from('users')
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
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled', 
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update user's subscription tier to free
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ 
            subscription_tier: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      set({ 
        subscription: { ...subscription, status: 'cancelled', auto_renew: false },
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
      const newAutoRenew = !subscription.auto_renew;
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          auto_renew: newAutoRenew,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      set({ 
        subscription: { ...subscription, auto_renew: newAutoRenew },
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
    if (subscription.tier === 'free') return false;
    
    const endDate = new Date(subscription.end_date);
    return endDate > new Date();
  },

  getSubscriptionPlans: () => SUBSCRIPTION_PLANS
}));
