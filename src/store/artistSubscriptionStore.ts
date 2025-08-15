import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';

export interface ArtistSubscriptionPlan {
  id: string;
  artist_id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  benefits: string[];
  is_active: boolean;
}

export interface ArtistSubscription {
  id: string;
  user_id: string;
  artist_id: string;
  artist_name?: string;
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at?: string;
  price?: number;
  payment_method?: string;
  auto_renew?: boolean;
  benefits?: string[];
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface ArtistSubscriptionState {
  subscriptions: ArtistSubscription[];
  selectedArtist: { id: string; name: string } | null;
  selectedPlan: ArtistSubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchArtistSubscriptions: () => Promise<void>;
  fetchArtistPlans: (artistId: string) => Promise<ArtistSubscriptionPlan[]>;
  selectArtistAndPlan: (artist: { id: string; name: string }, plan?: ArtistSubscriptionPlan) => void;
  confirmArtistSubscription: (paymentMethod: 'card' | 'apple' | 'eth') => Promise<boolean>;
  cancelArtistSubscription: (subscriptionId: string) => Promise<void>;
  isSubscribedToArtist: (artistId: string) => boolean;
  getArtistSubscription: (artistId: string) => ArtistSubscription | undefined;
}

// Default artist subscription benefits
const DEFAULT_ARTIST_BENEFITS = [
  'Unlimited access to all content',
  'Early access to new releases',
  'Exclusive behind-the-scenes content',
  'Direct messaging with artist',
  'No gamification limitations',
  'Priority comment responses',
  'Exclusive live streams'
];

export const useArtistSubscriptionStore = create<ArtistSubscriptionState>((set, get) => ({
  subscriptions: [],
  selectedArtist: null,
  selectedPlan: null,
  isLoading: false,
  error: null,

  fetchArtistSubscriptions: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('artist_subscriptions')
        .select(`
          *,
          artists:artist_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching artist subscriptions:', error);
        set({ error: error.message });
        return;
      }

      const subscriptions = data?.map(sub => ({
        ...sub,
        artist_name: sub.artists?.name
      })) || [];

      set({ subscriptions, error: null });
    } catch (error: any) {
      console.error('Error fetching artist subscriptions:', error);
      set({ error: error.message });
    }
  },

  fetchArtistPlans: async (artistId: string) => {
    try {
      // For now, return a default plan
      // In a real implementation, this would fetch from a subscription_plans table
      const defaultPlan: ArtistSubscriptionPlan = {
        id: `${artistId}-default-plan`,
        artist_id: artistId,
        name: 'Monthly Fan Subscription',
        price: 9.99,
        currency: 'USD',
        duration_days: 30,
        benefits: DEFAULT_ARTIST_BENEFITS,
        is_active: true
      };

      return [defaultPlan];
    } catch (error: any) {
      console.error('Error fetching artist plans:', error);
      return [];
    }
  },

  selectArtistAndPlan: (artist: { id: string; name: string }, plan?: ArtistSubscriptionPlan) => {
    set({ selectedArtist: artist, selectedPlan: plan || null });
  },

  confirmArtistSubscription: async (paymentMethod: 'card' | 'apple' | 'eth') => {
    const { selectedArtist, selectedPlan } = get();
    if (!selectedArtist || !selectedPlan) return false;

    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check for existing subscription to this artist
      const existingSubscription = get().subscriptions.find(
        sub => sub.artist_id === selectedArtist.id && sub.status === 'active'
      );

      if (existingSubscription) {
        // Cancel existing subscription first
        await supabase
          .from('artist_subscriptions')
          .update({ 
            status: 'cancelled',
            metadata: {
              ...existingSubscription.metadata,
              cancelled_at: new Date().toISOString()
            }
          })
          .eq('id', existingSubscription.id);
      }

      let transactionHash: string | undefined;

      // Handle payment processing
      if (paymentMethod === 'eth') {
        // Web3 payment - simulate for now
        transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        // TODO: Implement actual Web3 transaction
      } else {
        // Credit card or Apple Pay - simulate payment
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Create new artist subscription
      const startDate = new Date();
      const expiresAt = new Date(startDate.getTime() + selectedPlan.duration_days * 24 * 60 * 60 * 1000);

      const subscriptionData = {
        user_id: user.id,
        artist_id: selectedArtist.id,
        status: 'active' as const,
        started_at: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        metadata: {
          artist_name: selectedArtist.name,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          price: selectedPlan.price,
          currency: selectedPlan.currency,
          payment_method: paymentMethod,
          transaction_hash: transactionHash,
          benefits: selectedPlan.benefits,
          auto_renew: true
        }
      };

      const { data: newSubscription, error } = await supabase
        .from('artist_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'artist_subscription',
          amount: selectedPlan.price,
          currency: paymentMethod === 'eth' ? 'ETH' : selectedPlan.currency,
          status: 'completed',
          transaction_hash: transactionHash,
          metadata: {
            subscription_id: newSubscription.id,
            artist_id: selectedArtist.id,
            artist_name: selectedArtist.name,
            plan_id: selectedPlan.id
          },
          created_at: new Date().toISOString()
        });

      // Update local state
      await get().fetchArtistSubscriptions();

      set({ 
        selectedArtist: null,
        selectedPlan: null,
        isLoading: false,
        error: null 
      });

      return true;
    } catch (error: any) {
      console.error('Error confirming artist subscription:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  cancelArtistSubscription: async (subscriptionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('artist_subscriptions')
        .update({ 
          status: 'cancelled',
          metadata: supabase.sql`
            jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{cancelled_at}',
              to_jsonb(now()::text)
            )
          `
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Update local state
      await get().fetchArtistSubscriptions();

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Error cancelling artist subscription:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  isSubscribedToArtist: (artistId: string) => {
    const { subscriptions } = get();
    return subscriptions.some(
      sub => sub.artist_id === artistId && 
            sub.status === 'active' && 
            (!sub.expires_at || new Date(sub.expires_at) > new Date())
    );
  },

  getArtistSubscription: (artistId: string) => {
    const { subscriptions } = get();
    return subscriptions.find(
      sub => sub.artist_id === artistId && sub.status === 'active'
    );
  }
}));
