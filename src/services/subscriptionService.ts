export interface ArtistSubscription {
  artistId: string;
  artistName: string;
  price: number;
  subscribedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  benefits: string[];
  autoRenew: boolean;
  paymentMethod: 'apple_pay' | 'web3_wallet' | 'credit_card';
  renewalDate?: Date;
}

export interface SubscriptionPlan {
  artistId: string;
  price: number;
  currency: string;
  benefits: string[];
  description: string;
}

class SubscriptionService {
  private subscriptions: Map<string, ArtistSubscription> = new Map();

  // Get all active subscriptions
  async getActiveSubscriptions(): Promise<ArtistSubscription[]> {
    const now = new Date();
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive && sub.expiresAt > now
    );
  }

  // Check if user is subscribed to an artist
  isSubscribedTo(artistId: string): boolean {
    const subscription = this.subscriptions.get(artistId);
    if (!subscription) return false;
    
    const now = new Date();
    return subscription.isActive && subscription.expiresAt > now;
  }

  // Get subscription details for an artist
  getSubscription(artistId: string): ArtistSubscription | null {
    return this.subscriptions.get(artistId) || null;
  }

  // Subscribe to an artist
  async subscribeToArtist(
    artistId: string, 
    artistName: string, 
    price: number,
    paymentMethod: 'apple_pay' | 'web3_wallet' | 'credit_card'
  ): Promise<boolean> {
    try {
      console.log(`Subscribing to ${artistName} for $${price}/month via ${paymentMethod}`);
      
      // Simulate payment processing
      await this.processPayment(price, paymentMethod);
      
      // Create subscription
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const subscription: ArtistSubscription = {
        artistId,
        artistName,
        price,
        subscribedAt: now,
        expiresAt,
        isActive: true,
        autoRenew: true, // Enable auto-renewal by default
        paymentMethod,
        renewalDate: expiresAt, // Next renewal date
        benefits: [
          'Unlimited access to all content',
          'Early access to new releases',
          'Exclusive behind-the-scenes content',
          'Direct messaging with artist',
          'No gamification limitations',
          'Priority comment responses',
          'Exclusive live streams',
        ],
      };

      this.subscriptions.set(artistId, subscription);
      
      // In a real app, register for subscriber-specific notifications
      await this.registerForSubscriberNotifications(artistId);
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to artist:', error);
      return false;
    }
  }

  // Unsubscribe from an artist
  async unsubscribeFromArtist(artistId: string): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(artistId);
      if (subscription) {
        subscription.isActive = false;
        this.subscriptions.set(artistId, subscription);
        
        // In a real app, unregister from subscriber notifications
        await this.unregisterFromSubscriberNotifications(artistId);
        
        console.log(`Unsubscribed from artist: ${artistId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from artist:', error);
      return false;
    }
  }

  // Get subscription plan for an artist
  getSubscriptionPlan(artistId: string): SubscriptionPlan {
    // In a real app, this would come from the API
    const plans = {
      '1': { price: 9.99, description: 'Access all exclusive content and features' },
      '2': { price: 14.99, description: 'Premium access with direct artist interaction' },
      '3': { price: 7.99, description: 'Basic subscription with early access' },
    };

    const plan = plans[artistId as keyof typeof plans] || { price: 9.99, description: 'Standard subscription plan' };

    return {
      artistId,
      price: plan.price,
      currency: 'USD',
      description: plan.description,
      benefits: [
        'Unlimited access to all content',
        'Early access to new releases',
        'Exclusive behind-the-scenes content',
        'Direct messaging with artist',
        'No gamification limitations',
        'Priority comment responses',
        'Exclusive live streams',
        'Monthly virtual meet & greet',
      ],
    };
  }

  // Process payment (mock implementation)
  private async processPayment(amount: number, method: string): Promise<void> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random payment failure (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Payment processing failed');
    }
    
    console.log(`Payment of $${amount} processed successfully via ${method}`);
  }

  // Register for subscriber-specific notifications
  private async registerForSubscriberNotifications(artistId: string): Promise<void> {
    console.log(`Registering for subscriber notifications from artist: ${artistId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Unregister from subscriber notifications
  private async unregisterFromSubscriberNotifications(artistId: string): Promise<void> {
    console.log(`Unregistering from subscriber notifications from artist: ${artistId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Check if user has premium benefits (no gamification limitations)
  hasPremiumBenefits(artistId: string): boolean {
    return this.isSubscribedTo(artistId);
  }

  // Get subscription status for UI
  getSubscriptionStatus(artistId: string): {
    isSubscribed: boolean;
    subscription?: ArtistSubscription;
    plan: SubscriptionPlan;
  } {
    const subscription = this.getSubscription(artistId);
    const plan = this.getSubscriptionPlan(artistId);
    
    return {
      isSubscribed: this.isSubscribedTo(artistId),
      subscription: subscription || undefined,
      plan,
    };
  }

  // Toggle auto-renewal for an artist subscription
  async toggleAutoRenew(artistId: string): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(artistId);
      if (!subscription) return false;
      
      subscription.autoRenew = !subscription.autoRenew;
      this.subscriptions.set(artistId, subscription);
      
      console.log(`Auto-renewal ${subscription.autoRenew ? 'enabled' : 'disabled'} for artist: ${artistId}`);
      
      // In a real app, update backend
      if (subscription.autoRenew) {
        await this.scheduleAutoRenewal(subscription);
      } else {
        await this.cancelAutoRenewal(artistId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to toggle auto-renewal:', error);
      return false;
    }
  }

  // Schedule auto-renewal for a subscription
  private async scheduleAutoRenewal(subscription: ArtistSubscription): Promise<void> {
    // In a real app, this would schedule a job on the backend
    console.log(`Scheduling auto-renewal for ${subscription.artistName} on ${subscription.renewalDate}`);
    
    // Store renewal information
    const renewalInfo = {
      artistId: subscription.artistId,
      renewalDate: subscription.renewalDate,
      amount: subscription.price,
      paymentMethod: subscription.paymentMethod,
    };
    
    // In production, this would be handled by a backend job scheduler
    // For now, we'll simulate with a timeout (not recommended for production)
    const timeUntilRenewal = subscription.renewalDate!.getTime() - Date.now();
    if (timeUntilRenewal > 0) {
      setTimeout(() => this.processAutoRenewal(subscription.artistId), timeUntilRenewal);
    }
  }

  // Cancel auto-renewal
  private async cancelAutoRenewal(artistId: string): Promise<void> {
    // In a real app, this would cancel the scheduled job on the backend
    console.log(`Cancelling auto-renewal for artist: ${artistId}`);
  }

  // Process auto-renewal when the time comes
  private async processAutoRenewal(artistId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(artistId);
      if (!subscription || !subscription.autoRenew || !subscription.isActive) {
        return;
      }

      console.log(`Processing auto-renewal for ${subscription.artistName}`);
      
      // Process payment
      await this.processPayment(subscription.price, subscription.paymentMethod);
      
      // Update subscription dates
      const now = new Date();
      subscription.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscription.renewalDate = subscription.expiresAt;
      
      this.subscriptions.set(artistId, subscription);
      
      // Schedule next renewal
      await this.scheduleAutoRenewal(subscription);
      
      // Notify user of successful renewal
      console.log(`Successfully renewed subscription for ${subscription.artistName}`);
      
    } catch (error) {
      console.error(`Failed to auto-renew subscription for artist ${artistId}:`, error);
      
      // In a real app, notify user of failed payment and retry logic
      const subscription = this.subscriptions.get(artistId);
      if (subscription) {
        subscription.autoRenew = false;
        this.subscriptions.set(artistId, subscription);
      }
    }
  }

  // Get all subscriptions that need renewal
  async getSubscriptionsForRenewal(): Promise<ArtistSubscription[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive && 
             sub.autoRenew && 
             sub.renewalDate && 
             sub.renewalDate <= tomorrow &&
             sub.renewalDate >= now
    );
  }

  // Process all pending renewals (called by backend job)
  async processPendingRenewals(): Promise<void> {
    const subscriptionsToRenew = await this.getSubscriptionsForRenewal();
    
    for (const subscription of subscriptionsToRenew) {
      await this.processAutoRenewal(subscription.artistId);
    }
  }

  // Get total monthly billing amount
  async getTotalMonthlyBilling(): Promise<number> {
    const activeSubscriptions = await this.getActiveSubscriptions();
    return activeSubscriptions
      .filter(sub => sub.autoRenew)
      .reduce((total, sub) => total + sub.price, 0);
  }
}

export const subscriptionService = new SubscriptionService();
