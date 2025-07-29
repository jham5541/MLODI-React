import { supabase } from '../lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LikeableType = 'song' | 'album' | 'video' | 'artist' | 'playlist';

export interface UserLike {
  id: string;
  user_id: string;
  liked_type: LikeableType;
  liked_id: string;
  created_at: string;
}

class LikesService {
  private readonly STORAGE_KEY = 'user_likes';
  private readonly COUNTS_KEY = 'like_counts';

  // Check if Supabase is available and user is authenticated
  private async isSupabaseReady(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      console.warn('Supabase not available, using local storage fallback');
      return false;
    }
  }

  // Local storage fallback methods
  private async getLocalLikes(): Promise<Record<string, boolean>> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to get local likes:', error);
      return {};
    }
  }

  private async setLocalLikes(likes: Record<string, boolean>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(likes));
    } catch (error) {
      console.warn('Failed to set local likes:', error);
    }
  }

  private async getLocalCounts(): Promise<Record<string, number>> {
    try {
      const data = await AsyncStorage.getItem(this.COUNTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to get local counts:', error);
      return {};
    }
  }

  private async setLocalCounts(counts: Record<string, number>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.COUNTS_KEY, JSON.stringify(counts));
    } catch (error) {
      console.warn('Failed to set local counts:', error);
    }
  }

  private generateLikeKey(itemId: string, itemType: LikeableType): string {
    return `${itemType}_${itemId}`;
  }
  // Like an item
  async likeItem(itemId: string, itemType: LikeableType): Promise<void> {
    const useSupabase = await this.isSupabaseReady();
    
    if (useSupabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            liked_type: itemType,
            liked_id: itemId,
          });

        if (error && error.code !== '23505') { // Ignore duplicate key error
          throw error;
        }

        // Update the item's like count
        await this.updateLikeCount(itemId, itemType, 1);
      } catch (error) {
        console.warn('Failed to like item via Supabase, using local storage:', error);
        await this.likeItemLocal(itemId, itemType);
      }
    } else {
      await this.likeItemLocal(itemId, itemType);
    }
  }

  private async likeItemLocal(itemId: string, itemType: LikeableType): Promise<void> {
    const likes = await this.getLocalLikes();
    const counts = await this.getLocalCounts();
    const key = this.generateLikeKey(itemId, itemType);
    
    likes[key] = true;
    counts[key] = (counts[key] || 0) + 1;
    
    await this.setLocalLikes(likes);
    await this.setLocalCounts(counts);
  }

  // Unlike an item
  async unlikeItem(itemId: string, itemType: LikeableType): Promise<void> {
    const useSupabase = await this.isSupabaseReady();
    
    if (useSupabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('liked_type', itemType)
          .eq('liked_id', itemId);

        if (error) throw error;

        // Update the item's like count
        await this.updateLikeCount(itemId, itemType, -1);
      } catch (error) {
        console.warn('Failed to unlike item via Supabase, using local storage:', error);
        await this.unlikeItemLocal(itemId, itemType);
      }
    } else {
      await this.unlikeItemLocal(itemId, itemType);
    }
  }

  private async unlikeItemLocal(itemId: string, itemType: LikeableType): Promise<void> {
    const likes = await this.getLocalLikes();
    const counts = await this.getLocalCounts();
    const key = this.generateLikeKey(itemId, itemType);
    
    likes[key] = false;
    counts[key] = Math.max(0, (counts[key] || 0) - 1);
    
    await this.setLocalLikes(likes);
    await this.setLocalCounts(counts);
  }

  // Check if user has liked an item
  async isLiked(itemId: string, itemType: LikeableType): Promise<boolean> {
    const useSupabase = await this.isSupabaseReady();
    
    if (useSupabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
          .from('user_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('liked_type', itemType)
          .eq('liked_id', itemId)
          .maybeSingle();

        if (error) throw error;
        return !!data;
      } catch (error) {
        console.warn('Failed to check like status via Supabase, using local storage:', error);
        return await this.isLikedLocal(itemId, itemType);
      }
    } else {
      return await this.isLikedLocal(itemId, itemType);
    }
  }

  private async isLikedLocal(itemId: string, itemType: LikeableType): Promise<boolean> {
    const likes = await this.getLocalLikes();
    const key = this.generateLikeKey(itemId, itemType);
    return likes[key] || false;
  }

  // Get user's liked items by type
  async getLikedItems(itemType: LikeableType, limit = 50): Promise<UserLike[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('liked_type', itemType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as UserLike[];
  }

  // Get liked songs with full song data
  async getLikedSongs(limit = 50) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_likes')
      .select(`
        liked_id,
        created_at,
        songs:liked_id (*, artists(*))
      `)
      .eq('user_id', user.id)
      .eq('liked_type', 'song')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(item => item.songs);
  }

  // Get liked artists with full artist data
  async getLikedArtists(limit = 50) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_likes')
      .select(`
        liked_id,
        created_at,
        artists:liked_id (*)
      `)
      .eq('user_id', user.id)
      .eq('liked_type', 'artist')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(item => item.artists);
  }

  // Toggle like status
  async toggleLike(itemId: string, itemType: LikeableType): Promise<boolean> {
    console.log(`Toggling like for ${itemType} ${itemId}`);
    const isCurrentlyLiked = await this.isLiked(itemId, itemType);
    console.log(`Currently liked: ${isCurrentlyLiked}`);
    
    if (isCurrentlyLiked) {
      console.log('Unliking item...');
      await this.unlikeItem(itemId, itemType);
      console.log('Item unliked');
      return false;
    } else {
      console.log('Liking item...');
      await this.likeItem(itemId, itemType);
      console.log('Item liked');
      return true;
    }
  }

  // Update like count in the respective table
  private async updateLikeCount(itemId: string, itemType: LikeableType, increment: number): Promise<void> {
    let tableName: string;
    let columnName = 'like_count';

    switch (itemType) {
      case 'song':
        tableName = 'songs';
        break;
      case 'album':
        tableName = 'albums';
        break;
      case 'video':
        tableName = 'videos';
        break;
      case 'artist':
        tableName = 'artists';
        columnName = 'likes_count'; // Artists might use different column name
        break;
      case 'playlist':
        tableName = 'playlists';
        break;
      default:
        return; // Skip updating if type is not recognized
    }

    // Get current count
    const { data: currentData, error: fetchError } = await supabase
      .from(tableName)
      .select(columnName)
      .eq('id', itemId)
      .single();

    if (fetchError) {
      console.warn(`Failed to fetch current like count for ${itemType} ${itemId}:`, fetchError);
      return;
    }

    const currentCount = currentData[columnName] || 0;
    const newCount = Math.max(0, currentCount + increment);

    // Update the count
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ [columnName]: newCount })
      .eq('id', itemId);

    if (updateError) {
      console.warn(`Failed to update like count for ${itemType} ${itemId}:`, updateError);
    }
  }

  // Get like counts for multiple items
  async getLikeCounts(itemIds: string[], itemType: LikeableType): Promise<Record<string, number>> {
    const useSupabase = await this.isSupabaseReady();
    
    if (useSupabase) {
      try {
        let tableName: string;
        let columnName = 'like_count';

        switch (itemType) {
          case 'song':
            tableName = 'songs';
            break;
          case 'album':
            tableName = 'albums';
            break;
          case 'video':
            tableName = 'videos';
            break;
          case 'artist':
            tableName = 'artists';
            columnName = 'likes_count';
            break;
          case 'playlist':
            tableName = 'playlists';
            break;
          default:
            return {};
        }

        const { data, error } = await supabase
          .from(tableName)
          .select(`id, ${columnName}`)
          .in('id', itemIds);

        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach(item => {
          counts[item.id] = item[columnName] || 0;
        });

        return counts;
      } catch (error) {
        console.warn('Failed to get like counts via Supabase, using local storage:', error);
        return await this.getLikeCountsLocal(itemIds, itemType);
      }
    } else {
      return await this.getLikeCountsLocal(itemIds, itemType);
    }
  }

  private async getLikeCountsLocal(itemIds: string[], itemType: LikeableType): Promise<Record<string, number>> {
    const counts = await this.getLocalCounts();
    const result: Record<string, number> = {};
    
    itemIds.forEach(id => {
      const key = this.generateLikeKey(id, itemType);
      result[id] = counts[key] || 0;
    });
    
    return result;
  }

  // Get user's like statuses for multiple items
  async getLikeStatuses(itemIds: string[], itemType: LikeableType): Promise<Record<string, boolean>> {
    const useSupabase = await this.isSupabaseReady();
    
    if (useSupabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {};

        const { data, error } = await supabase
          .from('user_likes')
          .select('liked_id')
          .eq('user_id', user.id)
          .eq('liked_type', itemType)
          .in('liked_id', itemIds);

        if (error) throw error;

        const statuses: Record<string, boolean> = {};
        itemIds.forEach(id => {
          statuses[id] = false;
        });
        
        data?.forEach(like => {
          statuses[like.liked_id] = true;
        });

        return statuses;
      } catch (error) {
        console.warn('Failed to get like statuses via Supabase, using local storage:', error);
        return await this.getLikeStatusesLocal(itemIds, itemType);
      }
    } else {
      return await this.getLikeStatusesLocal(itemIds, itemType);
    }
  }

  private async getLikeStatusesLocal(itemIds: string[], itemType: LikeableType): Promise<Record<string, boolean>> {
    const likes = await this.getLocalLikes();
    const result: Record<string, boolean> = {};
    
    itemIds.forEach(id => {
      const key = this.generateLikeKey(id, itemType);
      result[id] = likes[key] || false;
    });
    
    return result;
  }
}

export const likesService = new LikesService();
