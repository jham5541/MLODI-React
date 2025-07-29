import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'listening' | 'social' | 'engagement' | 'creative';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  progress: number;
  target: number;
  pointsReward: number;
  badgeReward?: string;
  expiresAt: string;
  isCompleted: boolean;
  completedAt?: string;
  requirements: string[];
  tips: string[];
  unlockLevel: number;
  isLocked: boolean;
}

interface ChallengeSet {
  id: string;
  title: string;
  description: string;
  theme: string;
  challenges: Challenge[];
  totalReward: number;
  completionBonus: number;
  expiresAt: string;
  isActive: boolean;
  progress: number; // 0-100
}

interface EngagementChallengesProps {
  artistId: string;
  artistName: string;
  userLevel: number;
  onChallengeComplete?: (challengeId: string, reward: number) => void;
  onStartChallenge?: (challengeId: string) => void;
}

export default function EngagementChallenges({
  artistId,
  artistName,
  userLevel,
  onChallengeComplete,
  onStartChallenge,
}: EngagementChallengesProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeSets, setChallengeSets] = useState<ChallengeSet[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  const [progressAnimations, setProgressAnimations] = useState<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    loadChallenges();
    loadChallengeSets();
  }, [artistId, userLevel]);

  useEffect(() => {
    // Initialize animations for challenges
    const animations: { [key: string]: Animated.Value } = {};
    challenges.forEach((challenge) => {
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
  }, [challenges]);

  const loadChallenges = () => {
    // Mock daily challenges
    const mockChallenges: Challenge[] = [
      {
        id: 'daily_1',
        title: 'Daily Listener',
        description: 'Listen to 5 songs today',
        icon: 'headset',
        category: 'listening',
        difficulty: 'easy',
        progress: 3,
        target: 5,
        pointsReward: 50,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        requirements: ['Listen to any 5 complete songs', 'Must be completed within 24 hours'],
        tips: ['Try exploring new genres!', 'Skip counts against progress'],
        unlockLevel: 1,
        isLocked: false,
      },
      {
        id: 'weekly_1',
        title: 'Social Butterfly',
        description: 'Share 3 songs on social media',
        icon: 'share-social',
        category: 'social',
        difficulty: 'medium',
        progress: 1,
        target: 3,
        pointsReward: 150,
        badgeReward: 'Social Influencer',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        requirements: ['Share songs to Twitter, Instagram, or TikTok', 'Must include artist tag'],
        tips: ['Use hashtags for better reach', 'Tag the artist for bonus points'],
        unlockLevel: 5,
        isLocked: userLevel < 5,
      },
      {
        id: 'special_1',
        title: 'Concert Prep Master',
        description: 'Create a concert setlist playlist',
        icon: 'musical-notes',
        category: 'creative',
        difficulty: 'hard',
        progress: 0,
        target: 1,
        pointsReward: 500,
        badgeReward: 'Setlist Curator',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        requirements: [
          'Create playlist with 15-20 songs',
          'Include artist\'s most popular tracks',
          'Add at least 3 deep cuts',
          'Share with community'
        ],
        tips: [
          'Research past concert setlists',
          'Balance energy levels throughout',
          'Consider audience favorites'
        ],
        unlockLevel: 10,
        isLocked: userLevel < 10,
      },
      {
        id: 'legendary_1',
        title: 'Ultimate Fan Quest',
        description: 'Complete all fan tier requirements in one week',
        icon: 'trophy',
        category: 'engagement',
        difficulty: 'legendary',
        progress: 2,
        target: 10,
        pointsReward: 2000,
        badgeReward: 'Legendary Fan',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        requirements: [
          'Listen to 50+ songs',
          'Like 20+ tracks',
          'Share 5+ songs',
          'Create 2+ playlists',
          'Comment on 10+ tracks',
          'Attend virtual event',
          'Purchase merchandise',
          'Refer 3+ friends',
          'Complete daily challenges',
          'Engage with community'
        ],
        tips: [
          'Plan your week strategically',
          'Focus on one requirement per day',
          'Use social features for multipliers'
        ],
        unlockLevel: 25,
        isLocked: userLevel < 25,
      },
    ];

    setChallenges(mockChallenges);
  };

  const loadChallengeSets = () => {
    // Mock challenge sets
    const mockSets: ChallengeSet[] = [
      {
        id: 'winter_fest',
        title: 'Winter Music Festival',
        description: 'Celebrate the season with special challenges',
        theme: 'winter',
        challenges: challenges.slice(0, 3),
        totalReward: 1000,
        completionBonus: 500,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        progress: 33,
      },
    ];

    setChallengeSets(mockSets);
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'listening': return '#3B82F6';
      case 'social': return '#10B981';
      case 'engagement': return '#F59E0B';
      case 'creative': return '#8B5CF6';
      default: return themeColors.primary;
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      case 'legendary': return '#8B5CF6';
      default: return themeColors.textSecondary;
    }
  };

  const getDifficultyIcon = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'leaf';
      case 'medium': return 'flame';
      case 'hard': return 'thunderstorm';
      case 'legendary': return 'diamond';
      default: return 'help';
    }
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

  const handleChallengePress = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowDetailModal(true);
  };

  const handleStartChallenge = (challengeId: string) => {
    if (onStartChallenge) {
      onStartChallenge(challengeId);
    }
    
    Alert.alert(
      'Challenge Started!',
      'Your progress will be tracked automatically. Good luck!',
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  const handleClaimReward = (challenge: Challenge) => {
    if (onChallengeComplete) {
      onChallengeComplete(challenge.id, challenge.pointsReward);
    }

    Alert.alert(
      'Reward Claimed!',
      `You earned ${challenge.pointsReward} points${challenge.badgeReward ? ` and the "${challenge.badgeReward}" badge` : ''}!`,
      [{ text: 'Awesome!', style: 'default' }]
    );

    // Update challenge state
    setChallenges(prev => prev.map(c => 
      c.id === challenge.id 
        ? { ...c, isCompleted: true, completedAt: new Date().toISOString() }
        : c
    ));
    setShowDetailModal(false);
  };

  const getDailyChallenges = () => challenges.filter(c => c.id.startsWith('daily_'));
  const getWeeklyChallenges = () => challenges.filter(c => c.id.startsWith('weekly_'));
  const getSpecialChallenges = () => challenges.filter(c => c.id.startsWith('special_') || c.id.startsWith('legendary_'));

  const getCurrentChallenges = () => {
    switch (activeTab) {
      case 'daily': return getDailyChallenges();
      case 'weekly': return getWeeklyChallenges();
      case 'special': return getSpecialChallenges();
      default: return [];
    }
  };

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
    challengesList: {
      gap: 12,
    },
    challengeCard: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    lockedChallenge: {
      opacity: 0.6,
    },
    completedChallenge: {
      borderColor: themeColors.success,
      backgroundColor: themeColors.success + '10',
    },
    legendaryChallenge: {
      borderColor: '#8B5CF6',
      backgroundColor: '#8B5CF6' + '10',
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
      fontSize: 16,
      fontWeight: '700',
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
    difficultyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    difficultyText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    timeRemaining: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    progressSection: {
      marginVertical: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    progressValue: {
      fontSize: 12,
      color: themeColors.primary,
      fontWeight: '600',
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: themeColors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
    },
    rewardSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    rewardInfo: {
      flex: 1,
    },
    rewardText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.primary,
    },
    badgeReward: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: themeColors.primary,
    },
    lockedButton: {
      backgroundColor: themeColors.textSecondary,
    },
    completedButton: {
      backgroundColor: themeColors.success,
    },
    claimButton: {
      backgroundColor: themeColors.warning,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.background,
    },
    lockIcon: {
      marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#000000',
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#F5F5F5',
    },
    requirementsList: {
      marginBottom: 16,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    requirementText: {
      fontSize: 14,
      color: '#000000',
      flex: 1,
    },
    tipsList: {
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#000000',
      marginBottom: 8,
    },
    tipItem: {
      fontSize: 12,
      color: '#666666',
      marginBottom: 4,
      paddingLeft: 8,
    },
  });

  const renderChallenge = (challenge: Challenge) => {
    const progressPercentage = getProgressPercentage(challenge.progress, challenge.target);
    const animation = progressAnimations[challenge.id];
    const isReadyToClaim = progressPercentage >= 100 && !challenge.isCompleted;
    
    return (
      <TouchableOpacity
        key={challenge.id}
        style={[
          styles.challengeCard,
          challenge.isLocked && styles.lockedChallenge,
          challenge.isCompleted && styles.completedChallenge,
          challenge.difficulty === 'legendary' && styles.legendaryChallenge,
        ]}
        onPress={() => handleChallengePress(challenge)}
        disabled={challenge.isLocked}
      >
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
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(challenge.difficulty) + '20' },
              ]}
            >
              <Ionicons
                name={getDifficultyIcon(challenge.difficulty) as any}
                size={12}
                color={getDifficultyColor(challenge.difficulty)}
              />
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(challenge.difficulty) },
                ]}
              >
                {challenge.difficulty}
              </Text>
            </View>
            <Text style={styles.timeRemaining}>
              {formatTimeRemaining(challenge.expiresAt)} left
            </Text>
          </View>
        </View>

        {!challenge.isLocked && (
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
        )}

        <View style={styles.rewardSection}>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardText}>
              Reward: +{challenge.pointsReward} points
            </Text>
            {challenge.badgeReward && (
              <Text style={styles.badgeReward}>
                Badge: {challenge.badgeReward}
              </Text>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {challenge.isLocked ? (
              <>
                <TouchableOpacity style={[styles.actionButton, styles.lockedButton]}>
                  <Text style={styles.actionButtonText}>Level {challenge.unlockLevel}</Text>
                </TouchableOpacity>
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.lockIcon}
                />
              </>
            ) : challenge.isCompleted ? (
              <TouchableOpacity style={[styles.actionButton, styles.completedButton]}>
                <Text style={styles.actionButtonText}>✓ Completed</Text>
              </TouchableOpacity>
            ) : isReadyToClaim ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.claimButton]}
                onPress={() => handleClaimReward(challenge)}
              >
                <Text style={styles.actionButtonText}>Claim Reward</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleStartChallenge(challenge.id)}
              >
                <Text style={styles.actionButtonText}>Start</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChallengeDetail = () => {
    if (!selectedChallenge) return null;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, color: '#666666', marginBottom: 16 }}>
                {selectedChallenge.description}
              </Text>

              <Text style={{ fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 12 }}>
                Requirements
              </Text>
              <View style={styles.requirementsList}>
                {selectedChallenge.requirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={themeColors.primary} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.tipsList}>
                <Text style={styles.tipsTitle}>💡 Tips for Success</Text>
                {selectedChallenge.tips.map((tip, index) => (
                  <Text key={index} style={styles.tipItem}>
                    • {tip}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Engagement Challenges</Text>
        <Text style={styles.subtitle}>
          Complete challenges to earn points and exclusive badges
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'daily' && styles.activeTabText,
          ]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'weekly' && styles.activeTabText,
          ]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'special' && styles.activeTab]}
          onPress={() => setActiveTab('special')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'special' && styles.activeTabText,
          ]}>
            Special
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.challengesList}>
        {getCurrentChallenges().map(renderChallenge)}
      </ScrollView>

      {renderChallengeDetail()}
    </View>
  );
}