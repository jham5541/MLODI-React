import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, colors } from '../../context/ThemeContext';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface PremiumGateProps {
  feature: 'skip' | 'engagement' | 'tour' | 'comments' | 'custom';
  customTitle?: string;
  customMessage?: string;
  onClose?: () => void;
  visible: boolean;
  children?: React.ReactNode;
}

const featureMessages = {
  skip: {
    title: '🎵 Unlock Unlimited Skips',
    message: 'Experience freedom with unlimited skips. Jump to your favorite tracks instantly with our Fan or Superfan subscription.',
    icon: 'play-skip-forward',
    benefits: ['Unlimited skips', 'No ads', 'High-quality audio', 'Offline downloads'],
  },
  engagement: {
    title: '🏆 Join Engagement Challenges',
    message: 'Compete with fans worldwide, earn exclusive rewards, and climb the leaderboards. Upgrade to participate in artist challenges.',
    icon: 'trophy',
    benefits: ['Exclusive challenges', 'Earn artist rewards', 'Leaderboard rankings', 'Special badges'],
  },
  tour: {
    title: '🎫 Get Early Access to Tickets',
    message: 'Never miss your favorite artist live! Get priority access to tour tickets and exclusive presale opportunities.',
    icon: 'ticket',
    benefits: ['Presale access', 'VIP packages', 'Meet & greet chances', 'Exclusive merchandise'],
  },
  comments: {
    title: '💬 Join the Conversation',
    message: 'Connect with artists and fans. Share your thoughts, get responses from artists, and be part of the community.',
    icon: 'chatbubbles',
    benefits: ['Comment on tracks', 'Artist interactions', 'Community features', 'Exclusive discussions'],
  },
  custom: {
    title: '✨ Premium Feature',
    message: 'Unlock this premium feature and enhance your music experience.',
    icon: 'star',
    benefits: ['Premium features', 'Enhanced experience', 'Priority access', 'Exclusive content'],
  },
};

export default function PremiumGate({
  feature,
  customTitle,
  customMessage,
  onClose,
  visible,
  children,
}: PremiumGateProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProp>();
  const { subscription } = useSubscriptionStore();
  const screenHeight = Dimensions.get('window').height;

  // Check if user has premium (fan or superfan tier)
  const isPremium = subscription?.tier && subscription.tier !== 'free';

  // If user is premium, render children without gate
  if (isPremium && children) {
    return <>{children}</>;
  }

  const config = featureMessages[feature];
  const title = customTitle || config.title;
  const message = customMessage || config.message;

  const handleUpgrade = () => {
    if (onClose) onClose();
    navigation.navigate('Subscription');
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '90%',
      maxWidth: 400,
      maxHeight: screenHeight * 0.8,
      backgroundColor: themeColors.surface,
      borderRadius: 24,
      overflow: 'hidden',
    },
    gradientHeader: {
      padding: 24,
      alignItems: 'center',
      paddingTop: 32,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    content: {
      padding: 24,
    },
    message: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    benefitsContainer: {
      marginBottom: 24,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    benefitIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    benefitText: {
      fontSize: 15,
      color: themeColors.text,
      flex: 1,
      fontWeight: '500',
    },
    upgradeButton: {
      borderRadius: 16,
      paddingVertical: 18,
      marginBottom: 12,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    upgradeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      borderRadius: 16,
    },
    upgradeButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    laterButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    laterButtonText: {
      color: themeColors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
    premiumBadge: {
      position: 'absolute',
      top: 16,
      left: 16,
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    premiumBadgeText: {
      color: '#FFD700',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
      letterSpacing: 0.5,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[themeColors.primary, themeColors.primary + 'CC']}
            style={styles.gradientHeader}
          >
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            
            {onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            <View style={styles.iconContainer}>
              <Ionicons name={config.icon as any} size={40} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Upgrade to Unlock</Text>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.benefitsContainer}>
              {config.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons 
                      name="checkmark" 
                      size={16} 
                      color={themeColors.primary} 
                    />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.8}>
              <LinearGradient
                colors={[themeColors.primary, themeColors.primary + 'DD']}
                style={styles.upgradeGradient}
              >
                <Ionicons name="rocket" size={20} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            {onClose && (
              <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                <Text style={styles.laterButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Hook for checking premium status
export function usePremiumStatus() {
  const { subscription } = useSubscriptionStore();
  const isPremium = subscription?.tier && subscription.tier !== 'free';
  const tier = subscription?.tier || 'free';
  
  return {
    isPremium,
    tier,
    isFreeTier: tier === 'free',
    isFanTier: tier === 'fan',
    isSuperfanTier: tier === 'superfan',
  };
}
