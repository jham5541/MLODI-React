import { 
  FanLeaderboard, 
  LeaderboardQuery, 
  LeaderboardType, 
  FanRankInfo,
  ArtistFanScore 
} from '../types/fanScoring';
import { fanScoringService } from './fanScoringService';
import { LEADERBOARD_LIMITS } from '../config/fanScoringConfig';

class LeaderboardService {
  private leaderboardCache: Map<string, { data: FanLeaderboard[], timestamp: Date }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate artist-specific leaderboard
   */
  async generateArtistLeaderboard(query: LeaderboardQuery): Promise<FanLeaderboard[]> {
    const cacheKey = this.getCacheKey(query);
    
    // Check cache first
    const cached = this.leaderboardCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return this.paginateResults(cached.data, query);
    }

    // Generate fresh leaderboard
    const leaderboard = await this.buildLeaderboard(query);
    
    // Cache the results
    this.leaderboardCache.set(cacheKey, {
      data: leaderboard,
      timestamp: new Date()
    });

    return this.paginateResults(leaderboard, query);
  }

  /**
   * Build leaderboard based on query parameters
   */
  private async buildLeaderboard(query: LeaderboardQuery): Promise<FanLeaderboard[]> {
    const { artistId, type } = query;
    
    // Get all fans for this artist
    const artistFans = await this.getArtistFans(artistId);
    
    // Filter based on leaderboard type
    const filteredFans = await this.filterByType(artistFans, type, query);
    
    // Sort by score and assign ranks
    const sortedFans = filteredFans
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((fan, index) => ({
        ...fan,
        rank: index + 1,
        percentile: Math.round(((filteredFans.length - index) / filteredFans.length) * 100)
      }));

    return sortedFans;
  }

  /**
   * Get all fans for a specific artist
   */
  private async getArtistFans(artistId: string): Promise<FanLeaderboard[]> {
    // This would query the database for all users with scores for this artist
    // For now, we'll simulate with the service data
    const allScores = await this.getAllArtistScores(artistId);
    
    const fans: FanLeaderboard[] = [];
    
    for (const score of allScores) {
      const user = await this.getUser(score.userId);
      if (!user) continue;

      const badges = fanScoringService.calculateFanBadges(
        score.userId, 
        score.artistId, 
        score.totalScore
      );

      fans.push({
        userId: score.userId,
        artistId: score.artistId,
        username: user.username,
        profilePicture: user.profilePicture,
        fanScore: score.totalScore,
        rank: 0, // Will be set later
        badges,
        percentile: 0 // Will be calculated later
      });
    }

    return fans.filter(fan => fan.fanScore > 0);
  }

  /**
   * Filter fans based on leaderboard type
   */
  private async filterByType(
    fans: FanLeaderboard[], 
    type: LeaderboardType, 
    query: LeaderboardQuery
  ): Promise<FanLeaderboard[]> {
    
    switch (type) {
      case LeaderboardType.ALL_TIME:
        return fans;

      case LeaderboardType.MONTHLY:
        return this.filterByTimeframe(fans, 30);

      case LeaderboardType.WEEKLY:
        return this.filterByTimeframe(fans, 7);

      case LeaderboardType.DAILY:
        return this.filterByTimeframe(fans, 1);

      case LeaderboardType.NEW_FANS:
        return this.filterNewFans(fans, 30); // Fans discovered in last 30 days

      case LeaderboardType.SUPERFANS:
        return this.filterSuperfans(fans);

      case LeaderboardType.LOCAL:
        return this.filterByLocation(fans, query.location);

      default:
        return fans;
    }
  }

  /**
   * Filter fans by timeframe
   */
  private filterByTimeframe(fans: FanLeaderboard[], days: number): FanLeaderboard[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // This would need to recalculate scores based on engagements within timeframe
    // For now, returning all fans (would need actual engagement filtering)
    return fans;
  }

  /**
   * Filter new fans (discovered within specified days)
   */
  private filterNewFans(fans: FanLeaderboard[], days: number): FanLeaderboard[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // This would filter based on fanSince date
    // For now, returning a subset
    return fans.slice(0, LEADERBOARD_LIMITS.NEW_FANS);
  }

  /**
   * Filter superfans (top percentile)
   */
  private filterSuperfans(fans: FanLeaderboard[]): FanLeaderboard[] {
    // Get top 1% or minimum 10 fans, whichever is larger
    const superfanCount = Math.max(10, Math.ceil(fans.length * 0.01));
    return fans
      .sort((a, b) => b.fanScore - a.fanScore)
      .slice(0, superfanCount);
  }

  /**
   * Filter fans by location
   */
  private filterByLocation(fans: FanLeaderboard[], location?: { country?: string; city?: string }): FanLeaderboard[] {
    if (!location) return fans;

    // This would filter based on user location data
    // For now, returning all fans
    return fans;
  }

  /**
   * Get user's rank for specific artist
   */
  async getUserRank(userId: string, artistId: string, type: LeaderboardType = LeaderboardType.ALL_TIME): Promise<FanRankInfo | null> {
    const query: LeaderboardQuery = { artistId, type };
    const leaderboard = await this.generateArtistLeaderboard(query);
    
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    if (!userEntry) return null;

    // Get points needed for next rank
    const nextRankEntry = leaderboard.find(entry => entry.rank === userEntry.rank - 1);
    const pointsToNextRank = nextRankEntry ? nextRankEntry.fanScore - userEntry.fanScore : 0;

    // Get recent activity
    const recentActivity = await this.getRecentActivity(userId, artistId);

    return {
      userId,
      artistId,
      currentRank: userEntry.rank,
      totalFans: leaderboard.length,
      percentile: userEntry.percentile,
      pointsToNextRank,
      recentActivity
    };
  }

  /**
   * Get leaderboard for multiple artists (user's top artists)
   */
  async getMultiArtistLeaderboard(userId: string): Promise<{ artistId: string; rank: number; totalFans: number; fanScore: number }[]> {
    const userScores = await fanScoringService.getUserFanScores(userId);
    const rankings = [];

    for (const score of userScores) {
      const rankInfo = await this.getUserRank(userId, score.artistId);
      if (rankInfo) {
        rankings.push({
          artistId: score.artistId,
          rank: rankInfo.currentRank,
          totalFans: rankInfo.totalFans,
          fanScore: score.totalScore
        });
      }
    }

    return rankings.sort((a, b) => a.rank - b.rank);
  }

  /**
   * Get trending fans (fans with recent significant activity)
   */
  async getTrendingFans(artistId: string, days: number = 7): Promise<FanLeaderboard[]> {
    // This would analyze recent engagement spikes
    // For now, returning recent high-activity fans
    const allFans = await this.getArtistFans(artistId);
    
    // Simulate trending by recent activity (would need actual engagement analysis)
    return allFans
      .sort((a, b) => b.fanScore - a.fanScore)
      .slice(0, 20);
  }

  /**
   * Paginate results
   */
  private paginateResults(data: FanLeaderboard[], query: LeaderboardQuery): FanLeaderboard[] {
    const limit = Math.min(query.limit || LEADERBOARD_LIMITS.DEFAULT, LEADERBOARD_LIMITS.MAX);
    const offset = query.offset || 0;
    
    return data.slice(offset, offset + limit);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(query: LeaderboardQuery): string {
    return `leaderboard-${query.artistId}-${query.type}-${query.limit || 'default'}-${query.offset || 0}`;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(timestamp: Date): boolean {
    return Date.now() - timestamp.getTime() < this.CACHE_DURATION;
  }

  /**
   * Clear cache for specific artist
   */
  clearArtistCache(artistId: string): void {
    for (const [key] of this.leaderboardCache.entries()) {
      if (key.includes(`-${artistId}-`)) {
        this.leaderboardCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.leaderboardCache.clear();
  }

  // Helper methods (would be implemented with actual database queries)
  
  private async getAllArtistScores(artistId: string): Promise<ArtistFanScore[]> {
    // This would query all fan scores for the artist from database
    // For now, returning empty array (would need actual implementation)
    return [];
  }

  private async getUser(userId: string): Promise<{ username: string; profilePicture?: string } | null> {
    // This would get user data from database
    // Placeholder implementation
    return {
      username: `User${userId.slice(0, 6)}`,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    };
  }

  private async getRecentActivity(userId: string, artistId: string): Promise<any[]> {
    // This would get recent engagements
    // Placeholder implementation
    return [];
  }
}

export const leaderboardService = new LeaderboardService();
