import { challengeProgressService } from './challengeProgressService';
import { supabase } from '../lib/supabase/client';

export interface EngagementAction {
  type: 'song_play' | 'video_play' | 'like' | 'share' | 'comment' | 'playlist_add';
  entityId: string;
  entityType: 'song' | 'video' | 'artist' | 'playlist';
  artistId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class EngagementTrackingService {
  private activeChallengeMappings: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeChallengeMappings();
  }

  private async initializeChallengeMappings() {
    // Load active challenges and create mappings
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, category, challenge_type')
        .eq('is_active', true);

      if (challenges) {
        // Map action types to challenge IDs
        challenges.forEach(challenge => {
          const actionTypes = this.getActionTypesForCategory(challenge.category);
          actionTypes.forEach(actionType => {
            const existing = this.activeChallengeMappings.get(actionType) || [];
            existing.push(challenge.id);
            this.activeChallengeMappings.set(actionType, existing);
          });
        });
      }
    } catch (error) {
      console.error('Error initializing challenge mappings:', error);
    }
  }

  private getActionTypesForCategory(category: string): string[] {
    switch (category) {
      case 'listening':
        return ['song_play', 'video_play'];
      case 'social':
        return ['share', 'comment'];
      case 'engagement':
        return ['like', 'playlist_add'];
      case 'creative':
        return ['playlist_add'];
      default:
        return [];
    }
  }

  /**
   * Track a song play and update relevant challenges
   */
  async trackSongPlay(songId: string, artistId: string, duration: number, completionPercentage: number) {
    console.log(`🎵 Tracking song play: ${songId} by artist ${artistId} (${completionPercentage}% complete)`);
    
    // Only count if played at least 50% of the song
    if (completionPercentage < 50) {
      console.log('Song not played enough to count for challenges');
      return;
    }

    const action: EngagementAction = {
      type: 'song_play',
      entityId: songId,
      entityType: 'song',
      artistId,
      timestamp: new Date().toISOString(),
      metadata: {
        duration,
        completionPercentage
      }
    };

    // Update all relevant challenges
    await this.updateChallenges(action);
    
    // Store in database for analytics
    await this.storeEngagementAction(action);
  }

  /**
   * Track a video play and update relevant challenges
   */
  async trackVideoPlay(videoId: string, artistId: string, duration: number, completionPercentage: number) {
    console.log(`📹 Tracking video play: ${videoId} by artist ${artistId} (${completionPercentage}% complete)`);
    
    if (completionPercentage < 50) {
      console.log('Video not played enough to count for challenges');
      return;
    }

    const action: EngagementAction = {
      type: 'video_play',
      entityId: videoId,
      entityType: 'video',
      artistId,
      timestamp: new Date().toISOString(),
      metadata: {
        duration,
        completionPercentage
      }
    };

    await this.updateChallenges(action);
    await this.storeEngagementAction(action);
  }

  /**
   * Track likes and update challenges
   */
  async trackLike(entityId: string, entityType: 'song' | 'video', artistId?: string) {
    console.log(`❤️ Tracking like: ${entityType} ${entityId}`);
    
    const action: EngagementAction = {
      type: 'like',
      entityId,
      entityType,
      artistId,
      timestamp: new Date().toISOString()
    };

    await this.updateChallenges(action);
    await this.storeEngagementAction(action);
  }

  /**
   * Track shares and update challenges
   */
  async trackShare(entityId: string, entityType: 'song' | 'video', platform: string, artistId?: string) {
    console.log(`🔗 Tracking share: ${entityType} ${entityId} on ${platform}`);
    
    const action: EngagementAction = {
      type: 'share',
      entityId,
      entityType,
      artistId,
      timestamp: new Date().toISOString(),
      metadata: {
        platform
      }
    };

    await this.updateChallenges(action);
    await this.storeEngagementAction(action);
  }

  /**
   * Update all relevant challenges based on the action
   */
  private async updateChallenges(action: EngagementAction) {
    try {
      // Get all active challenges from the service
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activeProgress } = await supabase
        .from('challenge_progress')
        .select('challenge_id, current_value, target_value')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!activeProgress) return;

      for (const progress of activeProgress) {
        const challengeId = progress.challenge_id;
        
        // Check if this challenge should be updated based on the action
        if (await this.shouldUpdateChallenge(challengeId, action)) {
          console.log(`📊 Updating challenge ${challengeId} for action ${action.type}`);
          
          // Determine the value to add based on the action type
          const value = this.getActionValue(action);
          
          // Update the challenge progress
          await challengeProgressService.recordAction(
            challengeId,
            action.type.toUpperCase(),
            value
          );
        }
      }
    } catch (error) {
      console.error('Error updating challenges:', error);
    }
  }

  /**
   * Determine if a challenge should be updated based on the action
   */
  private async shouldUpdateChallenge(challengeId: string, action: EngagementAction): Promise<boolean> {
    try {
      // Get challenge details
      const { data: challenge } = await supabase
        .from('challenges')
        .select('category, requirements, metadata')
        .eq('id', challengeId)
        .single();

      if (!challenge) return false;

      // Check category match
      const actionCategories = this.getActionCategories(action.type);
      if (!actionCategories.includes(challenge.category)) {
        return false;
      }

      // Check artist-specific challenges
      if (challenge.metadata?.artistId && challenge.metadata.artistId !== action.artistId) {
        return false;
      }

      // Check specific challenge requirements
      if (challengeId === 'daily_1' && action.type === 'song_play') {
        return true; // Daily listener challenge
      }

      if (challengeId.includes('artist_') && challengeId.includes('_listen')) {
        // Artist-specific listening challenge
        return action.artistId === challengeId.split('_')[1];
      }

      if (challengeId === 'weekly_listen' && (action.type === 'song_play' || action.type === 'video_play')) {
        return true; // Weekly listening challenge
      }

      if (challengeId === 'social_share' && action.type === 'share') {
        return true; // Social sharing challenge
      }

      if (challengeId === 'engagement_likes' && action.type === 'like') {
        return true; // Engagement likes challenge
      }

      // Default: update if category matches
      return true;
    } catch (error) {
      console.error('Error checking challenge update eligibility:', error);
      return false;
    }
  }

  /**
   * Get categories that an action type belongs to
   */
  private getActionCategories(actionType: string): string[] {
    switch (actionType) {
      case 'song_play':
      case 'video_play':
        return ['listening'];
      case 'share':
      case 'comment':
        return ['social'];
      case 'like':
        return ['engagement', 'social'];
      case 'playlist_add':
        return ['creative', 'engagement'];
      default:
        return [];
    }
  }

  /**
   * Get the value to add to challenge progress based on action
   */
  private getActionValue(action: EngagementAction): number {
    // Most actions count as 1
    // Could be modified to give different weights
    switch (action.type) {
      case 'song_play':
      case 'video_play':
        // Could give bonus for full plays
        const completion = action.metadata?.completionPercentage || 0;
        return completion >= 80 ? 1.5 : 1;
      default:
        return 1;
    }
  }

  /**
   * Store engagement action in database for analytics
   */
  private async storeEngagementAction(action: EngagementAction) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('engagement_actions')
        .insert({
          user_id: user.id,
          action_type: action.type,
          entity_id: action.entityId,
          entity_type: action.entityType,
          artist_id: action.artistId,
          metadata: action.metadata,
          created_at: action.timestamp
        });
    } catch (error) {
      console.error('Error storing engagement action:', error);
    }
  }

  /**
   * Get engagement summary for a user
   */
  async getEngagementSummary(userId?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return null;

      const { data: actions } = await supabase
        .from('engagement_actions')
        .select('action_type, created_at')
        .eq('user_id', targetUserId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!actions) return null;

      // Aggregate by action type
      const summary = {
        totalActions: actions.length,
        songPlays: actions.filter(a => a.action_type === 'song_play').length,
        videoPlays: actions.filter(a => a.action_type === 'video_play').length,
        likes: actions.filter(a => a.action_type === 'like').length,
        shares: actions.filter(a => a.action_type === 'share').length,
        comments: actions.filter(a => a.action_type === 'comment').length,
        playlistAdds: actions.filter(a => a.action_type === 'playlist_add').length,
      };

      return summary;
    } catch (error) {
      console.error('Error getting engagement summary:', error);
      return null;
    }
  }
}

export const engagementTrackingService = new EngagementTrackingService();
export default engagementTrackingService;
