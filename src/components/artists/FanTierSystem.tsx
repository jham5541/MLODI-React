import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export type FanTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';

interface FanTierData {
  tier: FanTier;
  name: string;
  color: string;
  gradientColors: string[];
  icon: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  exclusiveContent: string[];
  badgeDescription: string;
  rarityPercentage: number;
}

interface FanProgress {
  currentTier: FanTier;
  points: number;
  nextTierPoints: number;
  totalListeningTime: number;
  songsLiked: number;
  playlistsCreated: number;
  concertsAttended: number;
  merchandisePurchased: number;
  friendsReferred: number;
  communityInteractions: number;
  streakDays: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsAwarded: number;
  unlockedAt: string;
  category: 'listening' | 'social' | 'engagement' | 'loyalty';
}

interface FanTierSystemProps {
  artistId: string;
  artistName: string;
  artistAvatar: string;
  userProgress: FanProgress;
  onTierUpgrade?: (newTier: FanTier) => void;
  onRedeemReward?: (rewardId: string) => void;
}

export default function FanTierSystem({
  artistId,
  artistName,
  artistAvatar,
  userProgress,
  onTierUpgrade,
  onRedeemReward,
}: FanTierSystemProps) {
  const { colors } = useTheme();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FanTierData | null>(null);
  const [progressAnimation] = useState(new Animated.Value(0));
  
  const screenWidth = Dimensions.get('window').width;

  const fanTiers: FanTierData[] = [
    {
      tier: 'Bronze',
      name: 'Bronze Fan',
      color: '#CD7F32',
      gradientColors: ['#CD7F32', '#A0522D'],
      icon: 'trophy',
      minPoints: 0,
      maxPoints: 999,
      benefits: [
        'Access to basic fan content',
        'Monthly newsletter',
        'Standard profile badge',
      ],
      exclusiveContent: [
        'Behind-the-scenes photos',
        'Basic fan community access',
      ],
      badgeDescription: 'Welcome to the fan community!',
      rarityPercentage: 45,
    },
    {
      tier: 'Silver',
      name: 'Silver Supporter',
      color: '#C0C0C0',
      gradientColors: ['#C0C0C0', '#A8A8A8'],
      icon: 'medal',
      minPoints: 1000,
      maxPoints: 4999,
      benefits: [
        'Early access to new releases',
        'Exclusive fan content',
        'Priority customer support',
        'Silver profile badge',
      ],
      exclusiveContent: [
        'Acoustic versions',
        'Studio session videos',
        'Fan-only livestreams',
      ],
      badgeDescription: 'A dedicated supporter of great music!',
      rarityPercentage: 30,
    },
    {
      tier: 'Gold',
      name: 'Gold Member',
      color: '#FFD700',
      gradientColors: ['#FFD700', '#FFA500'],
      icon: 'star',
      minPoints: 5000,
      maxPoints: 14999,
      benefits: [
        'VIP access to concerts',
        'Meet & greet opportunities',
        'Exclusive merchandise discounts',
        'Gold profile badge',
        'Direct artist interactions',
      ],
      exclusiveContent: [
        'Unreleased tracks preview',
        'Personal voice messages',
        'Virtual backstage access',
        'Gold-only community forum',
      ],
      badgeDescription: 'A true music enthusiast and loyal fan!',
      rarityPercentage: 18,
    },
    {
      tier: 'Diamond',
      name: 'Diamond Elite',
      color: '#B9F2FF',
      gradientColors: ['#B9F2FF', '#87CEEB'],
      icon: 'diamond',
      minPoints: 15000,
      maxPoints: 39999,
      benefits: [
        'Lifetime concert access',
        'Exclusive album pre-orders',
        'Personal artist communications',
        'Diamond profile badge',
        'Merchandise collaboration input',
        'Fan advisory board participation',
      ],
      exclusiveContent: [
        'Private concerts access',
        'Studio recording sessions',
        'Creative process insights',
        'Diamond exclusive releases',
        'Personal video calls',
      ],
      badgeDescription: 'An elite fan with exceptional dedication!',
      rarityPercentage: 6,
    },
    {
      tier: 'Platinum',
      name: 'Platinum Legend',
      color: '#E5E4E2',
      gradientColors: ['#E5E4E2', '#D3D3D3'],
      icon: 'flame',
      minPoints: 40000,
      benefits: [
        'Lifetime VIP status',
        'Co-creation opportunities',
        'Personal artist mentorship',
        'Platinum legendary badge',
        'Revenue sharing participation',
        'Fan hall of fame inclusion',
        'Personal song dedications',
      ],
      exclusiveContent: [
        'Collaborate on new music',
        'Private album listening parties',
        'Platinum-only exclusive releases',
        'Personal artist studio visits',
        'Fan documentary features',
        'Legacy collection access',
      ],
      badgeDescription: 'A legendary super-fan and music partner!',
      rarityPercentage: 1,
    },
  ];

  useEffect(() => {
    // Animate progress bar on load
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  const getCurrentTierData = (): FanTierData => {
    return fanTiers.find(tier => tier.tier === userProgress.currentTier) || fanTiers[0];
  };

  const getNextTierData = (): FanTierData | null => {
    const currentIndex = fanTiers.findIndex(tier => tier.tier === userProgress.currentTier);
    return currentIndex < fanTiers.length - 1 ? fanTiers[currentIndex + 1] : null;
  };

  const getProgressPercentage = (): number => {
    const currentTier = getCurrentTierData();
    const nextTier = getNextTierData();
    
    if (!nextTier) return 100;
    
    const progressInCurrentTier = userProgress.points - currentTier.minPoints;
    const tierRange = nextTier.minPoints - currentTier.minPoints;
    
    return (progressInCurrentTier / tierRange) * 100;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return '#94A3B8';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  const currentTier = getCurrentTierData();
  const nextTier = getNextTierData();
  const progressPercentage = getProgressPercentage();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    artistAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    currentTierSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    tierBadge: {
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      minWidth: 120,
    },
    tierIcon: {
      marginBottom: 8,
    },
    tierName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.background,
      textAlign: 'center',
    },
    tierPoints: {
      fontSize: 12,
      color: colors.background,
      opacity: 0.9,
      textAlign: 'center',
      marginTop: 2,
    },
    progressSection: {
      marginBottom: 20,
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
      color: colors.text,
    },
    pointsText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      flex: 1,
      minWidth: '30%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    achievementsSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    achievementsList: {
      gap: 8,
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    achievementDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    achievementPoints: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    tiersGrid: {
      gap: 12,
    },
    tierCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    currentTierCard: {
      borderColor: colors.primary,
    },
    tierCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    tierCardIcon: {
      marginRight: 12,
    },
    tierCardInfo: {
      flex: 1,
    },
    tierCardName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    tierCardRange: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tierCardRarity: {
      fontSize: 10,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    benefitsList: {
      gap: 6,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    benefitText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      gap: 6,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.background,
    },
    secondaryButtonText: {
      color: colors.text,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
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
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
  });

  const renderTierDetails = () => (
    <Modal
      visible={showDetailModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Fan Tier System</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.tiersGrid}>
              {fanTiers.map((tier) => (
                <View
                  key={tier.tier}
                  style={[
                    styles.tierCard,
                    tier.tier === userProgress.currentTier && styles.currentTierCard,
                  ]}
                >
                  <View style={styles.tierCardHeader}>
                    <View style={[styles.tierCardIcon, { backgroundColor: tier.color + '20' }]}>
                      <Ionicons
                        name={tier.icon as any}
                        size={24}
                        color={tier.color}
                      />
                    </View>
                    <View style={styles.tierCardInfo}>
                      <Text style={styles.tierCardName}>{tier.name}</Text>
                      <Text style={styles.tierCardRange}>
                        {formatNumber(tier.minPoints)}
                        {tier.maxPoints ? ` - ${formatNumber(tier.maxPoints)}` : '+'} points
                      </Text>
                      <Text style={styles.tierCardRarity}>
                        {tier.rarityPercentage}% of fans reach this tier
                      </Text>
                    </View>
                  </View>

                  <View style={styles.benefitsList}>
                    {tier.benefits.slice(0, 3).map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={12} color={tier.color} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: artistAvatar }} style={styles.artistAvatar} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Fan Status</Text>
          <Text style={styles.subtitle}>Your connection with {artistName}</Text>
        </View>
      </View>

      <View style={styles.currentTierSection}>
        <View
          style={[
            styles.tierBadge,
            {
              backgroundColor: currentTier.color,
              shadowColor: currentTier.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
        >
          <View style={styles.tierIcon}>
            <Ionicons
              name={currentTier.icon as any}
              size={32}
              color={colors.background}
            />
          </View>
          <Text style={styles.tierName}>{currentTier.name}</Text>
          <Text style={styles.tierPoints}>
            {formatNumber(userProgress.points)} points
          </Text>
        </View>
      </View>

      {nextTier && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Progress to {nextTier.name}
            </Text>
            <Text style={styles.pointsText}>
              {formatNumber(userProgress.nextTierPoints - userProgress.points)} points needed
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${progressPercentage}%`],
                  }),
                  backgroundColor: nextTier.color,
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatNumber(userProgress.totalListeningTime)}</Text>
          <Text style={styles.statLabel}>Minutes Listened</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userProgress.songsLiked}</Text>
          <Text style={styles.statLabel}>Songs Liked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userProgress.streakDays}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <View style={styles.achievementsList}>
          {userProgress.achievements.slice(0, 3).map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View
                style={[
                  styles.achievementIcon,
                  { backgroundColor: getRarityColor(achievement.rarity) + '20' },
                ]}
              >
                <Ionicons
                  name={achievement.icon as any}
                  size={16}
                  color={getRarityColor(achievement.rarity)}
                />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </View>
              <Text style={styles.achievementPoints}>
                +{achievement.pointsAwarded}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setShowDetailModal(true)}
        >
          <Ionicons name="information-circle-outline" size={16} color={colors.text} />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            View All Tiers
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="gift-outline" size={16} color={colors.background} />
          <Text style={styles.actionButtonText}>Redeem Rewards</Text>
        </TouchableOpacity>
      </View>

      {renderTierDetails()}
    </View>
  );
}