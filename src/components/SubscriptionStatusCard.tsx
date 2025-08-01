import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { colors } from '../context/ThemeContext';

interface SubscriptionStatusCardProps {
  onPress?: () => void;
  showUpgradePrompt?: boolean;
  compact?: boolean;
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  onPress,
  showUpgradePrompt = true,
  compact = false,
}) => {
  const {
    subscription,
    fetchSubscription,
    hasActiveSubscription,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = () => {
    if (!subscription) return colors.textSecondary;
    const daysRemaining = getDaysRemaining();
    
    if (subscription.status !== 'active') return colors.error || '#F44336';
    if (daysRemaining <= 3) return colors.warning || '#FF9800';
    return colors.success || '#4CAF50';
  };

  const getStatusText = () => {
    if (!subscription) return 'No subscription';
    
    const daysRemaining = getDaysRemaining();
    
    if (subscription.status === 'cancelled') {
      return `Cancelled • ${daysRemaining} days left`;
    }
    if (subscription.status === 'expired') {
      return 'Expired';
    }
    if (daysRemaining <= 0) {
      return 'Expires today';
    }
    if (daysRemaining === 1) {
      return 'Expires tomorrow';
    }
    if (daysRemaining <= 7) {
      return `${daysRemaining} days remaining`;
    }
    return 'Active';
  };

  // Free tier or no subscription - show upgrade prompt
  if (!hasActiveSubscription() && showUpgradePrompt) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.compactContainer]}
        onPress={onPress}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={[styles.upgradeGradient, compact && styles.compactGradient]}
        >
          <View style={styles.upgradeContent}>
            <View style={styles.upgradeLeft}>
              <Ionicons name="diamond" size={compact ? 20 : 24} color="white" />
              <View style={styles.upgradeText}>
                <Text style={[styles.upgradeTitle, compact && styles.compactTitle]}>
                  Upgrade to Premium
                </Text>
                {!compact && (
                  <Text style={styles.upgradeSubtitle}>
                    Unlock all features and premium content
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="arrow-forward" size={compact ? 16 : 20} color="white" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Active subscription
  if (subscription) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.compactContainer]}
        onPress={onPress}
      >
        <View style={[styles.subscriptionCard, compact && styles.compactCard]}>
          <View style={styles.subscriptionContent}>
            <View style={styles.subscriptionLeft}>
              <View style={styles.tierIcon}>
                <Ionicons 
                  name={subscription.tier === 'enterprise' ? 'business' : 'diamond'} 
                  size={compact ? 18 : 22} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.subscriptionText}>
                <Text style={[styles.tierName, compact && styles.compactTierName]}>
                  {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                </Text>
                {!compact && (
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
          
          {compact && (
            <View style={[styles.statusRow, styles.compactStatusRow]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, styles.compactStatusText]}>{getStatusText()}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  compactContainer: {
    marginVertical: 4,
  },
  upgradeGradient: {
    padding: 16,
    borderRadius: 12,
  },
  compactGradient: {
    padding: 12,
    borderRadius: 8,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeText: {
    marginLeft: 12,
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  subscriptionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactCard: {
    padding: 12,
    borderRadius: 8,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionText: {
    marginLeft: 12,
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  compactTierName: {
    fontSize: 14,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatusRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  compactStatusText: {
    fontSize: 12,
  },
});
