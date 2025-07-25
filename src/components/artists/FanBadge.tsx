import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FanTier } from './FanTierSystem';

interface FanBadgeProps {
  tier: FanTier;
  isCompact?: boolean;
  showLabel?: boolean;
  onPress?: () => void;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface BadgeTooltipInfo {
  title: string;
  description: string;
  requirements: string;
  nextTierHint?: string;
}

export default function FanBadge({
  tier,
  isCompact = false,
  showLabel = true,
  onPress,
  animated = false,
  size = 'medium',
}: FanBadgeProps) {
  const { colors } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const scaleAnim = new Animated.Value(1);
  const glowAnim = new Animated.Value(0);

  useEffect(() => {
    if (animated) {
      // Pulsing glow effect for higher tiers
      if (tier === 'Diamond' || tier === 'Platinum') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    }
  }, [animated, tier]);

  const getTierConfig = () => {
    switch (tier) {
      case 'Bronze':
        return {
          color: '#CD7F32',
          gradientColors: ['#CD7F32', '#A0522D'],
          icon: 'trophy',
          displayName: 'Bronze Fan',
          emoji: '🥉',
        };
      case 'Silver':
        return {
          color: '#C0C0C0',
          gradientColors: ['#C0C0C0', '#A8A8A8'],
          icon: 'medal',
          displayName: 'Silver Supporter',
          emoji: '🥈',
        };
      case 'Gold':
        return {
          color: '#FFD700',
          gradientColors: ['#FFD700', '#FFA500'],
          icon: 'star',
          displayName: 'Gold Member',
          emoji: '🥇',
        };
      case 'Diamond':
        return {
          color: '#B9F2FF',
          gradientColors: ['#B9F2FF', '#87CEEB'],
          icon: 'diamond',
          displayName: 'Diamond Elite',
          emoji: '💎',
        };
      case 'Platinum':
        return {
          color: '#E5E4E2',
          gradientColors: ['#E5E4E2', '#D3D3D3'],
          icon: 'flame',
          displayName: 'Platinum Legend',
          emoji: '🔥',
        };
    }
  };

  const getTooltipInfo = (): BadgeTooltipInfo => {
    switch (tier) {
      case 'Bronze':
        return {
          title: 'Bronze Fan Badge',
          description: 'Welcome to the fan community! You\'ve taken your first steps into the world of dedicated music fandom.',
          requirements: 'Earned by: Listening to music, basic engagement',
          nextTierHint: 'Keep listening and engaging to reach Silver!',
        };
      case 'Silver':
        return {
          title: 'Silver Supporter Badge',
          description: 'A true supporter who consistently engages with their favorite artists and shows genuine appreciation for great music.',
          requirements: 'Earned by: 1,000+ fan points, regular engagement',
          nextTierHint: 'Continue your journey to unlock Gold benefits!',
        };
      case 'Gold':
        return {
          title: 'Gold Member Badge',
          description: 'An enthusiastic fan who goes above and beyond, actively participating in the community and supporting artists.',
          requirements: 'Earned by: 5,000+ fan points, community participation',
          nextTierHint: 'Strive for Diamond to unlock exclusive experiences!',
        };
      case 'Diamond':
        return {
          title: 'Diamond Elite Badge',
          description: 'An elite fan with exceptional dedication, earning access to the most exclusive content and experiences.',
          requirements: 'Earned by: 15,000+ fan points, exceptional engagement',
          nextTierHint: 'The legendary Platinum tier awaits the most dedicated fans!',
        };
      case 'Platinum':
        return {
          title: 'Platinum Legend Badge',
          description: 'The ultimate fan achievement - a legendary super-fan who has reached the pinnacle of music fandom and community contribution.',
          requirements: 'Earned by: 40,000+ fan points, legendary dedication',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          badgeSize: 32,
          iconSize: 16,
          fontSize: 10,
          borderWidth: 2,
        };
      case 'medium':
        return {
          badgeSize: 48,
          iconSize: 24,
          fontSize: 12,
          borderWidth: 3,
        };
      case 'large':
        return {
          badgeSize: 64,
          iconSize: 32,
          fontSize: 14,
          borderWidth: 4,
        };
    }
  };

  const handlePress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    } else {
      setShowTooltip(true);
    }
  };

  const tierConfig = getTierConfig();
  const sizeConfig = getSizeConfig();
  const tooltipInfo = getTooltipInfo();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    badgeContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      width: sizeConfig.badgeSize,
      height: sizeConfig.badgeSize,
      borderRadius: sizeConfig.badgeSize / 2,
      backgroundColor: tierConfig.color,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: sizeConfig.borderWidth,
      borderColor: colors.background,
      shadowColor: tierConfig.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    premiumBadge: {
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 12,
    },
    glowEffect: {
      position: 'absolute',
      width: sizeConfig.badgeSize + 16,
      height: sizeConfig.badgeSize + 16,
      borderRadius: (sizeConfig.badgeSize + 16) / 2,
      backgroundColor: tierConfig.color,
      opacity: 0.3,
    },
    label: {
      marginTop: 6,
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    compactLabel: {
      fontSize: sizeConfig.fontSize - 1,
      marginTop: 4,
    },
    // Tooltip Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tooltipContainer: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      margin: 20,
      width: '85%',
      maxWidth: 320,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    tooltipHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    tooltipBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: tierConfig.color,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 4,
      borderColor: colors.background,
      shadowColor: tierConfig.color,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 12,
    },
    tooltipTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    tooltipDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    requirementsSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    requirementsText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    nextTierHint: {
      backgroundColor: tierConfig.color + '15',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    nextTierText: {
      fontSize: 12,
      color: tierConfig.color,
      textAlign: 'center',
      fontWeight: '600',
    },
    closeButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  const isPremiumTier = tier === 'Diamond' || tier === 'Platinum';

  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View 
          style={[
            styles.badgeContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Glow effect for premium tiers */}
          {animated && isPremiumTier && (
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  opacity: glowAnim,
                }
              ]}
            />
          )}
          
          <View style={[
            styles.badge,
            isPremiumTier && styles.premiumBadge,
          ]}>
            <Ionicons
              name={tierConfig.icon as any}
              size={sizeConfig.iconSize}
              color={colors.background}
            />
          </View>
        </Animated.View>

        {showLabel && (
          <Text style={[
            styles.label,
            isCompact && styles.compactLabel,
          ]}>
            {isCompact ? tierConfig.emoji : tierConfig.displayName}
          </Text>
        )}
      </TouchableOpacity>

      {/* Tooltip Modal */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <View style={styles.tooltipBadge}>
                <Ionicons
                  name={tierConfig.icon as any}
                  size={40}
                  color={colors.background}
                />
              </View>
              <Text style={styles.tooltipTitle}>{tooltipInfo.title}</Text>
            </View>

            <Text style={styles.tooltipDescription}>
              {tooltipInfo.description}
            </Text>

            <View style={styles.requirementsSection}>
              <Text style={styles.requirementsTitle}>How to Earn</Text>
              <Text style={styles.requirementsText}>
                {tooltipInfo.requirements}
              </Text>
            </View>

            {tooltipInfo.nextTierHint && (
              <View style={styles.nextTierHint}>
                <Text style={styles.nextTierText}>
                  💡 {tooltipInfo.nextTierHint}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTooltip(false)}
            >
              <Text style={styles.closeButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}