import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { FanTier } from './FanTierSystem';

interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  requiredPoints: number;
  reward: string;
  icon: string;
  category: 'listening' | 'social' | 'engagement' | 'loyalty';
  isCompleted: boolean;
  completedAt?: string;
  pointsAwarded: number;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  pointsReward: number;
  expiresAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'listening' | 'social' | 'engagement';
}

interface FanProgressProps {
  artistId: string;
  artistName: string;
  currentTier: FanTier;
  currentPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  allTimePoints: number;
  milestones: ProgressMilestone[];
  weeklyChallenges: WeeklyChallenge[];
  onClaimReward?: (milestoneId: string) => void;
  onStartChallenge?: (challengeId: string) => void;
}

export default function FanProgress({
  artistId,
  artistName,
  currentTier,
  currentPoints,
  weeklyPoints,
  monthlyPoints,
  allTimePoints,
  milestones,
  weeklyChallenges,
  onClaimReward,
  onStartChallenge,
}: FanProgressProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [activeTab, setActiveTab] = useState<'milestones' | 'challenges'>('milestones');
  const [progressAnimations, setProgressAnimations] = useState<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    // Initialize progress animations
    const animations: { [key: string]: Animated.Value } = {};
    
    milestones.forEach((milestone) => {
      animations[milestone.id] = new Animated.Value(0);
    });
    
    weeklyChallenges.forEach((challenge) => {
      animations[challenge.id] = new Animated.Value(0);
    });
    
    setProgressAnimations(animations);

    // Start animations
    setTimeout(() => {
      Object.keys(animations).forEach((key, index) => {
        setTimeout(() => {
          Animated.timing(animations[key], {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }).start();
        }, index * 100);
      });
    }, 300);
  }, [milestones, weeklyChallenges]);

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'listening': return '#3B82F6';
      case 'social': return '#10B981';
      case 'engagement': return '#F59E0B';
      case 'loyalty': return '#8B5CF6';
      default: return themeColors.primary;
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'listening': return 'headset';
      case 'social': return 'people';
      case 'engagement': return 'heart';
      case 'loyalty': return 'star';
      default: return 'trophy';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return themeColors.textSecondary;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const completedMilestones = milestones.filter(m => m.isCompleted);
  const availableMilestones = milestones.filter(m => !m.isCompleted && currentPoints >= m.requiredPoints);
  const upcomingMilestones = milestones.filter(m => !m.isCompleted && currentPoints < m.requiredPoints);

  const activeChallenges = weeklyChallenges.filter(c => c.progress < c.target);
  const completedChallenges = weeklyChallenges.filter(c => c.progress >= c.target);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.primary,
    },
    statLabel: {
      fontSize: 10,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: themeColors.background,
      borderRadius: 8,
      padding: 2,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    activeTab: {
      backgroundColor: themeColors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    activeTabText: {
      color: themeColors.background,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionCount: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.background,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    milestoneItem: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    completedMilestone: {
      borderColor: themeColors.success,
      backgroundColor: themeColors.success + '10',
    },
    availableMilestone: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary + '10',
    },
    milestoneIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    milestoneContent: {
      flex: 1,
    },
    milestoneTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    milestoneDescription: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    milestoneReward: {
      fontSize: 11,
      fontWeight: '500',
      color: themeColors.primary,
    },
    milestoneAction: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: themeColors.primary,
    },
    completedAction: {
      backgroundColor: themeColors.success,
    },
    unavailableAction: {
      backgroundColor: themeColors.textSecondary,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.background,
    },
    challengeItem: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    challengeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    challengeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    challengeInfo: {
      flex: 1,
    },
    challengeTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    challengeDescription: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    challengeStatus: {
      alignItems: 'flex-end',
    },
    challengeDifficulty: {
      fontSize: 10,
      fontWeight: '600',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      textTransform: 'uppercase',
    },
    timeRemaining: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    progressSection: {
      marginBottom: 8,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.text,
    },
    progressValue: {
      fontSize: 12,
      color: themeColors.primary,
      fontWeight: '600',
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: themeColors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 3,
    },
    challengeReward: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    rewardText: {
      fontSize: 11,
      fontWeight: '500',
      color: themeColors.primary,
    },
    claimButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: themeColors.success,
    },
    claimButtonText: {
      fontSize: 10,
      fontWeight: '600',
      color: themeColors.background,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyIcon: {
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  const renderMilestones = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {availableMilestones.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitle}>Ready to Claim</Text>
            <Text style={styles.sectionCount}>{availableMilestones.length}</Text>
          </View>
          {availableMilestones.map((milestone) => (
            <View key={milestone.id} style={[styles.milestoneItem, styles.availableMilestone]}>
              <View
                style={[
                  styles.milestoneIcon,
                  { backgroundColor: getCategoryColor(milestone.category) + '20' },
                ]}
              >
                <Ionicons
                  name={milestone.icon as any}
                  size={24}
                  color={getCategoryColor(milestone.category)}
                />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                <Text style={styles.milestoneReward}>Reward: {milestone.reward}</Text>
              </View>
              <TouchableOpacity
                style={styles.milestoneAction}
                onPress={() => onClaimReward?.(milestone.id)}
              >
                <Text style={styles.actionText}>Claim +{milestone.pointsAwarded}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {upcomingMilestones.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitle}>Upcoming Milestones</Text>
          </View>
          {upcomingMilestones.slice(0, 5).map((milestone) => (
            <View key={milestone.id} style={styles.milestoneItem}>
              <View
                style={[
                  styles.milestoneIcon,
                  { backgroundColor: themeColors.textSecondary + '20' },
                ]}
              >
                <Ionicons
                  name={milestone.icon as any}
                  size={24}
                  color={themeColors.textSecondary}
                />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                <Text style={styles.milestoneReward}>Reward: {milestone.reward}</Text>
              </View>
              <View style={[styles.milestoneAction, styles.unavailableAction]}>
                <Text style={styles.actionText}>
                  {formatNumber(milestone.requiredPoints - currentPoints)} more
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {completedMilestones.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitle}>Completed</Text>
            <Text style={styles.sectionCount}>{completedMilestones.length}</Text>
          </View>
          {completedMilestones.slice(0, 3).map((milestone) => (
            <View key={milestone.id} style={[styles.milestoneItem, styles.completedMilestone]}>
              <View
                style={[
                  styles.milestoneIcon,
                  { backgroundColor: themeColors.success + '20' },
                ]}
              >
                <Ionicons name="checkmark-circle" size={24} color={themeColors.success} />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                <Text style={styles.milestoneReward}>
                  Completed {milestone.completedAt}
                </Text>
              </View>
              <View style={[styles.milestoneAction, styles.completedAction]}>
                <Text style={styles.actionText}>✓ Done</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderChallenges = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {activeChallenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <Text style={styles.sectionCount}>{activeChallenges.length}</Text>
          </View>
          {activeChallenges.map((challenge) => {
            const progressPercentage = getProgressPercentage(challenge.progress, challenge.target);
            const animation = progressAnimations[challenge.id];
            
            return (
              <View key={challenge.id} style={styles.challengeItem}>
                <View style={styles.challengeHeader}>
                  <View
                    style={[
                      styles.challengeIcon,
                      { backgroundColor: getCategoryColor(challenge.category) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={challenge.icon as any}
                      size={20}
                      color={getCategoryColor(challenge.category)}
                    />
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  </View>
                  <View style={styles.challengeStatus}>
                    <Text
                      style={[
                        styles.challengeDifficulty,
                        { 
                          backgroundColor: getDifficultyColor(challenge.difficulty) + '20',
                          color: getDifficultyColor(challenge.difficulty),
                        },
                      ]}
                    >
                      {challenge.difficulty}
                    </Text>
                    <Text style={styles.timeRemaining}>
                      {formatTimeRemaining(challenge.expiresAt)} left
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>Progress</Text>
                    <Text style={styles.progressValue}>
                      {challenge.progress} / {challenge.target}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    {animation && (
                      <Animated.View
                        style={[
                          styles.progressBar,
                          {
                            width: animation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', `${progressPercentage}%`],
                            }),
                            backgroundColor: getCategoryColor(challenge.category),
                          },
                        ]}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.challengeReward}>
                  <Text style={styles.rewardText}>
                    Reward: +{challenge.pointsReward} points
                  </Text>
                  {progressPercentage >= 100 && (
                    <TouchableOpacity style={styles.claimButton}>
                      <Text style={styles.claimButtonText}>Claim Reward</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {completedChallenges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitle}>Completed This Week</Text>
            <Text style={styles.sectionCount}>{completedChallenges.length}</Text>
          </View>
          {completedChallenges.map((challenge) => (
            <View key={challenge.id} style={[styles.challengeItem, { opacity: 0.7 }]}>
              <View style={styles.challengeHeader}>
                <View
                  style={[
                    styles.challengeIcon,
                    { backgroundColor: themeColors.success + '20' },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.success} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>Completed!</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeChallenges.length === 0 && completedChallenges.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="trophy-outline"
            size={48}
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>
            No challenges available right now.{'\n'}Check back next week for new challenges!
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fan Progress</Text>
        <Text style={styles.subtitle}>Track your journey with {artistName}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatNumber(weeklyPoints)}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatNumber(monthlyPoints)}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatNumber(allTimePoints)}</Text>
          <Text style={styles.statLabel}>All Time</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'milestones' && styles.activeTab]}
          onPress={() => setActiveTab('milestones')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'milestones' && styles.activeTabText,
          ]}>
            Milestones
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'challenges' && styles.activeTabText,
          ]}>
            Challenges
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'milestones' ? renderMilestones() : renderChallenges()}
    </View>
  );
}