import { supabase } from '../lib/supabase';

export interface SubscriptionData {
  user_id: string;
  artist_id?: string;
  artist_name?: string;
  plan_id?: string;
  tier?: string;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  payment_method: string;
  benefits?: string[];
  auto_renew: boolean;
  transaction_hash?: string;
}

// Simple UUID v4-ish validator (accepts hyphenated UUIDs)
function isValidUuid(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  // Accept standard UUID format. This is lenient and does not enforce version bits strictly.
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

class SubscriptionService {
  // In-memory cache for subscriptions (for demo purposes)
  private subscribedArtists: Set<string> = new Set();

  // Row shape from unified dashboard function/view
  private mapDashboardRowToArtist(row: any) {
    return {
      id: row.subscription_id as string,
      user_id: '', // not needed in client list context
      artist_id: row.artist_id as string,
      artist_name: row.artist_name as string,
      status: row.status as 'active' | 'expired' | 'cancelled',
      started_at: row.started_at as string,
      expires_at: row.expires_at as string | undefined,
      price: Number(row.price ?? 0),
      payment_method: row.payment_method as string | undefined,
      auto_renew: !!row.auto_renew,
      benefits: Array.isArray(row.benefits) ? row.benefits : [],
      metadata: null,
      created_at: undefined,
      updated_at: undefined,
    };
  }

  /**
   * Check if user is subscribed to an artist (synchronous for demo)
   */
  isSubscribedTo(artistId: string): boolean {
    return this.subscribedArtists.has(artistId);
  }

  /**
   * Creates a platform-wide subscription (like Spotify Premium)
   */
  async createPlatformSubscription(data: {
    userId: string;
    planId: string;
    tier: string;
    price: number;
    paymentMethod: string;
    transactionHash?: string;
    duration: number; // days
  }) {
    const startDate = new Date();
    const expiresAt = new Date(startDate.getTime() + data.duration * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      user_id: data.userId,
      plan_id: data.planId,
      status: 'active' as const,
      started_at: startDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      metadata: {
        tier: data.tier,
        auto_renew: data.tier !== 'free',
        payment_method: data.paymentMethod,
        transaction_hash: data.transactionHash,
        price: data.price,
        currency: 'USD'
      }
    };

    const { data: subscription, error } = await supabase
      .from('platform_subscriptions')
      .insert(subscriptionData)
      .select('*, subscription_plans(*)')
      .single();

    if (error) throw error;
    return subscription;
  }

  /**
   * Creates an artist-specific subscription (like Patreon)
   */
  async createArtistSubscription(data: {
    userId: string;
    artistId: string;
    artistName: string;
    price: number;
    paymentMethod: string;
    transactionHash?: string;
    benefits?: string[];
    duration: number; // days
  }) {
    // Validate IDs before attempting DB insert to avoid 22P02 errors
    if (!isValidUuid(data.userId)) {
      throw new Error(`Invalid userId (expected UUID): ${String(data.userId)}`);
    }
    if (!isValidUuid(data.artistId)) {
      throw new Error(
        `Invalid artistId (expected UUID): ${String(data.artistId)}. ` +
        'Ensure you are passing the artist UUID from the artists table rather than a numeric ID or index.'
      );
    }

    const startDate = new Date();
    const expiresAt = new Date(startDate.getTime() + data.duration * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      user_id: data.userId,
      artist_id: data.artistId,
      status: 'active' as const,
      started_at: startDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      metadata: {
        artist_name: data.artistName,
        price: data.price,
        currency: 'USD',
        payment_method: data.paymentMethod,
        transaction_hash: data.transactionHash,
        benefits: data.benefits || [],
        auto_renew: true
      }
    };

    const { data: subscription, error } = await supabase
      .from('artist_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating artist subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
    
    if (!subscription) {
      throw new Error('No subscription data returned from database');
    }
    
    console.log('Created artist subscription:', subscription);
    return subscription;
  }

  /**
   * Legacy method to create a subscription in user_subscriptions table
   * This should be migrated to use either platform or artist subscriptions
   */
  async createLegacySubscription(data: SubscriptionData) {
    // If artist_id is provided, use artist_subscriptions
    if (data.artist_id) {
      return this.createArtistSubscription({
        userId: data.user_id,
        artistId: data.artist_id,
        artistName: data.artist_name || 'Unknown Artist',
        price: data.price,
        paymentMethod: data.payment_method,
        transactionHash: data.transaction_hash,
        benefits: data.benefits,
        duration: 30 // Default 30 days
      });
    }

    // Otherwise, use platform_subscriptions
    return this.createPlatformSubscription({
      userId: data.user_id,
      planId: data.plan_id || '00000000-0000-0000-0000-000000000002', // Default to fan plan
      tier: data.tier || 'fan',
      price: data.price,
      paymentMethod: data.payment_method,
      transactionHash: data.transaction_hash,
      duration: 30 // Default 30 days
    });
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    const [platformSubs, artistSubs] = await Promise.all([
      supabase
        .from('platform_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('artist_subscriptions')
        .select(`
          *,
          artists:artist_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
    ]);

    return {
      platform: platformSubs.data || [],
      artists: artistSubs.data || [],
      errors: {
        platform: platformSubs.error,
        artists: artistSubs.error
      }
    };
  }

  /**
   * Get active subscriptions for Manage Subscription screen (artist only)
   * Uses unified dashboard RPC to ensure consistency with server logic
   */
  async getActiveSubscriptions(): Promise<any[]> {
    // Prefer RPC if available
    const { data, error } = await supabase.rpc('get_my_active_subscriptions');
    if (error) {
      console.warn('Falling back to artist_subscriptions due to RPC error:', error.message);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: fallback, error: fbErr } = await supabase
        .from('artist_subscriptions')
        .select(`
          *,
          artists:artist_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (fbErr || !fallback) return [];
      return fallback.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        artist_id: row.artist_id,
        artist_name: row.artists?.name,
        status: row.status,
        started_at: row.started_at,
        expires_at: row.expires_at,
        price: row.metadata?.price,
        payment_method: row.metadata?.payment_method,
        auto_renew: row.metadata?.auto_renew ?? true,
        benefits: row.metadata?.benefits ?? [],
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }
    // Filter artist subscriptions from dashboard rows
    const artists = (data || []).filter((r: any) => r.subscription_type === 'artist');
    return artists.map((r: any) => this.mapDashboardRowToArtist(r));
  }

  /**
   * Check if user has an active platform subscription
   */
  async hasActivePlatformSubscription(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('platform_subscriptions')
      .select('id, expires_at, metadata')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) return false;

    // Check if not expired
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      if (expiryDate < new Date()) return false;
    }

    // Check if not free tier
    const tier = data.metadata?.tier;
    return tier !== 'free';
  }

  /**
   * Check if user is subscribed to a specific artist
   */
  async isSubscribedToArtist(userId: string, artistId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('artist_subscriptions')
        .select('id, expires_at')
        .eq('user_id', userId)
        .eq('artist_id', artistId)
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record exists

      // No subscription found is not an error, just return false
      if (!data) return false;
      
      if (error) {
        console.error('Error checking artist subscription:', error);
        return false;
      }

      // Check if not expired
      if (data.expires_at) {
        const expiryDate = new Date(data.expires_at);
        return expiryDate > new Date();
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in isSubscribedToArtist:', error);
      return false;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, type: 'platform' | 'artist') {
    const table = type === 'platform' ? 'platform_subscriptions' : 'artist_subscriptions';
    
    const { error } = await supabase
      .from(table)
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
  }

  /**
   * Record a subscription transaction
   */
  async recordTransaction(data: {
    userId: string;
    type: 'subscription' | 'artist_subscription';
    amount: number;
    currency: string;
    transactionHash?: string;
    metadata: any;
  }) {
    try {
      const transactionData = {
        user_id: data.userId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        status: 'completed',
        transaction_hash: data.transactionHash,
        metadata: data.metadata,
        created_at: new Date().toISOString()
      };
      
      console.log('Recording transaction:', transactionData);
      
      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) {
        console.error('Error recording transaction:', error);
        throw new Error(`Failed to record transaction: ${error.message}`);
      }
      
      console.log('Transaction recorded successfully');
    } catch (error) {
      console.error('Unexpected error in recordTransaction:', error);
      throw error;
    }
  }

  /**
   * Process payment (mock implementation for development)
   */
  private async processPayment(amount: number, method: string): Promise<void> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, integrate with actual payment providers
    console.log(`Payment of $${amount} processed successfully via ${method}`);
  }

  /**
   * Get subscription benefits for an artist
   */
  getArtistSubscriptionBenefits(): string[] {
    return [
      'Unlimited access to all content',
      'Early access to new releases',
      'Exclusive behind-the-scenes content',
      'Direct messaging with artist',
      'No gamification limitations',
      'Priority comment responses',
      'Exclusive live streams',
      'Monthly virtual meet & greet'
    ];
  }

  /**
   * Get subscription plan for an artist
   */
  getSubscriptionPlan(artistId: string): SubscriptionPlan {
    return {
      artistId,
      price: 9.99,
      currency: 'USD',
      description: 'Access all exclusive content and features',
      benefits: this.getArtistSubscriptionBenefits()
    };
  }

  /**
   * Subscribe to an artist (properly saves to database)
   */
  async subscribeToArtist(
    artistId: string,
    artistName: string,
    price: number,
    paymentMethod: 'apple_pay' | 'web3_wallet' | 'credit_card',
    userId?: string
  ): Promise<boolean> {
    try {
      console.log('SubscriptionService: Starting subscription process...');
      
      let currentUserId = userId;
      
      // If userId not provided, get from Supabase auth
      if (!currentUserId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error:', authError);
          throw new Error(`Authentication failed: ${authError.message}`);
        }
        if (!user) {
          throw new Error('User not authenticated - please log in again');
        }
        currentUserId = user.id;
      }
      
      console.log('SubscriptionService: User authenticated:', currentUserId);

      // Validate IDs before any further processing
      if (!isValidUuid(currentUserId)) {
        throw new Error(`Invalid user ID (expected UUID): ${String(currentUserId)}`);
      }
      if (!isValidUuid(artistId)) {
        throw new Error(
          `Invalid artist ID (expected UUID): ${String(artistId)}. ` +
          'Pass the artist UUID from the artists table, not a numeric ID or index.'
        );
      }

      // Check if already subscribed
      const isAlreadySubscribed = await this.isSubscribedToArtist(currentUserId, artistId);
      if (isAlreadySubscribed) {
        console.log('SubscriptionService: User already subscribed to this artist');
        throw new Error('You are already subscribed to this artist');
      }

      // Process payment (simulated)
      console.log('SubscriptionService: Processing payment...');
      await this.processPayment(price, paymentMethod);

      // Create artist subscription
      console.log('SubscriptionService: Creating subscription record...');
      const subscription = await this.createArtistSubscription({
        userId: currentUserId,
        artistId,
        artistName,
        price,
        paymentMethod,
        benefits: this.getArtistSubscriptionBenefits(),
        duration: 30 // 30 days
      });

      if (!subscription || !subscription.id) {
        throw new Error('Failed to create subscription record');
      }

      // Record transaction
      console.log('SubscriptionService: Recording transaction...');
      await this.recordTransaction({
        userId: currentUserId,
        type: 'artist_subscription',
        amount: price,
        currency: 'USD',
        metadata: {
          artist_id: artistId,
          artist_name: artistName,
          subscription_id: subscription.id
        }
      });

      // Add to in-memory cache
      this.subscribedArtists.add(artistId);
      
      console.log('SubscriptionService: Subscription completed successfully!');
      return true;
    } catch (error) {
      console.error('SubscriptionService: Error subscribing to artist:', error);
      // Re-throw the error so the UI can display a meaningful message
      throw error;
    }
  }

  /**
   * Unsubscribe from an artist
   */
  async unsubscribeFromArtist(artistId: string): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prefer cancelling via user_subscriptions through RPC to keep tables in sync
      const { data: us, error: usErr } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', artistId)
        .eq('status', 'active')
        .maybeSingle();

      if (us && us.id) {
        const { error: rpcErr } = await supabase.rpc('cancel_artist_subscription', { p_subscription_id: us.id });
        if (rpcErr) throw rpcErr;
      } else {
        // Fallback: cancel directly in artist_subscriptions
        const { data: asRow, error } = await supabase
          .from('artist_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('artist_id', artistId)
          .eq('status', 'active')
          .maybeSingle();
        if (!asRow) return false;
        await this.cancelSubscription(asRow.id, 'artist');
      }

      // Remove from in-memory cache
      this.subscribedArtists.delete(artistId);

      return true;
    } catch (error) {
      console.error('Error unsubscribing from artist:', error);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();

export interface SubscriptionPlan {
  artistId: string;
  price: number;
  currency: string;
  description: string;
  benefits: string[];
}
