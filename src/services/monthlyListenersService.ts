import { supabase } from '../lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MonthlyListenersData {
  artistId: string;
  monthlyListeners: number;
  lastUpdated: string;
}

class MonthlyListenersService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, ((data: MonthlyListenersData) => void)[]> = new Map();
  private cache: Map<string, MonthlyListenersData> = new Map();
  
  /**
   * Get monthly listeners for an artist
   */
  async getMonthlyListeners(artistId: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.cache.get(artistId);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        return cached.monthlyListeners;
      }

      // First try to get from the artists table
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('monthly_listeners')
        .eq('id', artistId)
        .single();

      if (!artistError && artistData?.monthly_listeners !== null) {
        this.updateCache(artistId, artistData.monthly_listeners);
        return artistData.monthly_listeners;
      }

      // If not in artists table, calculate from streaming stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: streamingData, error: streamingError } = await supabase
        .from('artist_streaming_stats')
        .select('unique_listeners')
        .eq('artist_id', artistId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1);

      if (!streamingError && streamingData && streamingData.length > 0) {
        const monthlyListeners = streamingData[0].unique_listeners || 0;
        this.updateCache(artistId, monthlyListeners);
        return monthlyListeners;
      }

      // If no data available, check analytics summary
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('artist_analytics_summary')
        .select('unique_listeners')
        .eq('artist_id', artistId)
        .eq('period_type', 'monthly')
        .order('period_end', { ascending: false })
        .limit(1);

      if (!analyticsError && analyticsData && analyticsData.length > 0) {
        const monthlyListeners = analyticsData[0].unique_listeners || 0;
        this.updateCache(artistId, monthlyListeners);
        return monthlyListeners;
      }

      // Default fallback value
      return 0;
    } catch (error) {
      console.error('Error fetching monthly listeners:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time updates for an artist's monthly listeners
   */
  subscribeToArtist(artistId: string, callback: (data: MonthlyListenersData) => void): () => void {
    // Add callback to listeners
    if (!this.listeners.has(artistId)) {
      this.listeners.set(artistId, []);
    }
    this.listeners.get(artistId)!.push(callback);

    // Create real-time subscription if not exists
    if (!this.channels.has(artistId)) {
      const channel = supabase
        .channel(`monthly-listeners-${artistId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'artists',
            filter: `id=eq.${artistId}`
          },
          async (payload) => {
            if (payload.new && 'monthly_listeners' in payload.new) {
              const data = {
                artistId,
                monthlyListeners: payload.new.monthly_listeners as number,
                lastUpdated: new Date().toISOString()
              };
              this.notifyListeners(artistId, data);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'artist_streaming_stats',
            filter: `artist_id=eq.${artistId}`
          },
          async () => {
            // Refetch the data when streaming stats update
            const monthlyListeners = await this.getMonthlyListeners(artistId);
            const data = {
              artistId,
              monthlyListeners,
              lastUpdated: new Date().toISOString()
            };
            this.notifyListeners(artistId, data);
          }
        )
        .subscribe();

      this.channels.set(artistId, channel);
    }

    // Fetch initial data
    this.getMonthlyListeners(artistId).then(monthlyListeners => {
      callback({
        artistId,
        monthlyListeners,
        lastUpdated: new Date().toISOString()
      });
    });

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(artistId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Remove channel if no more listeners
      if (callbacks.length === 0) {
        this.listeners.delete(artistId);
        const channel = this.channels.get(artistId);
        if (channel) {
          channel.unsubscribe();
          this.channels.delete(artistId);
        }
      }
    };
  }

  /**
   * Update monthly listeners count (for demo purposes)
   */
  async updateMonthlyListeners(artistId: string, count: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('artists')
        .update({ monthly_listeners: count })
        .eq('id', artistId);

      if (error) throw error;

      this.updateCache(artistId, count);
      return true;
    } catch (error) {
      console.error('Error updating monthly listeners:', error);
      return false;
    }
  }

  /**
   * Simulate monthly listeners growth (for demo)
   */
  async simulateGrowth(artistId: string, growthPercentage: number = 5): Promise<number> {
    const currentListeners = await this.getMonthlyListeners(artistId);
    const growth = Math.floor(currentListeners * (growthPercentage / 100));
    const newCount = currentListeners + growth;
    
    await this.updateMonthlyListeners(artistId, newCount);
    return newCount;
  }

  private updateCache(artistId: string, monthlyListeners: number) {
    this.cache.set(artistId, {
      artistId,
      monthlyListeners,
      lastUpdated: new Date().toISOString()
    });
  }

  private isCacheValid(lastUpdated: string): boolean {
    const cacheTime = new Date(lastUpdated).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - cacheTime) < fiveMinutes;
  }

  private notifyListeners(artistId: string, data: MonthlyListenersData) {
    this.updateCache(artistId, data.monthlyListeners);
    const callbacks = this.listeners.get(artistId) || [];
    callbacks.forEach(callback => callback(data));
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.listeners.clear();
    this.cache.clear();
  }
}

export const monthlyListenersService = new MonthlyListenersService();
export default monthlyListenersService;
