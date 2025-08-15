import { supabase } from '../lib/supabase';

export interface UserPointsWallet {
  id: string;
  user_id: string;
  points_balance: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: 'challenge_reward' | 'purchase' | 'bonus' | 'referral' | 'achievement' | 'admin_adjustment';
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

class PointsWalletService {
  /**
   * Get user's points wallet
   */
  async getUserWallet(): Promise<UserPointsWallet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Wallet doesn't exist, create one
        return await this.createWallet();
      }

      if (error) throw error;
      return data as UserPointsWallet;
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      return null;
    }
  }

  /**
   * Create a new wallet for the user
   */
  private async createWallet(): Promise<UserPointsWallet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          points_balance: 0,
          total_points_earned: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserPointsWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      return null;
    }
  }

  /**
   * Add points to user's wallet
   */
  async addPoints(
    points: number,
    transactionType: PointTransaction['transaction_type'],
    description?: string,
    metadata?: Record<string, any>
  ): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // Use the database function for atomic operation
      const { data, error } = await supabase
        .rpc('add_points_to_wallet', {
          p_user_id: user.id,
          p_points: points,
          p_transaction_type: transactionType,
          p_description: description,
          p_metadata: metadata || {}
        });

      if (error) throw error;
      return data as number;
    } catch (error) {
      console.error('Error adding points:', error);
      return null;
    }
  }

  /**
   * Deduct points from user's wallet
   */
  async deductPoints(
    points: number,
    transactionType: PointTransaction['transaction_type'] = 'purchase',
    description?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      // First check if user has enough points
      const wallet = await this.getUserWallet();
      if (!wallet || wallet.points_balance < points) {
        console.error('Insufficient points');
        return false;
      }

      // Deduct points
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({
          points_balance: wallet.points_balance - points,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          points: -points,
          transaction_type: transactionType,
          description: description,
          metadata: metadata
        });

      if (transactionError) throw transactionError;
      return true;
    } catch (error) {
      console.error('Error deducting points:', error);
      return false;
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(limit = 50): Promise<PointTransaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PointTransaction[];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get user's point statistics
   */
  async getPointStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const wallet = await this.getUserWallet();
      const transactions = await this.getTransactionHistory(100);

      // Calculate stats
      const earned = transactions
        .filter(t => t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);

      const spent = Math.abs(
        transactions
          .filter(t => t.points < 0)
          .reduce((sum, t) => sum + t.points, 0)
      );

      const challengeRewards = transactions
        .filter(t => t.transaction_type === 'challenge_reward' && t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);

      const achievementRewards = transactions
        .filter(t => t.transaction_type === 'achievement' && t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);

      return {
        currentBalance: wallet?.points_balance || 0,
        totalEarned: wallet?.total_points_earned || 0,
        totalSpent: spent,
        challengeRewards,
        achievementRewards,
        recentTransactions: transactions.slice(0, 10)
      };
    } catch (error) {
      console.error('Error calculating point stats:', error);
      return null;
    }
  }

  /**
   * Subscribe to wallet updates
   */
  subscribeToWalletUpdates(callback: (wallet: UserPointsWallet) => void) {
    const { data: { user } } = supabase.auth.getUser();
    if (!user) return null;

    const subscription = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UserPointsWallet);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const pointsWalletService = new PointsWalletService();
