import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  fanEngagementService, 
  FanTierData, 
  Achievement, 
  UserAchievement, 
  Challenge, 
  UserChallengeProgress, 
  Milestone, 
  UserMilestoneProgress,
  FanTier 
} from '../services/fanEngagementService';
import { realtimeService } from '../services/realtimeService';

interface FanEngagementState {
  // Fan tiers by artist
  fanTiers: Record<string, FanTierData>; // artistId -> FanTierData
  
  // Achievements system
  availableAchievements: Achievement[];
  userAchievements: Record<string, UserAchievement[]>; // artistId -> UserAchievement[]
  recentlyUnlocked: Achievement[];
  
  // Challenges system
  dailyChallenges: Challenge[];
  weeklyChallenges: Challenge[];
  specialChallenges: Challenge[];
  userChallengeProgress: Record<string, UserChallengeProgress[]>; // artistId -> UserChallengeProgress[]
  
  // Milestones system
  availableMilestones: Milestone[];
  userMilestoneProgress: Record<string, UserMilestoneProgress[]>; // artistId -> UserMilestoneProgress[]
  
  // Analytics
  engagementStats: Record<string, any>; // artistId -> stats
  
  // Loading states
  isLoadingFanTier: boolean;
  isLoadingAchievements: boolean;
  isLoadingChallenges: boolean;
  isLoadingMilestones: boolean;
  isUpdatingPoints: boolean;
  
  // Real-time features
  liveEngagementUpdates: any[];
  realtimeSubscriptions: Record<string, any>; // artistId -> subscription
  
  // Actions
  // Fan tier management
  getFanTier: (artistId: string) => Promise<FanTierData>;
  updateFanPoints: (artistId: string, points: number, activity: string) => Promise<void>;
  updateListeningTime: (artistId: string, timeMs: number) => Promise<void>;
  
  // Achievement system
  loadAchievements: (category?: Achievement['category']) => Promise<void>;
  loadUserAchievements: (artistId?: string) => Promise<void>;
  checkAndUnlockAchievements: (artistId: string, activity: string, value: number) => Promise<Achievement[]>;
  clearRecentlyUnlocked: () => void;
  
  // Challenge system
  loadChallenges: () => Promise<void>;
  loadUserChallengeProgress: (artistId: string) => Promise<void>;
  startChallenge: (challengeId: string, artistId: string) => Promise<void>;
  updateChallengeProgress: (challengeId: string, artistId: string, progressIncrement: number) => Promise<void>;
  
  // Milestone system
  loadMilestones: () => Promise<void>;
  loadUserMilestoneProgress: (artistId: string) => Promise<void>;
  checkMilestones: (artistId: string) => Promise<Milestone[]>;
  claimMilestoneReward: (milestoneId: string, artistId: string) => Promise<void>;
  
  // Analytics
  loadEngagementStats: (artistId: string) => Promise<void>;
  
  // Utility
  getTierProgress: (artistId: string) => { current: FanTier; next?: FanTier; progress: number; pointsNeeded: number } | null;
  getAvailableChallenges: (artistId: string, type?: Challenge['challenge_type']) => Challenge[];
  getCompletedChallenges: (artistId: string, type?: Challenge['challenge_type']) => Challenge[];
  
  // Real-time subscriptions
  subscribeToFanEngagement: (artistId: string) => void;
  unsubscribeFromFanEngagement: (artistId: string) => void;
  unsubscribeAll: () => void;
}

const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 999 },
  Silver: { min: 1000, max: 4999 },
  Gold: { min: 5000, max: 14999 },
  Diamond: { min: 15000, max: 39999 },
  Platinum: { min: 40000, max: Infinity },
};

export const useFanEngagementStore = create<FanEngagementState>()(
  persist(
    (set, get) => ({
      // Initial state
      fanTiers: {},
      availableAchievements: [],
      userAchievements: {},
      recentlyUnlocked: [],
      dailyChallenges: [],
      weeklyChallenges: [],
      specialChallenges: [],
      userChallengeProgress: {},
      availableMilestones: [],
      userMilestoneProgress: {},
      engagementStats: {},
      
      isLoadingFanTier: false,
      isLoadingAchievements: false,
      isLoadingChallenges: false,
      isLoadingMilestones: false,
      isUpdatingPoints: false,
      
      // Real-time state
      liveEngagementUpdates: [],
      realtimeSubscriptions: {},
      
      // Fan tier actions
      getFanTier: async (artistId: string) => {
        const existingTier = get().fanTiers[artistId];
        if (existingTier) return existingTier;
        
        set({ isLoadingFanTier: true });
        try {
          const fanTier = await fanEngagementService.getFanTier(artistId);
          set(state => ({
            fanTiers: {
              ...state.fanTiers,
              [artistId]: fanTier,
            },
          }));
          return fanTier;
        } catch (error) {
          console.error('Failed to get fan tier:', error);
          throw error;
        } finally {
          set({ isLoadingFanTier: false });
        }
      },
      
      updateFanPoints: async (artistId: string, points: number, activity: string) => {
        set({ isUpdatingPoints: true });
        try {
          const updatedTier = await fanEngagementService.updateFanPoints(artistId, points, activity);
          
          set(state => ({
            fanTiers: {
              ...state.fanTiers,
              [artistId]: updatedTier,
            },
          }));
          
          // Check for new achievements and milestones
          const newAchievements = await get().checkAndUnlockAchievements(artistId, activity, points);
          const newMilestones = await get().checkMilestones(artistId);
          
          if (newAchievements.length > 0) {
            set(state => ({
              recentlyUnlocked: [...state.recentlyUnlocked, ...newAchievements],
            }));
          }
        } catch (error) {
          console.error('Failed to update fan points:', error);
          throw error;
        } finally {
          set({ isUpdatingPoints: false });
        }
      },
      
      updateListeningTime: async (artistId: string, timeMs: number) => {
        try {
          const updatedTier = await fanEngagementService.updateListeningTime(artistId, timeMs);
          
          set(state => ({
            fanTiers: {
              ...state.fanTiers,
              [artistId]: updatedTier,
            },
          }));
        } catch (error) {
          console.error('Failed to update listening time:', error);
        }
      },
      
      // Achievement actions
      loadAchievements: async (category?: Achievement['category']) => {
        set({ isLoadingAchievements: true });
        try {
          const achievements = await fanEngagementService.getAchievements(category);
          set({ availableAchievements: achievements });
        } catch (error) {
          console.error('Failed to load achievements:', error);
        } finally {
          set({ isLoadingAchievements: false });
        }
      },
      
      loadUserAchievements: async (artistId?: string) => {
        try {
          const userAchievements = await fanEngagementService.getUserAchievements(artistId);
          
          if (artistId) {
            set(state => ({
              userAchievements: {
                ...state.userAchievements,
                [artistId]: userAchievements,
              },
            }));
          } else {
            // Group by artist
            const groupedAchievements: Record<string, UserAchievement[]> = {};
            userAchievements.forEach(achievement => {
              if (!groupedAchievements[achievement.artist_id]) {
                groupedAchievements[achievement.artist_id] = [];
              }
              groupedAchievements[achievement.artist_id].push(achievement);
            });
            set({ userAchievements: groupedAchievements });
          }
        } catch (error) {
          console.error('Failed to load user achievements:', error);
        }
      },
      
      checkAndUnlockAchievements: async (artistId: string, activity: string, value: number) => {
        try {
          const newAchievements = await fanEngagementService.checkAndUnlockAchievements(artistId, activity, value);
          
          if (newAchievements.length > 0) {
            // Reload user achievements for this artist
            await get().loadUserAchievements(artistId);
          }
          
          return newAchievements;
        } catch (error) {
          console.error('Failed to check achievements:', error);
          return [];
        }
      },
      
      clearRecentlyUnlocked: () => {
        set({ recentlyUnlocked: [] });
      },
      
      // Challenge actions
      loadChallenges: async () => {
        set({ isLoadingChallenges: true });
        try {
          const [daily, weekly, special] = await Promise.all([
            fanEngagementService.getChallenges('daily'),
            fanEngagementService.getChallenges('weekly'),
            fanEngagementService.getChallenges('special'),
          ]);
          
          set({
            dailyChallenges: daily,
            weeklyChallenges: weekly,
            specialChallenges: [...special, ...(await fanEngagementService.getChallenges('seasonal'))],
          });
        } catch (error) {
          console.error('Failed to load challenges:', error);
        } finally {
          set({ isLoadingChallenges: false });
        }
      },
      
      loadUserChallengeProgress: async (artistId: string) => {
        try {
          const progress = await fanEngagementService.getUserChallengeProgress(artistId);
          
          set(state => ({
            userChallengeProgress: {
              ...state.userChallengeProgress,
              [artistId]: progress,
            },
          }));
        } catch (error) {
          console.error('Failed to load user challenge progress:', error);
        }
      },
      
      startChallenge: async (challengeId: string, artistId: string) => {
        try {
          const progress = await fanEngagementService.startChallenge(challengeId, artistId);
          
          set(state => ({
            userChallengeProgress: {
              ...state.userChallengeProgress,
              [artistId]: [
                ...(state.userChallengeProgress[artistId] || []),
                progress,
              ],
            },
          }));
        } catch (error) {
          console.error('Failed to start challenge:', error);
          throw error;
        }
      },
      
      updateChallengeProgress: async (challengeId: string, artistId: string, progressIncrement: number) => {
        try {
          const updatedProgress = await fanEngagementService.updateChallengeProgress(
            challengeId,
            artistId,
            progressIncrement
          );
          
          set(state => ({
            userChallengeProgress: {
              ...state.userChallengeProgress,
              [artistId]: (state.userChallengeProgress[artistId] || []).map(p =>
                p.challenge_id === challengeId ? updatedProgress : p
              ),
            },
          }));
          
          // If challenge completed, update fan points will be handled by the service
          if (updatedProgress.is_completed) {
            await get().getFanTier(artistId); // Refresh fan tier
          }
        } catch (error) {
          console.error('Failed to update challenge progress:', error);
          throw error;
        }
      },
      
      // Milestone actions
      loadMilestones: async () => {
        set({ isLoadingMilestones: true });
        try {
          const milestones = await fanEngagementService.getMilestones();
          set({ availableMilestones: milestones });
        } catch (error) {
          console.error('Failed to load milestones:', error);
        } finally {
          set({ isLoadingMilestones: false });
        }
      },
      
      loadUserMilestoneProgress: async (artistId: string) => {
        try {
          const progress = await fanEngagementService.getUserMilestoneProgress(artistId);
          
          set(state => ({
            userMilestoneProgress: {
              ...state.userMilestoneProgress,
              [artistId]: progress,
            },
          }));
        } catch (error) {
          console.error('Failed to load user milestone progress:', error);
        }
      },
      
      checkMilestones: async (artistId: string) => {
        try {
          const newMilestones = await fanEngagementService.checkMilestones(artistId);
          
          if (newMilestones.length > 0) {
            // Reload milestone progress
            await get().loadUserMilestoneProgress(artistId);
          }
          
          return newMilestones;
        } catch (error) {
          console.error('Failed to check milestones:', error);
          return [];
        }
      },
      
      claimMilestoneReward: async (milestoneId: string, artistId: string) => {
        try {
          await fanEngagementService.claimMilestoneReward(milestoneId, artistId);
          
          // Update milestone progress
          set(state => ({
            userMilestoneProgress: {
              ...state.userMilestoneProgress,
              [artistId]: (state.userMilestoneProgress[artistId] || []).map(p =>
                p.milestone_id === milestoneId 
                  ? { ...p, reward_claimed: true, reward_claimed_at: new Date().toISOString() }
                  : p
              ),
            },
          }));
          
          // Refresh fan tier (points were awarded)
          await get().getFanTier(artistId);
        } catch (error) {
          console.error('Failed to claim milestone reward:', error);
          throw error;
        }
      },
      
      // Analytics actions
      loadEngagementStats: async (artistId: string) => {
        try {
          const stats = await fanEngagementService.getFanEngagementStats(artistId);
          
          set(state => ({
            engagementStats: {
              ...state.engagementStats,
              [artistId]: stats,
            },
          }));
        } catch (error) {
          console.error('Failed to load engagement stats:', error);
        }
      },
      
      // Utility actions
      getTierProgress: (artistId: string) => {
        const fanTier = get().fanTiers[artistId];
        if (!fanTier) return null;
        
        const currentTier = fanTier.tier;
        const currentPoints = fanTier.points;
        
        // Find next tier
        const tierNames = Object.keys(TIER_THRESHOLDS) as FanTier[];
        const currentTierIndex = tierNames.indexOf(currentTier);
        const nextTier = currentTierIndex < tierNames.length - 1 ? tierNames[currentTierIndex + 1] : undefined;
        
        if (!nextTier) {
          return {
            current: currentTier,
            progress: 100,
            pointsNeeded: 0,
          };
        }
        
        const currentTierMin = TIER_THRESHOLDS[currentTier].min;
        const nextTierMin = TIER_THRESHOLDS[nextTier].min;
        const progress = ((currentPoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
        const pointsNeeded = nextTierMin - currentPoints;
        
        return {
          current: currentTier,
          next: nextTier,
          progress: Math.min(progress, 100),
          pointsNeeded: Math.max(pointsNeeded, 0),
        };
      },
      
      getAvailableChallenges: (artistId: string, type?: Challenge['challenge_type']) => {
        const { dailyChallenges, weeklyChallenges, specialChallenges, userChallengeProgress } = get();
        const userProgress = userChallengeProgress[artistId] || [];
        const completedChallengeIds = new Set(userProgress.filter(p => p.is_completed).map(p => p.challenge_id));
        
        let challenges = [...dailyChallenges, ...weeklyChallenges, ...specialChallenges];
        
        if (type) {
          challenges = challenges.filter(c => c.challenge_type === type);
        }
        
        return challenges.filter(c => !completedChallengeIds.has(c.id));
      },
      
      getCompletedChallenges: (artistId: string, type?: Challenge['challenge_type']) => {
        const { dailyChallenges, weeklyChallenges, specialChallenges, userChallengeProgress } = get();
        const userProgress = userChallengeProgress[artistId] || [];
        const completedProgress = userProgress.filter(p => p.is_completed);
        
        let challenges = [...dailyChallenges, ...weeklyChallenges, ...specialChallenges];
        
        if (type) {
          challenges = challenges.filter(c => c.challenge_type === type);
        }
        
        return challenges.filter(c => 
          completedProgress.some(p => p.challenge_id === c.id)
        );
      },
      
      // Real-time subscription methods
      subscribeToFanEngagement: (artistId: string) => {
        // Unsubscribe existing subscription for this artist
        const existingSubscription = get().realtimeSubscriptions[artistId];
        if (existingSubscription) {
          existingSubscription.unsubscribe();
        }
        
        const subscription = realtimeService.subscribeToFanEngagement(artistId, (update) => {
          set(state => ({
            liveEngagementUpdates: [update, ...state.liveEngagementUpdates.slice(0, 49)],
          }));
          
          // Handle specific engagement updates
          if (update.tier_updated) {
            // Refresh fan tier data
            get().getFanTier(artistId);
          }
          
          if (update.achievement_unlocked) {
            // Add to recently unlocked achievements
            set(state => ({
              recentlyUnlocked: [...state.recentlyUnlocked, update.achievement_unlocked],
            }));
          }
        });
        
        set(state => ({
          realtimeSubscriptions: {
            ...state.realtimeSubscriptions,
            [artistId]: subscription,
          },
        }));
      },
      
      unsubscribeFromFanEngagement: (artistId: string) => {
        const subscription = get().realtimeSubscriptions[artistId];
        if (subscription) {
          subscription.unsubscribe();
          
          set(state => {
            const newSubscriptions = { ...state.realtimeSubscriptions };
            delete newSubscriptions[artistId];
            return { realtimeSubscriptions: newSubscriptions };
          });
        }
      },
      
      unsubscribeAll: () => {
        const { realtimeSubscriptions } = get();
        Object.values(realtimeSubscriptions).forEach(subscription => {
          if (subscription && subscription.unsubscribe) {
            subscription.unsubscribe();
          }
        });
        
        set({
          realtimeSubscriptions: {},
          liveEngagementUpdates: [],
        });
      },
    }),
    {
      name: 'fan-engagement-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist certain data
      partialize: (state) => ({
        fanTiers: state.fanTiers,
        userAchievements: state.userAchievements,
        userChallengeProgress: state.userChallengeProgress,
        userMilestoneProgress: state.userMilestoneProgress,
      }),
    }
  )
);