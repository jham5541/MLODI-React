import { createClient } from '@supabase/supabase-js';
import { 
  ArtistFanScore, 
  ArtistEngagement, 
  EngagementType 
} from '../types/fanScoring';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database service class for fan scoring operations
class DatabaseService {
  private supabaseClient = supabase;
  
  get supabase() {
    return this.supabaseClient;
  }

  
  /**
   * Save engagement to Supabase
   */
  async saveEngagement(engagement: ArtistEngagement): Promise<void> {
    const { error } = await supabase
      .from('engagements')
      .insert({
        id: engagement.id,
        user_id: engagement.userId,
        artist_id: engagement.artistId,
        engagement_type: engagement.engagementType,
        points: engagement.points,
        timestamp: engagement.timestamp.toISOString(),
        metadata: engagement.metadata || {}
      });

    if (error) {
      console.error('Error saving engagement:', error);
      throw new Error(`Failed to save engagement: ${error.message}`);
    }
  }

  /**
   * Save or update fan score in Supabase
   */
  async saveFanScore(fanScore: ArtistFanScore): Promise<void> {
    const { error } = await supabase
      .from('fan_scores')
      .upsert({
        user_id: fanScore.userId,
        artist_id: fanScore.artistId,
        points: fanScore.totalScore,
        streaming_points: fanScore.engagementBreakdown.streaming,
        purchase_points: fanScore.engagementBreakdown.purchases,
        social_points: fanScore.engagementBreakdown.social,
        video_points: fanScore.engagementBreakdown.videos,
        event_points: fanScore.engagementBreakdown.events,
        consecutive_days: fanScore.consecutiveDays,
        fan_since: fanScore.fanSince.toISOString(),
        last_updated: fanScore.lastUpdated.toISOString()
      }, {
        onConflict: 'user_id,artist_id'
      });

    if (error) {
      console.error('Error saving fan score:', error);
      throw new Error(`Failed to save fan score: ${error.message}`);
    }
  }

  /**
   * Get engagements for a user and artist
   */
  async getEngagementsByArtist(userId: string, artistId: string): Promise<ArtistEngagement[]> {
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching engagements:', error);
      throw new Error(`Failed to fetch engagements: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      artistId: row.artist_id,
      engagementType: row.engagement_type as EngagementType,
      points: row.points,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata || {}
    }));
  }

  /**
   * Get fan score for a user and artist
   */
  async getFanScore(userId: string, artistId: string): Promise<ArtistFanScore | null> {
    const { data, error } = await supabase
      .from('fan_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching fan score:', error);
      throw new Error(`Failed to fetch fan score: ${error.message}`);
    }

    if (!data) return null;

    return {
      userId: data.user_id,
      artistId: data.artist_id,
      totalScore: data.total_score,
      engagementBreakdown: {
        streaming: data.streaming_points,
        purchases: data.purchase_points,
        social: data.social_points,
        videos: data.video_points,
        events: data.event_points,
      },
      lastUpdated: new Date(data.last_updated),
      consecutiveDays: data.consecutive_days,
      fanSince: new Date(data.fan_since),
    };
  }

  /**
   * Get all fan scores for a user
   */
  async getUserFanScores(userId: string): Promise<ArtistFanScore[]> {
    const { data, error } = await supabase
      .from('fan_scores')
      .select(`
        *,
        artists(name, image_url)
      `)
      .eq('user_id', userId)
      .order('total_score', { ascending: false });

    if (error) {
      console.error('Error fetching user fan scores:', error);
      throw new Error(`Failed to fetch user fan scores: ${error.message}`);
    }

    return (data || []).map(row => ({
      userId: row.user_id,
      artistId: row.artist_id,
      totalScore: row.points,
      engagementBreakdown: {
        streaming: row.streaming_points,
        purchases: row.purchase_points,
        social: row.social_points,
        videos: row.video_points,
        events: row.event_points,
      },
      lastUpdated: new Date(row.last_updated),
      consecutiveDays: row.consecutive_days,
      fanSince: new Date(row.fan_since),
    }));
  }

  /**
   * Get artist fan leaderboard
   */
  async getArtistLeaderboard(artistId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('fan_scores')
      .select(`
        *,
        users(username, avatar_url)
      `)
      .eq('artist_id', artistId)
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }

    return (data || []).map((row, index) => ({
      userId: row.user_id,
      artistId: row.artist_id,
      username: row.users?.username || `User${row.user_id.slice(0, 8)}`,
      profilePicture: row.users?.avatar_url,
      fanScore: row.points,
      rank: offset + index + 1,
      badges: [], // Will be calculated separately
      percentile: 0, // Will be calculated separately
    }));
  }

  /**
   * Get user rank for specific artist
   */
  async getUserRank(userId: string, artistId: string): Promise<{ rank: number; totalFans: number } | null> {
    // Get user's score
    const userScore = await this.getFanScore(userId, artistId);
    if (!userScore) return null;

    // Count users with higher scores
    const { count: higherScores, error: rankError } = await supabase
      .from('fan_scores')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId)
      .gt('points', userScore.totalScore);

    if (rankError) {
      console.error('Error calculating rank:', rankError);
      throw new Error(`Failed to calculate rank: ${rankError.message}`);
    }

    // Count total fans
    const { count: totalFans, error: countError } = await supabase
      .from('fan_scores')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    if (countError) {
      console.error('Error counting total fans:', countError);
      throw new Error(`Failed to count total fans: ${countError.message}`);
    }

    return {
      rank: (higherScores || 0) + 1,
      totalFans: totalFans || 0,
    };
  }

  /**
   * Get daily engagement count for rate limiting
   */
  async getDailyEngagementCount(userId: string, artistId: string, engagementType: EngagementType): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count, error } = await supabase
      .from('engagements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .eq('engagement_type', engagementType)
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());

    if (error) {
      console.error('Error getting daily engagement count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get recent engagements for user
   */
  async getRecentEngagements(userId: string, artistId: string, limit: number = 10): Promise<ArtistEngagement[]> {
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent engagements:', error);
      throw new Error(`Failed to fetch recent engagements: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      artistId: row.artist_id,
      engagementType: row.engagement_type as EngagementType,
      points: row.points,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata || {}
    }));
  }

  /**
   * Get user profile
   */
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users_public_view')
      .select('username, profile_picture, first_name, last_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return {
      username: data?.username || `User${userId.slice(0, 8)}`,
      profilePicture: data?.profile_picture,
      firstName: data?.first_name,
      lastName: data?.last_name,
    };
  }

  /**
   * Get artist profile
   */
  async getArtist(artistId: string) {
    const { data, error } = await supabase
      .from('artists')
      .select('name, image_url, banner_url, bio, primary_genre, monthly_listeners, verified')
      .eq('id', artistId)
      .single();

    if (error) {
      console.error('Error fetching artist:', error);
      return null;
    }

    return {
      name: data?.name,
      profilePicture: data?.image_url,
      bannerUrl: data?.banner_url,
      bio: data?.bio,
      genre: data?.primary_genre,
      monthlyListeners: data?.monthly_listeners,
      verified: data?.verified
    };
  }

  /**
   * Subscribe to leaderboard updates for a specific artist
   */
  subscribeToArtistLeaderboard(artistId: string, callback: () => void) {
    const subscription = supabase
      .channel(`public:fan_scores:artist_id=eq.${artistId}`)
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public',
          table: 'fan_scores',
          filter: `artist_id=eq.${artistId}`
        }, 
        () => callback()
      )
      .subscribe();

    return subscription;
  }
}

export const databaseService = new DatabaseService();
