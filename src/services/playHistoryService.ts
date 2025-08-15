import { supabase } from '../lib/supabase/client';

interface PlayHistoryEntry {
  userId: string;
  trackId: string;
  durationPlayed: number;
  completed: boolean;
}

class PlayHistoryService {
  private playStartTime: Map<string, number> = new Map();

  /**
   * Start tracking a play session
   */
  startPlay(trackId: string) {
    this.playStartTime.set(trackId, Date.now());
  }

  /**
   * End a play session and record it
   */
  async endPlay(
    userId: string,
    trackId: string,
    totalDuration: number,
    currentPosition: number
  ): Promise<boolean> {
    try {
      const startTime = this.playStartTime.get(trackId);
      if (!startTime) {
        console.warn('No start time recorded for track:', trackId);
        return false;
      }

      const durationPlayed = Math.floor((Date.now() - startTime) / 1000);
      const completed = currentPosition >= totalDuration * 0.8; // 80% completion

      // Record play history
      const { error } = await supabase
        .from('play_history')
        .insert({
          user_id: userId,
          track_id: trackId,
          duration_played: durationPlayed,
          completed,
          played_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording play history:', error);
        return false;
      }

      // Clean up
      this.playStartTime.delete(trackId);

      // The database trigger will automatically update artist metrics
      console.log('Play history recorded:', {
        trackId,
        durationPlayed,
        completed
      });

      return true;
    } catch (error) {
      console.error('Error in endPlay:', error);
      return false;
    }
  }

  /**
   * Record a quick play (for skipped songs)
   */
  async recordQuickPlay(
    userId: string,
    trackId: string,
    durationPlayed: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('play_history')
        .insert({
          user_id: userId,
          track_id: trackId,
          duration_played,
          completed: false,
          played_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording quick play:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordQuickPlay:', error);
      return false;
    }
  }

  /**
   * Get user's play history
   */
  async getUserPlayHistory(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('play_history')
        .select(`
          id,
          played_at,
          duration_played,
          completed,
          track:tracks (
            id,
            title,
            artist_name,
            cover_url,
            duration
          )
        `)
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching play history:', error);
      return [];
    }
  }

  /**
   * Get artist's play statistics
   */
  async getArtistPlayStats(artistId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('artist_streaming_stats')
        .select('*')
        .eq('artist_id', artistId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching artist play stats:', error);
      return [];
    }
  }

  /**
   * Check if a track has been played by user
   */
  async hasUserPlayedTrack(userId: string, trackId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('play_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('track_id', trackId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking if track played:', error);
      return false;
    }
  }

  /**
   * Get recently played tracks for a user
   */
  async getRecentlyPlayed(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('play_history')
        .select(`
          track_id,
          played_at,
          tracks (
            id,
            title,
            artist_name,
            cover_url,
            duration,
            artist_id
          )
        `)
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Remove duplicates, keeping only the most recent play
      const uniqueTracks = new Map();
      data?.forEach(item => {
        if (!uniqueTracks.has(item.track_id)) {
          uniqueTracks.set(item.track_id, item);
        }
      });

      return Array.from(uniqueTracks.values());
    } catch (error) {
      console.error('Error fetching recently played:', error);
      return [];
    }
  }
}

export const playHistoryService = new PlayHistoryService();
export default playHistoryService;
