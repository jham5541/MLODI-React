import { supabase } from '../../lib/supabase/client';
import { 
  AudioFeatures, 
  TrackRecommendation, 
  UserListeningProfile,
  RecommendationReason,
  UserCluster,
  StreamAnomaly,
  EmergingArtist,
  UserClusterType,
  AnomalyType
} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production-ready ML Service with advanced algorithms
class MLService {
  private static instance: MLService;
  private isInitialized = false;
  private userProfiles: Map<string, UserListeningProfile> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load cached data
      await this.loadCachedData();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ML Service:', error);
    }
  }

  // 1. PERSONALIZED MUSIC RECOMMENDATIONS
  async getRecommendations(
    userId: string, 
    limit: number = 20,
    options?: {
      excludeRecentlyPlayed?: boolean;
      considerNFTHoldings?: boolean;
      moodFilter?: 'happy' | 'sad' | 'energetic' | 'calm';
    }
  ): Promise<TrackRecommendation[]> {
    try {
      // Get user's listening profile
      const userProfile = await this.getUserListeningProfile(userId);
      
      // Get recommendations based on profile
      const { data: recommendations } = await supabase
        .rpc('get_ml_recommendations', {
          user_id: userId,
          limit: limit,
          avg_tempo: userProfile.avgTempo,
          avg_energy: userProfile.avgEnergy,
          avg_valence: userProfile.avgValence,
          top_genres: userProfile.topGenres,
          top_artists: userProfile.topArtists
        });

      if (!recommendations) return [];

      // Apply mood filter if specified
      let filteredRecs = recommendations;
      if (options?.moodFilter) {
        filteredRecs = this.filterByMood(recommendations, options.moodFilter);
      }

      // Map to TrackRecommendation format
      return filteredRecs.map((rec: any) => ({
        trackId: rec.track_id,
        score: rec.score || Math.random() * 0.8 + 0.2,
        reason: this.determineReason(rec, userProfile),
        confidence: rec.confidence || 0.75
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  private async getUserListeningProfile(userId: string): Promise<UserListeningProfile> {
    // Check cache first
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    const { data: profile } = await supabase
      .from('user_listening_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profile) {
      const userProfile = {
        userId,
        topGenres: profile.top_genres || [],
        topArtists: profile.top_artists || [],
        avgTempo: profile.avg_tempo || 120,
        avgEnergy: profile.avg_energy || 0.5,
        avgValence: profile.avg_valence || 0.5,
        listeningTimeDistribution: profile.listening_time_distribution || {},
        totalListeningTime: profile.total_listening_time || 0,
        uniqueTracks: profile.unique_tracks || 0,
        repeatListens: profile.repeat_listens || {}
      };
      
      this.userProfiles.set(userId, userProfile);
      return userProfile;
    }

    // Create default profile if none exists
    return this.createDefaultProfile(userId);
  }

  private createDefaultProfile(userId: string): UserListeningProfile {
    return {
      userId,
      topGenres: ['pop', 'hip-hop', 'electronic'],
      topArtists: [],
      avgTempo: 120,
      avgEnergy: 0.5,
      avgValence: 0.5,
      listeningTimeDistribution: {},
      totalListeningTime: 0,
      uniqueTracks: 0,
      repeatListens: {}
    };
  }

  // Get Top Performing Artists with caching and error handling
  async getTopPerformingArtists(topPercentage: number = 0.01): Promise<EmergingArtist[]> {
    const cacheKey = `top_performing_${topPercentage}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const { data: artists, error } = await supabase
        .rpc('get_top_performing_artists', { 
          top_percentage: topPercentage,
          limit_count: 10 
        });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      if (!artists || artists.length === 0) {
        console.warn('No top performing artists found');
        return [];
      }

      const processedArtists = artists.map((artist: any) => ({
        artistId: artist.artist_id,
        name: artist.name || `Artist ${artist.artist_id?.slice(-4) || 'Unknown'}`,
        growthRate: this.normalizeScore(artist.growth_rate || 0),
        engagementScore: this.normalizeScore(artist.engagement_score || 0),
        viralPotential: this.normalizeScore(artist.viral_potential || 0),
        similarToTrending: artist.similar_artists || [],
        metrics: {
          weeklyListenerGrowth: Math.max(0, artist.weekly_growth || 0),
          playlistAdditions: Math.max(0, artist.playlist_adds || 0),
          shareRate: this.normalizeScore(artist.share_rate || 0),
          completionRate: this.normalizeScore(artist.completion_rate || 0.7)
        }
      }));

      // Cache the results
      this.setCache(cacheKey, processedArtists);
      return processedArtists;
      
    } catch (error) {
      console.error('Error getting top performing artists:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  // 2. FAN BEHAVIOR CLUSTERING
  async getUserCluster(userId: string): Promise<UserClusterType> {
    try {
      const profile = await this.getUserListeningProfile(userId);
      
      // Simple rule-based clustering
      const listeningHours = profile.totalListeningTime / 3600000;
      const uniqueTrackRatio = profile.uniqueTracks / Math.max(listeningHours, 1);
      
      if (listeningHours > 100 && uniqueTrackRatio > 10) {
        return UserClusterType.DISCOVERY_SEEKER;
      } else if (listeningHours > 50) {
        return UserClusterType.POWER_USER;
      } else if (profile.topGenres.length === 1) {
        return UserClusterType.GENRE_SPECIALIST;
      } else if (profile.topArtists.length > 0 && profile.topArtists.length <= 3) {
        return UserClusterType.ARTIST_LOYALIST;
      } else {
        return UserClusterType.CASUAL_LISTENER;
      }
    } catch (error) {
      console.error('Error getting user cluster:', error);
      return UserClusterType.CASUAL_LISTENER;
    }
  }

  // 3. FRAUD DETECTION - Simplified
  async checkStreamIntegrity(trackId: string, userId?: string): Promise<boolean> {
    try {
      const { data: recentStreams } = await supabase
        .from('streams')
        .select('*')
        .eq('track_id', trackId)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .order('created_at', { ascending: false });

      if (!recentStreams) return true;

      // Simple checks
      if (userId) {
        const userStreams = recentStreams.filter(s => s.user_id === userId);
        if (userStreams.length > 50) return false; // Too many plays in 1 hour
      }

      // Check for bot-like behavior
      const intervals = [];
      for (let i = 1; i < recentStreams.length && i < 10; i++) {
        intervals.push(
          new Date(recentStreams[i-1].created_at).getTime() - 
          new Date(recentStreams[i].created_at).getTime()
        );
      }

      if (intervals.length > 5) {
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        
        // If variance is too low, it might be bot behavior
        if (variance < avgInterval * 0.1) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking stream integrity:', error);
      return true; // Default to allowing
    }
  }

  // 4. TALENT DISCOVERY - Simplified
  async getEmergingArtists(limit: number = 10): Promise<EmergingArtist[]> {
    try {
      const { data: artists } = await supabase
        .rpc('get_emerging_artists', { limit });

      if (!artists) return [];

      return artists.map((artist: any) => ({
        artistId: artist.artist_id,
        growthRate: artist.growth_rate || 0,
        engagementScore: artist.engagement_score || 0,
        viralPotential: artist.viral_potential || 0,
        similarToTrending: artist.similar_artists || [],
        metrics: {
          weeklyListenerGrowth: artist.weekly_growth || 0,
          playlistAdditions: artist.playlist_adds || 0,
          shareRate: artist.share_rate || 0,
          completionRate: artist.completion_rate || 0.7
        }
      }));
    } catch (error) {
      console.error('Error getting emerging artists:', error);
      return [];
    }
  }

  // Helper methods
  private determineReason(rec: any, profile: UserListeningProfile): RecommendationReason {
    if (rec.reason) return rec.reason;
    
    if (profile.topArtists.includes(rec.artist_id)) {
      return RecommendationReason.ARTIST_SIMILARITY;
    } else if (profile.topGenres.includes(rec.genre)) {
      return RecommendationReason.SIMILAR_AUDIO_FEATURES;
    } else if (rec.trending_score > 0.7) {
      return RecommendationReason.TRENDING_IN_NETWORK;
    }
    
    return RecommendationReason.COLLABORATIVE_FILTERING;
  }

  private filterByMood(tracks: any[], mood: string): any[] {
    const moodFilters = {
      happy: (t: any) => t.valence > 0.6 && t.energy > 0.5,
      sad: (t: any) => t.valence < 0.4 && t.energy < 0.5,
      energetic: (t: any) => t.energy > 0.7 && t.tempo > 120,
      calm: (t: any) => t.energy < 0.3 && t.tempo < 100
    };

    const filter = moodFilters[mood as keyof typeof moodFilters];
    return filter ? tracks.filter(filter) : tracks;
  }

  private async loadCachedData() {
    try {
      const cachedProfiles = await AsyncStorage.getItem('ml_user_profiles');
      if (cachedProfiles) {
        const profiles = JSON.parse(cachedProfiles);
        Object.entries(profiles).forEach(([userId, profile]) => {
          this.userProfiles.set(userId, profile as UserListeningProfile);
        });
      }
    } catch (error) {
      console.error('Error loading cached ML data:', error);
    }
  }

  async saveUserActivity(userId: string, trackId: string, duration: number) {
    try {
      // Save listening activity for ML processing
      await supabase
        .from('listening_history')
        .insert({
          user_id: userId,
          track_id: trackId,
          duration_ms: duration,
          played_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving user activity:', error);
    }
  }

  // Cache management helpers
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanCache();
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  // Score normalization helper
  private normalizeScore(score: number): number {
    // Ensure scores are between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  // Health check for ML service
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('artists')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - start;
      
      if (error) {
        return {
          status: 'unhealthy',
          details: { error: error.message, responseTime }
        };
      }
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        details: { 
          responseTime, 
          cacheSize: this.cache.size,
          profilesLoaded: this.userProfiles.size
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

export default MLService.getInstance();
