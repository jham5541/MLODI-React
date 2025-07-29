import { 
  ArtistFanScore, 
  ArtistEngagement, 
  EngagementType, 
  FanBadge,
  LeaderboardType 
} from '../types/fanScoring';
import { 
  ENGAGEMENT_POINTS, 
  TIME_MULTIPLIERS, 
  LOYALTY_BONUSES, 
  QUALITY_MULTIPLIERS,
  DAILY_CAPS,
  ANTI_GAMING,
  BADGE_THRESHOLDS
} from '../config/fanScoringConfig';
import { generateId } from '../utils/helpers';
import { databaseService } from './databaseService';

class FanScoringService {
  private recentActions: Map<string, Date[]> = new Map();

  /**
   * Track a new engagement for a specific artist
   */
  async trackEngagement(
    userId: string,
    artistId: string,
    engagementType: EngagementType,
    metadata?: any
  ): Promise<void> {
    // Anti-gaming checks
    if (!this.isValidEngagement(userId, engagementType, metadata)) {
      console.warn(`Invalid engagement detected: ${userId} - ${engagementType}`);
      return;
    }

    // Check daily caps
    if (await this.isDailyCap(userId, artistId, engagementType)) {
      console.warn(`Daily cap reached: ${userId} - ${engagementType}`);
      return;
    }

    // Calculate base points
    const basePoints = ENGAGEMENT_POINTS[engagementType] || 0;
    
    // Apply multipliers
    const finalPoints = this.calculatePoints(userId, artistId, engagementType, basePoints, metadata);

    // Create engagement record
    const engagement: ArtistEngagement = {
      id: generateId(),
      userId,
      artistId,
      engagementType,
      points: finalPoints,
      timestamp: new Date(),
      metadata
    };

    // Store engagement in database
    await databaseService.saveEngagement(engagement);
    
    // Update fan score
    await this.updateArtistFanScore(userId, artistId);
    
    // Track for anti-gaming
    this.trackRecentAction(userId, engagementType);
  }

  /**
   * Calculate final points with all multipliers applied
   */
  private calculatePoints(
    userId: string,
    artistId: string,
    engagementType: EngagementType,
    basePoints: number,
    metadata?: any
  ): number {
    let points = basePoints;

    // Time-based multiplier
    points *= this.getTimeMultiplier(new Date());

    // Quality multipliers
    if (metadata?.completionRate !== undefined) {
      points *= this.getCompletionRateMultiplier(metadata.completionRate);
    }

    // Loyalty bonuses
    const consecutiveDays = this.getConsecutiveDays(userId, artistId);
    points *= this.getLoyaltyMultiplier(consecutiveDays);

    // Engagement consistency bonus
    const consistency = this.getEngagementConsistency(userId, artistId);
    points *= QUALITY_MULTIPLIERS.ENGAGEMENT_CONSISTENCY[consistency];

    return Math.round(points);
  }

  /**
   * Get time-based multiplier
   */
  private getTimeMultiplier(timestamp: Date): number {
    const now = new Date();
    const hoursSince = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSince <= 24) return TIME_MULTIPLIERS.LAST_24_HOURS;
    if (hoursSince <= 168) return TIME_MULTIPLIERS.LAST_7_DAYS; // 7 days
    if (hoursSince <= 720) return TIME_MULTIPLIERS.LAST_30_DAYS; // 30 days
    if (hoursSince <= 2160) return TIME_MULTIPLIERS.LAST_90_DAYS; // 90 days
    return TIME_MULTIPLIERS.OLDER;
  }

  /**
   * Get completion rate multiplier
   */
  private getCompletionRateMultiplier(completionRate: number): number {
    if (completionRate >= 0.9) return QUALITY_MULTIPLIERS.COMPLETION_RATE.COMPLETE_LISTEN;
    if (completionRate >= 0.7) return QUALITY_MULTIPLIERS.COMPLETION_RATE.MOSTLY_COMPLETE;
    if (completionRate >= 0.3) return QUALITY_MULTIPLIERS.COMPLETION_RATE.PARTIAL;
    return QUALITY_MULTIPLIERS.COMPLETION_RATE.BRIEF;
  }

  /**
   * Get loyalty multiplier based on consecutive days
   */
  private getLoyaltyMultiplier(consecutiveDays: number): number {
    const bonuses = LOYALTY_BONUSES.CONSECUTIVE_DAYS;
    
    if (consecutiveDays >= 365) return bonuses[365];
    if (consecutiveDays >= 180) return bonuses[180];
    if (consecutiveDays >= 90) return bonuses[90];
    if (consecutiveDays >= 60) return bonuses[60];
    if (consecutiveDays >= 30) return bonuses[30];
    if (consecutiveDays >= 14) return bonuses[14];
    if (consecutiveDays >= 7) return bonuses[7];
    
    return 1.0;
  }

  /**
   * Calculate artist-specific fan score
   */
  async calculateArtistFanScore(userId: string, artistId: string): Promise<number> {
    const engagements = await databaseService.getEngagementsByArtist(userId, artistId);
    let totalScore = 0;
    
    const breakdown = {
      streaming: 0,
      purchases: 0,
      social: 0,
      videos: 0,
      events: 0,
    };

    engagements.forEach(engagement => {
      if (engagement.artistId !== artistId) return; // Safety check
      
      totalScore += engagement.points;
      
      // Update breakdown
      switch (engagement.engagementType) {
        case EngagementType.SONG_PLAY:
        case EngagementType.SONG_COMPLETE:
        case EngagementType.ALBUM_PLAY:
        case EngagementType.PLAYLIST_ADD:
        case EngagementType.SONG_REPEAT:
        case EngagementType.SONG_SHARE:
          breakdown.streaming += engagement.points;
          break;
        
        case EngagementType.SONG_PURCHASE:
        case EngagementType.ALBUM_PURCHASE:
        case EngagementType.MERCHANDISE:
        case EngagementType.CONCERT_TICKET:
          breakdown.purchases += engagement.points;
          break;
        
        case EngagementType.VIDEO_VIEW:
        case EngagementType.VIDEO_COMPLETE:
        case EngagementType.VIDEO_LIKE:
        case EngagementType.VIDEO_SHARE:
        case EngagementType.VIDEO_COMMENT:
          breakdown.videos += engagement.points;
          break;
        
        case EngagementType.ARTIST_FOLLOW:
        case EngagementType.POST_LIKE:
        case EngagementType.POST_COMMENT:
        case EngagementType.POST_SHARE:
          breakdown.social += engagement.points;
          break;
        
        case EngagementType.CONCERT_ATTENDANCE:
        case EngagementType.MEET_GREET:
        case EngagementType.VIP_EXPERIENCE:
        case EngagementType.NEW_RELEASE_EARLY_ACCESS:
          breakdown.events += engagement.points;
          break;
      }
    });

    // Get existing fan score to preserve fan_since date
    const existingScore = await databaseService.getFanScore(userId, artistId);
    const fanSinceDate = existingScore?.fanSince || new Date();
    
    // Store the updated score
    const fanScore: ArtistFanScore = {
      userId,
      artistId,
      totalScore,
      engagementBreakdown: breakdown,
      lastUpdated: new Date(),
      consecutiveDays: await this.getConsecutiveDays(userId, artistId),
      fanSince: fanSinceDate,
    };

    await databaseService.saveFanScore(fanScore);
    return totalScore;
  }

  /**
   * Calculate fan badges for a user and artist
   */
  calculateFanBadges(userId: string, artistId: string, score: number): FanBadge[] {
    const badges: FanBadge[] = [];
    const now = new Date();

    // Score-based badges
    if (score >= BADGE_THRESHOLDS.LEGENDARY_FAN) {
      badges.push({
        id: `legendary-${artistId}`,
        name: 'Legendary Fan',
        description: 'Ultimate dedication to this artist',
        icon: '👑',
        color: '#FFD700',
        rarity: 'legendary',
        unlockedAt: now,
      });
    } else if (score >= BADGE_THRESHOLDS.DIAMOND_FAN) {
      badges.push({
        id: `diamond-${artistId}`,
        name: 'Diamond Fan',
        description: 'Exceptional loyalty and support',
        icon: '💎',
        color: '#B9F2FF',
        rarity: 'epic',
        unlockedAt: now,
      });
    } else if (score >= BADGE_THRESHOLDS.PLATINUM_FAN) {
      badges.push({
        id: `platinum-${artistId}`,
        name: 'Platinum Fan',
        description: 'Outstanding commitment',
        icon: '⭐',
        color: '#E5E4E2',
        rarity: 'rare',
        unlockedAt: now,
      });
    } else if (score >= BADGE_THRESHOLDS.GOLD_FAN) {
      badges.push({
        id: `gold-${artistId}`,
        name: 'Gold Fan',
        description: 'Strong dedication',
        icon: '🥇',
        color: '#FFD700',
        rarity: 'rare',
        unlockedAt: now,
      });
    } else if (score >= BADGE_THRESHOLDS.SILVER_FAN) {
      badges.push({
        id: `silver-${artistId}`,
        name: 'Silver Fan',
        description: 'Regular supporter',
        icon: '🥈',
        color: '#C0C0C0',
        rarity: 'common',
        unlockedAt: now,
      });
    } else if (score >= BADGE_THRESHOLDS.BRONZE_FAN) {
      badges.push({
        id: `bronze-${artistId}`,
        name: 'Bronze Fan',
        description: 'Getting started',
        icon: '🥉',
        color: '#CD7F32',
        rarity: 'common',
        unlockedAt: now,
      });
    }

    // Special badges based on engagement patterns
    const consecutiveDays = this.getConsecutiveDays(userId, artistId);
    if (consecutiveDays >= 30) {
      badges.push({
        id: `consistent-${artistId}`,
        name: 'Consistent Fan',
        description: '30+ days of continuous engagement',
        icon: '🔥',
        color: '#FF6B35',
        rarity: 'rare',
        unlockedAt: now,
      });
    }

    return badges;
  }

  /**
   * Anti-gaming validation
   */
  private isValidEngagement(userId: string, engagementType: EngagementType, metadata?: any): boolean {
    // Check minimum duration for plays
    if (engagementType === EngagementType.SONG_PLAY) {
      if (!metadata?.duration || metadata.duration < ANTI_GAMING.MIN_PLAY_DURATION) {
        return false;
      }
    }

    // Check for rapid actions
    const recentActions = this.recentActions.get(`${userId}-${engagementType}`) || [];
    const now = new Date();
    const recentCount = recentActions.filter(
      timestamp => now.getTime() - timestamp.getTime() < ANTI_GAMING.COOLDOWN_PERIOD
    ).length;

    if (recentCount >= ANTI_GAMING.MAX_RAPID_ACTIONS) {
      return false;
    }

    return true;
  }

  /**
   * Check if daily cap is reached
   */
  private async isDailyCap(userId: string, artistId: string, engagementType: EngagementType): Promise<boolean> {
    const cap = DAILY_CAPS[engagementType];
    if (!cap) return false;

    // Get today's engagement count from database
    const count = await databaseService.getDailyEngagementCount(userId, artistId, engagementType);
    return count >= cap;
  }

  /**
   * Track recent actions for anti-gaming
   */
  private trackRecentAction(userId: string, engagementType: EngagementType): void {
    const key = `${userId}-${engagementType}`;
    const actions = this.recentActions.get(key) || [];
    actions.push(new Date());
    
    // Keep only actions from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentActions = actions.filter(timestamp => timestamp > oneHourAgo);
    
    this.recentActions.set(key, recentActions);
  }

  /**
   * Get consecutive engagement days
   */
  private async getConsecutiveDays(userId: string, artistId: string): Promise<number> {
    try {
      const recentEngagements = await databaseService.getRecentEngagements(userId, artistId, 100);
      
      if (recentEngagements.length === 0) return 0;
      
      let consecutiveDays = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Group engagements by date
      const engagementDates = new Set(
        recentEngagements.map(e => {
          const date = new Date(e.timestamp);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      );
      
      // Check consecutive days backwards from today
      let currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday
      
      while (engagementDates.has(currentDate.getTime())) {
        consecutiveDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      return consecutiveDays;
    } catch (error) {
      console.error('Error calculating consecutive days:', error);
      return 0;
    }
  }

  /**
   * Get fan since date
   */
  private async getFanSinceDate(userId: string, artistId: string): Promise<Date> {
    try {
      const existingScore = await databaseService.getFanScore(userId, artistId);
      if (existingScore) {
        return existingScore.fanSince;
      }
      
      // If no existing score, use the date of first engagement
      const engagements = await databaseService.getEngagementsByArtist(userId, artistId);
      if (engagements.length > 0) {
        // Sort by timestamp ascending to get first engagement
        const sortedEngagements = engagements.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return sortedEngagements[0].timestamp;
      }
      
      return new Date();
    } catch (error) {
      console.error('Error getting fan since date:', error);
      return new Date();
    }
  }

  /**
   * Get engagement consistency pattern
   */
  private async getEngagementConsistency(userId: string, artistId: string): Promise<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPORADIC'> {
    try {
      const recentEngagements = await databaseService.getRecentEngagements(userId, artistId, 30);
      
      if (recentEngagements.length === 0) return 'SPORADIC';
      
      // Group engagements by date
      const engagementsByDate = new Map();
      recentEngagements.forEach(engagement => {
        const dateKey = engagement.timestamp.toDateString();
        if (!engagementsByDate.has(dateKey)) {
          engagementsByDate.set(dateKey, 0);
        }
        engagementsByDate.set(dateKey, engagementsByDate.get(dateKey) + 1);
      });
      
      const uniqueDays = engagementsByDate.size;
      const daysSinceFirst = Math.max(1, Math.floor(
        (new Date().getTime() - recentEngagements[recentEngagements.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24)
      ));
      
      const engagementFrequency = uniqueDays / daysSinceFirst;
      
      if (engagementFrequency > 0.8) return 'DAILY';
      if (engagementFrequency > 0.3) return 'WEEKLY';
      if (engagementFrequency > 0.1) return 'MONTHLY';
      return 'SPORADIC';
    } catch (error) {
      console.error('Error calculating engagement consistency:', error);
      return 'SPORADIC';
    }
  }

  /**
   * Update artist fan score (triggers recalculation)
   */
  private async updateArtistFanScore(userId: string, artistId: string): Promise<void> {
    await this.calculateArtistFanScore(userId, artistId);
  }

  /**
   * Get fan score for specific artist
   */
  async getFanScore(userId: string, artistId: string): Promise<ArtistFanScore | null> {
    return await databaseService.getFanScore(userId, artistId);
  }

  /**
   * Get all fan scores for a user across all artists
   */
  async getUserFanScores(userId: string): Promise<ArtistFanScore[]> {
    return await databaseService.getUserFanScores(userId);
  }
}

export const fanScoringService = new FanScoringService();
