import { supabase } from '../lib/supabase/client';

export interface VideoPurchase {
  id: string;
  userId: string;
  videoId: string;
  purchasedAt: string;
  price: number;
}

class VideoPurchaseService {
  /**
   * Check if a user has purchased a video
   */
  async hasUserPurchasedVideo(videoId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('video_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle();

      if (error) {
        console.error('Error checking video purchase:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasUserPurchasedVideo:', error);
      return false;
    }
  }

  /**
   * Purchase a video
   */
  async purchaseVideo(videoId: string, price: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already purchased
      const alreadyPurchased = await this.hasUserPurchasedVideo(videoId);
      if (alreadyPurchased) {
        console.log('Video already purchased');
        return true;
      }

      // Create purchase record
      const { error } = await supabase
        .from('video_purchases')
        .insert({
          user_id: user.id,
          video_id: videoId,
          price: price,
        });

      if (error) {
        console.error('Error purchasing video:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in purchaseVideo:', error);
      throw error;
    }
  }

  /**
   * Get user's purchased videos
   */
  async getUserPurchasedVideos(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('video_purchases')
        .select('video_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user purchases:', error);
        return [];
      }

      return data?.map(p => p.video_id) || [];
    } catch (error) {
      console.error('Error in getUserPurchasedVideos:', error);
      return [];
    }
  }

  /**
   * Get purchase count for a video
   */
  async getVideoPurchaseCount(videoId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('video_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      if (error) {
        console.error('Error getting purchase count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getVideoPurchaseCount:', error);
      return 0;
    }
  }
}

export const videoPurchaseService = new VideoPurchaseService();
export default videoPurchaseService;
