import { supabase } from '../services/databaseService';
import { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  website_url: string | null;
  social_links: Record<string, any>;
  preferences: Record<string, any>;
  subscription_tier: string;
  subscription_expires_at: string | null;
  total_listening_time_ms: number;
  wallet_address: string | null;
  wallet_type: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  account_created_at: string;
  account_updated_at: string;
  profile_created_at: string;
  profile_updated_at: string;
  // Onboarding fields (from users_metadata)
  onboarding_completed?: boolean;
  onboarding_step?: string;
}

class UserService {
  /**
   * Complete profile with privileged RPC to avoid client-side RLS issues
   */
  async completeProfile(params: { username?: string; display_name?: string; bio?: string }) {
    // Update profile fields via RPC with security definer
    const { error: updErr } = await supabase.rpc('update_user_metadata_profile', {
      p_username: params.username ?? null,
      p_display_name: params.display_name ?? null,
      p_bio: params.bio ?? null,
    });
    if (updErr) {
      console.error('RPC update_user_metadata_profile error:', updErr);
      throw updErr;
    }

    // Mark onboarding complete via RPC with security definer
    const { error: compErr } = await supabase.rpc('complete_profile_setup');
    if (compErr) {
      console.error('RPC complete_profile_setup error:', compErr);
      throw compErr;
    }
  }

  /**
   * Get the full user profile including auth data and metadata
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Get the current user's profile
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('No active session found');
      return null;
    }

    return this.getUserProfile(session.user.id);
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase
      .from('users_metadata')
      .upsert(
        { id: userId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }
  }

  /**
   * Update user's wallet information
   */
  async updateUserWallet(userId: string, walletAddress: string, walletType: string = 'web3auth') {
    const { error } = await supabase
      .from('users_metadata')
      .update({
        wallet_address: walletAddress,
        wallet_type: walletType,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user wallet:', error);
      throw error;
    }
  }

  /**
   * Search users by username or display name
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if a username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users_metadata')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      return true; // Username is available
    }

    return false; // Username is taken or there was an error
  }
}

export const userService = new UserService();
