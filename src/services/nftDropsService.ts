import { supabase } from '../lib/supabase/client';

export interface NFTDrop {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  artistAvatar?: string;
  coverImage: string;
  dropDate: string;
  endDate: string;
  price: number;
  currency: string;
  description?: string;
  supply: number;
  status?: 'upcoming' | 'live' | 'ended';
  timeUntilDrop?: number;
  timeUntilEnd?: number;
  isNotifiable?: boolean;
  canPurchase?: boolean;
  isNotified?: boolean;
}

export interface MarketplaceStatistics {
  totalVolume: number;
  floorPrice: number;
  averagePrice: number;
  listedItems: number;
  uniqueOwners: number;
  totalSales: number;
  trending: any[];
  topCategories: Array<{ name: string; count: number }>;
  salesByType: Record<string, { count: number; revenue: number }>;
  generatedAt: string;
  timeWindow: string;
}

class NFTDropsService {
  // Get upcoming NFT drops using the edge function
  async getUpcomingDrops(limit = 20): Promise<NFTDrop[]> {
    try {
      const { data, error } = await supabase.functions.invoke('nft-drops', {
        body: {
          status: 'upcoming',
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.drops;
    } catch (error) {
      console.error('Failed to fetch upcoming drops:', error);
      throw error;
    }
  }

  // Get live NFT drops
  async getLiveDrops(limit = 20): Promise<NFTDrop[]> {
    try {
      const { data, error } = await supabase.functions.invoke('nft-drops', {
        body: {
          status: 'live',
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.drops;
    } catch (error) {
      console.error('Failed to fetch live drops:', error);
      throw error;
    }
  }

  // Get all drops with filtering
  async getDrops(status: 'upcoming' | 'live' | 'ended' | 'all' = 'all', artistId?: string, limit = 20): Promise<NFTDrop[]> {
    try {
      const { data, error } = await supabase.functions.invoke('nft-drops', {
        body: {
          status,
          artistId,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.drops;
    } catch (error) {
      console.error('Failed to fetch drops:', error);
      throw error;
    }
  }

  // Set notification for a drop
  async setDropNotification(dropId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('drop_notifications')
        .upsert({
          user_id: user.id,
          drop_id: dropId,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,drop_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to set drop notification:', error);
      throw error;
    }
  }

  // Remove notification for a drop
  async removeDropNotification(dropId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('drop_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('drop_id', dropId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove drop notification:', error);
      throw error;
    }
  }

  // Get marketplace statistics using the edge function
  async getMarketplaceStatistics(timeWindow: 'day' | 'week' | 'month' | 'all' = 'all', type?: string): Promise<MarketplaceStatistics> {
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-stats', {
        body: {
          timeWindow,
          type
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.statistics;
    } catch (error) {
      console.error('Failed to fetch marketplace statistics:', error);
      throw error;
    }
  }

  // Get trending data using the existing trending calculator
  async getTrendingData(type: 'songs' | 'artists' | 'albums' | 'playlists', timeWindow: 'hour' | 'day' | 'week' | 'month' = 'day', limit = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('trending-calculator', {
        body: {
          type,
          timeWindow,
          limit
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.trending;
    } catch (error) {
      console.error('Failed to fetch trending data:', error);
      throw error;
    }
  }

  // Create a new NFT drop (for artists/admins)
  async createDrop(dropData: {
    title: string;
    description: string;
    dropDate: string;
    endDate: string;
    price: number;
    currency: string;
    supply: number;
    coverImage: string;
    productId?: string;
  }): Promise<NFTDrop> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's artist profile
      const { data: artistProfile } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!artistProfile) throw new Error('Artist profile required to create drops');

      const { data, error } = await supabase
        .from('nft_drops')
        .insert({
          title: dropData.title,
          description: dropData.description,
          artist_id: artistProfile.id,
          drop_date: dropData.dropDate,
          end_date: dropData.endDate,
          price: dropData.price,
          currency: dropData.currency,
          supply: dropData.supply,
          cover_image: dropData.coverImage,
          product_id: dropData.productId,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          artists(id, name, avatar_url, is_verified),
          products(id, title, cover_url, price, type)
        `)
        .single();

      if (error) throw error;

      return this.transformDropData(data);
    } catch (error) {
      console.error('Failed to create drop:', error);
      throw error;
    }
  }

  // Transform database drop data to client format
  private transformDropData(dbDrop: any): NFTDrop {
    return {
      id: dbDrop.id,
      title: dbDrop.title,
      artist: dbDrop.artists?.name || 'Unknown Artist',
      artistId: dbDrop.artist_id,
      artistAvatar: dbDrop.artists?.avatar_url,
      coverImage: dbDrop.cover_image,
      dropDate: dbDrop.drop_date,
      endDate: dbDrop.end_date,
      price: dbDrop.price,
      currency: dbDrop.currency,
      description: dbDrop.description,
      supply: dbDrop.supply,
      // Additional computed fields will be added by the edge function
    };
  }
}

export const nftDropsService = new NFTDropsService();
