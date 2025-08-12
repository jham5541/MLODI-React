import { supabase } from '../lib/supabase/client';
import MLServiceLite from './ml/MLServiceLite';
import { 
  TrackRecommendation, 
  UserClusterType, 
  EmergingArtist, 
  RecommendationReason,
  UserListeningProfile 
} from './ml/types';

interface DiscoverData {
  personalizedRecommendations: TrackRecommendation[];
  popularTracks: any[];
  emergingArtists: EmergingArtist[];
  userCluster: UserClusterType;
  genreBasedRecommendations: any[];
}

interface PopularityMetrics {
  trackId: string;
  playCount: number;
  uniqueListeners: number;
  averageRating: number;
  growthRate: number;
}

interface GenreAnalytics {
  genre: string;
  trendingScore: number;
  listenerGrowth: number;
  topTracks: string[];
}

export class DiscoverMLService {
  private static instance: DiscoverMLService;
  private mlService = MLServiceLite.getInstance();

  private constructor() {}

  static getInstance(): DiscoverMLService {
    if (!DiscoverMLService.instance) {
      DiscoverMLService.instance = new DiscoverMLService();
    }
    return DiscoverMLService.instance;
  }

  // 1. CONTENT-BASED FILTERING
  async getContentBasedRecommendations(
    userId: string, 
    limit: number = 20
  ): Promise<TrackRecommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      
      // Get songs with similar audio features to user's preferences
      const { data: similarTracks } = await supabase
        .rpc('find_similar_songs_by_features', {
          target_bpm: userProfile.avgTempo,
          target_energy: userProfile.avgEnergy,
          target_danceability: 0.7, // Default value
          target_valence: userProfile.avgValence,
          preferred_genres: userProfile.topGenres,
          exclude_song_ids: [], // Add user's recently played songs
          similarity_threshold: 0.15,
          limit_songs: limit
        });

      return (similarTracks || [])
        .map((track: any) => ({
          trackId: track.id,
          score: this.calculateContentSimilarity(track, userProfile),
          reason: RecommendationReason.SIMILAR_AUDIO_FEATURES,
          confidence: 0.8
        }))
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  // 2. COLLABORATIVE FILTERING
  async getCollaborativeRecommendations(
    userId: string, 
    limit: number = 20
  ): Promise<TrackRecommendation[]> {
    try {
      // Get user's play history
      const { data: playHistory } = await supabase
        .from('play_history')
        .select('song_id')
        .eq('user_id', userId)
        .limit(100);

      if (!playHistory?.length) return [];

      const songIds = playHistory.map(p => p.song_id);

      // Find similar users
      const { data: similarUsers } = await supabase
        .rpc('find_similar_users', {
          target_user_id: userId,
          user_song_ids: songIds,
          similarity_threshold: 0.2,
          limit_users: 10
        });

      if (!similarUsers?.length) return [];

      // Get recommendations from similar users' play history
      const { data: recommendations } = await supabase
        .from('play_history')
        .select(`
          song_id,
          songs (
            id, title, artist_name, genre, play_count
          )
        `)
        .in('user_id', similarUsers.map(u => u.user_id))
        .not('song_id', 'in', `(${songIds.join(',')})`)
        .limit(limit * 2);

      return (recommendations || [])
        .map((rec: any) => ({
          trackId: rec.song_id,
          score: Math.min(0.9, (rec.songs.play_count || 0) / 1000 + 0.3),
          reason: RecommendationReason.COLLABORATIVE_FILTERING,
          confidence: 0.85
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  // 3. POPULARITY-BASED RECOMMENDATIONS
  async getPopularityBasedRecommendations(
    limit: number = 20,
    timeWindow: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<PopularityMetrics[]> {
    try {
      const windowDays = timeWindow === 'daily' ? 1 : timeWindow === 'weekly' ? 7 : 30;
      
      const { data: popularTracks } = await supabase
        .from('play_history')
        .select(`
          song_id,
          songs (
            id, title, artist_name, genre, play_count
          )
        `)
        .gte('played_at', new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString())
        .limit(limit * 3);

      if (!popularTracks) return [];

      // Calculate popularity metrics
      const trackMetrics: Record<string, {
        playCount: number;
        uniqueListeners: Set<string>;
        song: any;
      }> = {};

      popularTracks.forEach(play => {
        const trackId = play.song_id;
        if (!trackMetrics[trackId]) {
          trackMetrics[trackId] = {
            playCount: 0,
            uniqueListeners: new Set(),
            song: play.songs
          };
        }
        trackMetrics[trackId].playCount++;
        trackMetrics[trackId].uniqueListeners.add(play.user_id);
      });

      return Object.entries(trackMetrics)
        .map(([trackId, metrics]) => ({
          trackId,
          playCount: metrics.playCount,
          uniqueListeners: metrics.uniqueListeners.size,
          averageRating: 4.2, // Mock rating - replace with actual data
          growthRate: Math.random() * 0.5 // Mock growth rate
        }))
        .sort((a, b) => (b.playCount * b.uniqueListeners) - (a.playCount * a.uniqueListeners))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting popularity-based recommendations:', error);
      return [];
    }
  }

  // 4. GENRE CLASSIFICATION & RECOMMENDATIONS
  async getGenreBasedRecommendations(
    userId: string,
    targetGenre?: string,
    limit: number = 15
  ): Promise<{ genre: string; tracks: TrackRecommendation[] }[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const genres = targetGenre ? [targetGenre] : userProfile.topGenres.slice(0, 3);

      const genreRecommendations = await Promise.all(
        genres.map(async (genre) => {
          const { data: genreTracks } = await supabase
            .from('tracks_public_view')
            .select('*')
            .eq('genre', genre)
            .order('play_count', { ascending: false })
            .limit(limit);

          const tracks = (genreTracks || []).map(track => ({
            trackId: track.id,
            score: this.calculateGenreScore(track, userProfile),
            reason: RecommendationReason.SIMILAR_AUDIO_FEATURES,
            confidence: 0.75
          }));

          return { genre, tracks };
        })
      );

      return genreRecommendations.filter(gr => gr.tracks.length > 0);
    } catch (error) {
      console.error('Error getting genre-based recommendations:', error);
      return [];
    }
  }

  // 7. USER SEGMENTATION
  async getUserSegmentation(userId: string): Promise<{
    cluster: UserClusterType;
    characteristics: string[];
    recommendations: string[];
  }> {
    try {
      const cluster = await this.mlService.getUserCluster(userId);
      const profile = await this.getUserProfile(userId);
      
      const characteristics = this.getClusterCharacteristics(cluster, profile);
      const recommendations = this.getClusterRecommendations(cluster);

      return {
        cluster,
        characteristics,
        recommendations
      };
    } catch (error) {
      console.error('Error getting user segmentation:', error);
      return {
        cluster: UserClusterType.CASUAL_LISTENER,
        characteristics: ['Regular music listener'],
        recommendations: ['Explore new genres']
      };
    }
  }

  // Combined Discover Data
  async getDiscoverData(userId: string): Promise<DiscoverData> {
    try {
      const [
        personalizedRecs,
        popularTracks,
        emergingArtists,
        userCluster,
        genreRecs
      ] = await Promise.all([
        this.getHybridRecommendations(userId, 15),
        this.getPopularityBasedRecommendations(10),
        this.mlService.getEmergingArtists(8),
        this.mlService.getUserCluster(userId),
        this.getGenreBasedRecommendations(userId, undefined, 10)
      ]);

      return {
        personalizedRecommendations: personalizedRecs,
        popularTracks: popularTracks,
        emergingArtists: emergingArtists,
        userCluster: userCluster,
        genreBasedRecommendations: genreRecs.flatMap(gr => gr.tracks)
      };
    } catch (error) {
      console.error('Error getting discover data:', error);
      throw error;
    }
  }

  // Hybrid recommendations combining multiple approaches
  async getHybridRecommendations(userId: string, limit: number = 20): Promise<TrackRecommendation[]> {
    try {
      const [contentRecs, collabRecs] = await Promise.all([
        this.getContentBasedRecommendations(userId, Math.floor(limit * 0.6)),
        this.getCollaborativeRecommendations(userId, Math.floor(limit * 0.4))
      ]);

      // Combine and deduplicate
      const allRecs = [...contentRecs, ...collabRecs];
      const uniqueRecs = allRecs.filter((rec, index, self) => 
        self.findIndex(r => r.trackId === rec.trackId) === index
      );

      return uniqueRecs
        .sort((a, b) => (b.score * b.confidence) - (a.score * a.confidence))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting hybrid recommendations:', error);
      return [];
    }
  }

  // Helper methods
  private async getUserProfile(userId: string): Promise<UserListeningProfile> {
    try {
      const { data: profile } = await supabase
        .from('user_listening_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        return {
          userId,
          topGenres: profile.top_genres || ['pop', 'rock'],
          topArtists: profile.top_artists || [],
          avgTempo: profile.avg_tempo || 120,
          avgEnergy: profile.avg_energy || 0.7,
          avgValence: profile.avg_valence || 0.6,
          listeningTimeDistribution: profile.listening_time_distribution || {},
          totalListeningTime: profile.total_listening_time || 0,
          uniqueTracks: profile.unique_tracks || 0,
          repeatListens: profile.repeat_listens || {}
        };
      }

      return this.createDefaultProfile(userId);
    } catch (error) {
      return this.createDefaultProfile(userId);
    }
  }

  private createDefaultProfile(userId: string): UserListeningProfile {
    return {
      userId,
      topGenres: ['pop', 'rock', 'hip-hop'],
      topArtists: [],
      avgTempo: 120,
      avgEnergy: 0.7,
      avgValence: 0.6,
      listeningTimeDistribution: {},
      totalListeningTime: 0,
      uniqueTracks: 0,
      repeatListens: {}
    };
  }

  private calculateContentSimilarity(track: any, profile: UserListeningProfile): number {
    let score = 0.5;

    // Tempo similarity
    const tempoDiff = Math.abs((track.bpm || 120) - profile.avgTempo) / 60;
    score += (1 - Math.min(tempoDiff, 1)) * 0.25;

    // Energy similarity
    const energyDiff = Math.abs((track.energy || 0.7) - profile.avgEnergy);
    score += (1 - energyDiff) * 0.25;

    // Valence similarity
    const valenceDiff = Math.abs((track.valence || 0.6) - profile.avgValence);
    score += (1 - valenceDiff) * 0.25;

    // Genre bonus
    if (track.genre && profile.topGenres.includes(track.genre)) {
      score += 0.25;
    }

    return Math.min(score, 1);
  }

  private calculateGenreScore(track: any, profile: UserListeningProfile): number {
    let score = 0.6; // Base score for genre match

    // Popularity boost
    score += Math.min((track.play_count || 0) / 10000, 0.3);

    // User preference alignment
    if (profile.topGenres.includes(track.genre)) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private getClusterCharacteristics(cluster: UserClusterType, profile: UserListeningProfile): string[] {
    const characteristics: string[] = [];

    switch (cluster) {
      case UserClusterType.POWER_USER:
        characteristics.push(
          'Heavy listener with extensive music collection',
          `Listens to ${profile.topGenres.length} different genres`,
          'Early adopter of new music'
        );
        break;
      case UserClusterType.DISCOVERY_SEEKER:
        characteristics.push(
          'Always looking for new music',
          'Diverse taste across genres',
          'Influences music trends'
        );
        break;
      case UserClusterType.GENRE_SPECIALIST:
        characteristics.push(
          `Specializes in ${profile.topGenres[0] || 'specific'} music`,
          'Deep knowledge of preferred genre',
          'Loyal to favorite artists'
        );
        break;
      case UserClusterType.ARTIST_LOYALIST:
        characteristics.push(
          'Follows specific artists closely',
          'Values artist consistency',
          'Likely to attend concerts'
        );
        break;
      default:
        characteristics.push(
          'Regular music listener',
          'Enjoys popular music',
          'Open to recommendations'
        );
    }

    return characteristics;
  }

  private getClusterRecommendations(cluster: UserClusterType): string[] {
    switch (cluster) {
      case UserClusterType.POWER_USER:
        return [
          'Explore emerging artists',
          'Try curated playlists',
          'Discover rare tracks'
        ];
      case UserClusterType.DISCOVERY_SEEKER:
        return [
          'Check out weekly new releases',
          'Follow music blogs and critics',
          'Explore underground scenes'
        ];
      case UserClusterType.GENRE_SPECIALIST:
        return [
          'Deep dive into subgenres',
          'Find similar artists',
          'Explore genre history'
        ];
      case UserClusterType.ARTIST_LOYALIST:
        return [
          'Follow artist social media',
          'Explore artist collaborations',
          'Check out side projects'
        ];
      default:
        return [
          'Try personalized playlists',
          'Explore trending music',
          'Discover new genres'
        ];
    }
  }

  // Update user profile based on listening activity
  async updateUserProfile(userId: string, activityData: {
    trackId: string;
    duration: number;
    genre?: string;
    artistId?: string;
    audioFeatures?: any;
  }): Promise<void> {
    try {
      // This would update the user's listening profile
      // Implementation depends on your data structure
      await this.mlService.saveUserActivity(userId, activityData.trackId, activityData.duration);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }
}

export default DiscoverMLService.getInstance();
