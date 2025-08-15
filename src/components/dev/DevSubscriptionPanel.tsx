import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useMockSubscriptionStore } from '../../store/mockSubscriptionStore';

export const DevSubscriptionPanel: React.FC = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const {
    subscription,
    mockTier,
    setMockTier,
    fetchSubscription,
  } = useMockSubscriptionStore();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const tiers = [
    { id: 'free', name: 'Free', icon: 'person-outline', color: '#6B7280' },
    { id: 'fan', name: 'Fan', icon: 'heart', color: '#EC4899' },
    { id: 'superfan', name: 'Superfan', icon: 'star', color: '#F59E0B' },
  ] as const;

  const handleTierChange = (tier: 'free' | 'fan' | 'superfan') => {
    setMockTier(tier);
    Alert.alert(
      '🎭 Dev Mode',
      `Subscription tier changed to: ${tier.toUpperCase()}`,
      [{ text: 'OK' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      borderWidth: 2,
      borderColor: '#F59E0B',
      borderStyle: 'dashed',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: '#F59E0B',
      marginLeft: 8,
    },
    subtitle: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    tiersContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tierButton: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    tierButtonActive: {
      backgroundColor: themeColors.primary + '20',
      borderColor: themeColors.primary,
    },
    tierIcon: {
      marginBottom: 4,
    },
    tierName: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
    currentTier: {
      marginTop: 16,
      padding: 12,
      backgroundColor: themeColors.background,
      borderRadius: 8,
      alignItems: 'center',
    },
    currentTierText: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    currentTierValue: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.primary,
      marginTop: 4,
    },
  });

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="construct" size={20} color="#F59E0B" />
        <Text style={styles.title}>Dev Subscription Control</Text>
      </View>
      <Text style={styles.subtitle}>
        Switch between subscription tiers to test access control
      </Text>
      
      <View style={styles.tiersContainer}>
        {tiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[
              styles.tierButton,
              mockTier === tier.id && styles.tierButtonActive,
            ]}
            onPress={() => handleTierChange(tier.id)}
          >
            <Ionicons
              name={tier.icon as any}
              size={24}
              color={mockTier === tier.id ? themeColors.primary : tier.color}
              style={styles.tierIcon}
            />
            <Text style={styles.tierName}>{tier.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.currentTier}>
        <Text style={styles.currentTierText}>Current Mock Tier:</Text>
        <Text style={styles.currentTierValue}>
          {mockTier.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};
