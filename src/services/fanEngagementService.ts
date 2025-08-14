import { supabase } from '../lib/supabase/client';

export type FanTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';

export interface FanTierData {
  id: string;
  user_id: string;
  artist_id: string;
  tier: FanTier;
  points: number;
  total_listening_time_ms: number;
  songs_liked: number;
  playlists_created: number;
  concerts_attended: number;
  merchandise_purchased: number;
  friends_referred: number;
  community_interactions: number;
  streak_days: number;
  tier_upgraded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'listening' | 'social' | 'engagement' | 'loyalty' | 'creative';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points_awarded: number;
  unlock_criteria: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  artist_id: string;
  achievement?: Achievement;
  progress_data: Record<string, any>;
  unlocked_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'listening' | 'social' | 'engagement' | 'creative';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  challenge_type: 'daily' | 'weekly' | 'special' | 'seasonal';
  target_value: number;
  points_reward: number;
  badge_reward?: string;
  unlock_level: number;
  requirements: string[];
  tips: string[];
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  artist_id: string;
  challenge?: Challenge;
  progress: number;
  is_completed: boolean;
  completed_at?: string;
  started_at: string;
  progress_data: Record<string, any>;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'listening' | 'social' | 'engagement' | 'loyalty';
  required_points: number;
  reward: string;
  points_awarded: number;
  unlock_level: number;
  is_active: boolean;
  created_at: string;
}

export interface UserMilestoneProgress {
  id: string;
  user_id: string;
  milestone_id: string;
  artist_id: string;
  milestone?: Milestone;
  is_completed: boolean;
  completed_at?: string;
  reward_claimed: boolean;
  reward_claimed_at?: string;
  created_at: string;
}

class FanEngagementService {
  // Fan Tiers
  async getFanTier(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('fan_tiers')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .maybeSingle();

    if (error) throw error;

    // If no fan tier exists, create Bronze tier
    if (!data) {
      return this.createFanTier(artistId);
    }

    return data as FanTierData;
  }

  async createFanTier(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('fan_tiers')
      .insert({
        user_id: user.id,
        artist_id: artistId,
        tier: 'Bronze',
        points: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FanTierData;
  }

  async updateFanPoints(artistId: string, pointsToAdd: number, activity: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current fan tier
    const currentTier = await this.getFanTier(artistId);
    const newPoints = currentTier.points + pointsToAdd;

    // Determine new tier based on points
    const newTier = this.calculateTierFromPoints(newPoints);
    const tierUpgraded = newTier !== currentTier.tier;

    const updateData: Partial<FanTierData> = {
      points: newPoints,
      tier: newTier,
    };

    if (tierUpgraded) {
      updateData.tier_upgraded_at = new Date().toISOString();
    }

    // Update specific activity counters
    switch (activity) {
      case 'song_liked':
        updateData.songs_liked = (currentTier.songs_liked || 0) + 1;
        break;
      case 'playlist_created':
        updateData.playlists_created = (currentTier.playlists_created || 0) + 1;
        break;
      case 'friend_referred':
        updateData.friends_referred = (currentTier.friends_referred || 0) + 1;
        break;
      case 'community_interaction':
        updateData.community_interactions = (currentTier.community_interactions || 0) + 1;
        break;
    }

    const { data, error } = await supabase
      .from('fan_tiers')
      .update(updateData)
      .eq('id', currentTier.id)
      .select()
      .single();

    if (error) throw error;

    // Check for tier upgrade achievements
    if (tierUpgraded) {
      await this.checkTierAchievements(artistId, newTier);
    }

    return data as FanTierData;
  }

  async updateListeningTime(artistId: string, listeningTimeMs: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const currentTier = await this.getFanTier(artistId);
    const newListeningTime = (currentTier.total_listening_time_ms || 0) + listeningTimeMs;

    // Award points based on listening time (1 point per minute)
    const pointsToAward = Math.floor(listeningTimeMs / 60000);

    const { data, error } = await supabase
      .from('fan_tiers')
      .update({
        total_listening_time_ms: newListeningTime,
        points: currentTier.points + pointsToAward,
      })
      .eq('id', currentTier.id)
      .select()
      .single();

    if (error) throw error;
    return data as FanTierData;
  }

  private calculateTierFromPoints(points: number): FanTier {
    if (points >= 40000) return 'Platinum';
    if (points >= 15000) return 'Diamond';
    if (points >= 5000) return 'Gold';
    if (points >= 1000) return 'Silver';
    return 'Bronze';
  }

  // Achievements
  async getAchievements(category?: Achievement['category']) {
    let query = supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('rarity', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data as Achievement[];
  }

  async getUserAchievements(artistId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', user.id);

    if (artistId) {
      query = query.eq('artist_id', artistId);
    }

    query = query.order('unlocked_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data as UserAchievement[];
  }

  async checkAndUnlockAchievements(artistId: string, activity: string, value: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all active achievements for the activity category
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (!achievements) return [];

    const unlockedAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      // Check if already unlocked
      const { data: existingAchievement } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_id', achievement.id)
        .eq('artist_id', artistId)
        .maybeSingle();

      if (existingAchievement) continue;

      // Check unlock criteria
      if (this.checkAchievementCriteria(achievement, activity, value)) {
        // Unlock achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            artist_id: artistId,
            progress_data: { [activity]: value },
          });

        // Award points
        await this.updateFanPoints(artistId, achievement.points_awarded, 'achievement_unlocked');

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  private checkAchievementCriteria(achievement: Achievement, activity: string, value: number): boolean {
    const criteria = achievement.unlock_criteria;
    
    // Simple criteria checking - can be expanded for complex logic
    for (const [key, requiredValue] of Object.entries(criteria)) {
      if (key === activity && value >= requiredValue) {
        return true;
      }
    }

    return false;
  }

  private async checkTierAchievements(artistId: string, tier: FanTier) {
    await this.checkAndUnlockAchievements(artistId, 'fan_tier', tier === 'Bronze' ? 1 : tier === 'Silver' ? 2 : tier === 'Gold' ? 3 : tier === 'Diamond' ? 4 : 5);
  }

  // Challenges
  async getChallenges(challengeType?: Challenge['challenge_type']) {
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true);

    if (challengeType) {
      query = query.eq('challenge_type', challengeType);
    }

    // Filter active challenges (within date range)
    const now = new Date().toISOString();
    query = query
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`);

    query = query.order('difficulty', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data as Challenge[];
  }

  async getUserChallengeProgress(artistId: string, challengeType?: Challenge['challenge_type']) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('user_challenge_progress')
      .select('*, challenges(*)')
      .eq('user_id', user.id)
      .eq('artist_id', artistId);

    if (challengeType) {
      query = query.eq('challenges.challenge_type', challengeType);
    }

    query = query.order('started_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data as UserChallengeProgress[];
  }

  async startChallenge(challengeId: string, artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if challenge is already started
    const { data: existing } = await supabase
      .from('user_challenge_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .eq('artist_id', artistId)
      .maybeSingle();

    if (existing) {
      throw new Error('Challenge already started');
    }

    const { data, error } = await supabase
      .from('user_challenge_progress')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        artist_id: artistId,
        progress: 0,
      })
      .select('*, challenges(*)')
      .single();

    if (error) throw error;
    return data as UserChallengeProgress;
  }

  async updateChallengeProgress(challengeId: string, artistId: string, progressIncrement: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current progress
    const { data: current } = await supabase
      .from('user_challenge_progress')
      .select('*, challenges(*)')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .eq('artist_id', artistId)
      .single();

    if (!current) {
      throw new Error('Challenge not started');
    }

    const newProgress = current.progress + progressIncrement;
    const isCompleted = newProgress >= current.challenges.target_value;

    const updateData: Partial<UserChallengeProgress> = {
      progress: newProgress,
      is_completed: isCompleted,
    };

    if (isCompleted && !current.is_completed) {
      updateData.completed_at = new Date().toISOString();
      // Award points
      await this.updateFanPoints(artistId, current.challenges.points_reward, 'challenge_completed');
    }

    const { data, error } = await supabase
      .from('user_challenge_progress')
      .update(updateData)
      .eq('id', current.id)
      .select('*, challenges(*)')
      .single();

    if (error) throw error;
    return data as UserChallengeProgress;
  }

  // Milestones
  async getMilestones() {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('is_active', true)
      .order('required_points', { ascending: true });

    if (error) throw error;
    return data as Milestone[];
  }

  async getUserMilestoneProgress(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_milestone_progress')
      .select('*, milestones(*)')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserMilestoneProgress[];
  }

  async checkMilestones(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fanTier = await this.getFanTier(artistId);
    const milestones = await this.getMilestones();

    const newMilestones: Milestone[] = [];

    for (const milestone of milestones) {
      if (fanTier.points >= milestone.required_points) {
        // Check if milestone already exists
        const { data: existing } = await supabase
          .from('user_milestone_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('milestone_id', milestone.id)
          .eq('artist_id', artistId)
          .maybeSingle();

        if (!existing) {
          // Create milestone progress
          await supabase
            .from('user_milestone_progress')
            .insert({
              user_id: user.id,
              milestone_id: milestone.id,
              artist_id: artistId,
              is_completed: true,
              completed_at: new Date().toISOString(),
            });

          newMilestones.push(milestone);
        }
      }
    }

    return newMilestones;
  }

  async claimMilestoneReward(milestoneId: string, artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: progress } = await supabase
      .from('user_milestone_progress')
      .select('*, milestones(*)')
      .eq('user_id', user.id)
      .eq('milestone_id', milestoneId)
      .eq('artist_id', artistId)
      .single();

    if (!progress || !progress.is_completed || progress.reward_claimed) {
      throw new Error('Milestone not available for claiming');
    }

    // Mark as claimed
    await supabase
      .from('user_milestone_progress')
      .update({
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString(),
      })
      .eq('id', progress.id);

    // Award points
    await this.updateFanPoints(artistId, progress.milestones.points_awarded, 'milestone_claimed');

    return progress.milestones;
  }

  // Analytics
  async getFanEngagementStats(artistId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fanTier = await this.getFanTier(artistId);
    const achievements = await this.getUserAchievements(artistId);
    const challengeProgress = await this.getUserChallengeProgress(artistId);
    const milestoneProgress = await this.getUserMilestoneProgress(artistId);

    return {
      fanTier,
      totalAchievements: achievements.length,
      activeChallenges: challengeProgress.filter(c => !c.is_completed).length,
      completedChallenges: challengeProgress.filter(c => c.is_completed).length,
      availableMilestones: milestoneProgress.filter(m => m.is_completed && !m.reward_claimed).length,
      completedMilestones: milestoneProgress.filter(m => m.reward_claimed).length,
    };
  }

  // Get total points across all artists for user-wide level calculation
  async getTotalUserPoints(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    try {
      // Get sum of points from all fan tiers
      const { data, error } = await supabase
        .from('fan_tiers')
        .select('points')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching total user points:', error);
        return 0;
      }

      const totalPoints = data?.reduce((sum, tier) => sum + (tier.points || 0), 0) || 0;
      return totalPoints;
    } catch (error) {
      console.error('Error calculating total user points:', error);
      return 0;
    }
  }

  // Helper method to get user points for a specific artist
  async getArtistPoints(artistId: string): Promise<number> {
    try {
      const fanTier = await this.getFanTier(artistId);
      return fanTier?.points || 0;
    } catch (error) {
      console.error('Error fetching artist points:', error);
      return 0;
    }
  }
}

export const fanEngagementService = new FanEngagementService();
