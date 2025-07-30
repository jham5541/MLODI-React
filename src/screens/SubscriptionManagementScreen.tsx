import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useTheme, colors } from '../context/ThemeContext';
import { subscriptionService, ArtistSubscription } from '../services/subscriptionService';

const { width } = Dimensions.get('window');

interface SubscriptionManagementScreenProps {
  navigation: any;
}

export const SubscriptionManagementScreen: React.FC<SubscriptionManagementScreenProps> = ({ navigation }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const {
    subscription,
    isLoading,
    error,
    fetchSubscription,
    cancelSubscription,
    toggleAutoRenew,
    hasActiveSubscription,
  } = useSubscriptionStore();

  const [artistSubscriptions, setArtistSubscriptions] = useState<ArtistSubscription[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  useEffect(() => {
    fetchSubscription();
    loadArtistSubscriptions();
  }, []);

  const loadArtistSubscriptions = async () => {
    try {
      setLoadingArtists(true);
      const subscriptions = await subscriptionService.getActiveSubscriptions();
      setArtistSubscriptions(subscriptions);
    } catch (error) {
      console.error('Error loading artist subscriptions:', error);
    } finally {
      setLoadingArtists(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
          },
        },
      ]
    );
  };

  const handleToggleAutoRenew = () => {
    const action = subscription?.auto_renew ? 'disable' : 'enable';
    Alert.alert(
      `${action === 'enable' ? 'Enable' : 'Disable'} Auto-Renewal`,
      `Are you sure you want to ${action} auto-renewal for your subscription?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'enable' ? 'Enable' : 'Disable',
          onPress: async () => {
            await toggleAutoRenew();
            Alert.alert(
              'Success',
              `Auto-renewal has been ${action === 'enable' ? 'enabled' : 'disabled'}.`
            );
          },
        },
      ]
    );
  };

  const handleCancelArtistSubscription = (artistId: string, artistName: string) => {
    Alert.alert(
      'Cancel Artist Subscription',
      `Are you sure you want to unsubscribe from ${artistName}?`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            const success = await subscriptionService.unsubscribeFromArtist(artistId);
            if (success) {
              Alert.alert('Success', `You have unsubscribed from ${artistName}.`);
              loadArtistSubscriptions();
            } else {
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionStatusColor = () => {
    if (!subscription) return colors.textSecondary;
    switch (subscription.status) {
      case 'active':
        return colors.success || '#4CAF50';
      case 'cancelled':
        return colors.warning || '#FF9800';
      case 'expired':
        return colors.error || '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const renderSubscriptionDetails = () => {
    if (!subscription) {
      return (
        <View style={styles.noSubscriptionContainer}>
          <Ionicons name="diamond-outline" size={64} color={themeColors.textSecondary} />
          <Text style={styles.noSubscriptionTitle}>No Active Subscription</Text>
          <Text style={styles.noSubscriptionText}>
            You don't have an active subscription. Upgrade to access premium features.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.upgradeButtonText}>Browse Plans</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.subscriptionContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.subscriptionHeader}
        >
          <View style={styles.subscriptionIcon}>
            <Ionicons name="diamond" size={32} color="white" />
          </View>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionTier}>{subscription.tier.toUpperCase()}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getSubscriptionStatusColor() }]} />
              <Text style={styles.subscriptionStatus}>{subscription.status.toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Start Date</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(subscription.start_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>End Date</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(subscription.end_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Payment Method</Text>
            </View>
            <Text style={styles.detailValue}>
              {subscription.payment_method === 'card' ? 'Credit Card' : 
               subscription.payment_method === 'apple' ? 'Apple Pay' : 
               subscription.payment_method === 'eth' ? 'Ethereum' : 
               subscription.payment_method.toUpperCase()}
            </Text>
          </View>

          {subscription.transaction_hash && (
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Transaction</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={1}>
                {subscription.transaction_hash.substring(0, 10)}...
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Auto-Renewal</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.autoRenewToggle,
                subscription.auto_renew && styles.autoRenewActive,
              ]}
              onPress={handleToggleAutoRenew}
              disabled={isLoading || subscription.status !== 'active'}
            >
              <Text style={[
                styles.toggleText,
                subscription.auto_renew && styles.toggleTextActive,
              ]}>
                {subscription.auto_renew ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!subscription || subscription.status !== 'active') return null;

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Ionicons name="arrow-up-circle" size={20} color="white" />
          <Text style={styles.upgradeButtonText}>Change Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelSubscription}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <>
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    errorContainer: {
      backgroundColor: themeColors.error || '#F44336',
      padding: 12,
      borderRadius: 8,
      marginVertical: 16,
    },
    errorText: {
      color: 'white',
      fontSize: 14,
      textAlign: 'center',
    },
    noSubscriptionContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    noSubscriptionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginTop: 20,
      marginBottom: 8,
    },
    noSubscriptionText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    subscriptionContainer: {
      marginVertical: 20,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 24,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    subscriptionIcon: {
      marginRight: 16,
    },
    subscriptionInfo: {
      flex: 1,
    },
    subscriptionTier: {
      fontSize: 24,
      fontWeight: '700',
      color: 'white',
      marginBottom: 4,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    subscriptionStatus: {
      fontSize: 14,
      color: 'white',
      fontWeight: '500',
    },
    detailsContainer: {
      backgroundColor: themeColors.surface,
      padding: 20,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    detailLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    detailLabel: {
      fontSize: 16,
      color: themeColors.text,
      marginLeft: 12,
    },
    detailValue: {
      fontSize: 16,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    autoRenewToggle: {
      backgroundColor: themeColors.border,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      minWidth: 50,
      alignItems: 'center',
    },
    autoRenewActive: {
      backgroundColor: themeColors.primary,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    toggleTextActive: {
      color: 'white',
    },
    actionButtonsContainer: {
      marginVertical: 20,
      gap: 12,
    },
    upgradeButton: {
      backgroundColor: themeColors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    upgradeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: themeColors.error || '#F44336',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    cancelButtonText: {
      color: themeColors.error || '#F44336',
      fontSize: 16,
      fontWeight: '600',
    },
    helpContainer: {
      marginVertical: 20,
      padding: 20,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
    },
    helpTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    helpText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    helpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    helpButtonText: {
      fontSize: 16,
      color: themeColors.primary,
      fontWeight: '500',
    },
    artistSubscriptionsSection: {
      marginVertical: 20,
    },
    artistSubscriptionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 16,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    noArtistSubscriptions: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    noArtistSubscriptionsText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    artistList: {
      gap: 12,
    },
    artistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: 12,
    },
    artistInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    artistAvatar: {
      marginRight: 12,
    },
    artistDetails: {
      flex: 1,
    },
    artistName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    artistSubscriptionPrice: {
      fontSize: 14,
      color: themeColors.primary,
      marginBottom: 2,
    },
    artistSubscriptionExpiry: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    artistUnsubscribeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.error || '#F44336',
    },
    artistUnsubscribeText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.error || '#F44336',
    },
    artistAutoRenewContainer: {
      marginTop: 2,
    },
    artistAutoRenewText: {
      fontSize: 12,
      color: themeColors.success || '#4CAF50',
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderSubscriptionDetails()}
        {renderActionButtons()}

        {/* Artist Subscriptions Section */}
        <View style={styles.artistSubscriptionsSection}>
          <Text style={styles.artistSubscriptionTitle}>Artist Subscriptions</Text>
          
          {loadingArtists ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : artistSubscriptions.length === 0 ? (
            <View style={styles.noArtistSubscriptions}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.noArtistSubscriptionsText}>
                You're not subscribed to any artists yet
              </Text>
            </View>
          ) : (
            <View style={styles.artistList}>
              {artistSubscriptions.map((artist) => (
                <View key={artist.artistId} style={styles.artistItem}>
                  <View style={styles.artistInfo}>
                    <View style={styles.artistAvatar}>
                      <Ionicons name="person-circle" size={40} color={colors.primary} />
                    </View>
                    <View style={styles.artistDetails}>
                      <Text style={styles.artistName}>{artist.artistName}</Text>
                      <Text style={styles.artistSubscriptionPrice}>
                        ${artist.price}/month
                      </Text>
                      <Text style={styles.artistSubscriptionExpiry}>
                        Expires: {formatDate(artist.expiresAt.toString())}
                      </Text>
                      <View style={styles.artistAutoRenewContainer}>
                        <Text style={styles.artistAutoRenewText}>
                          Auto-renew: {artist.autoRenew ? 'On' : 'Off'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.artistUnsubscribeButton}
                    onPress={() => handleCancelArtistSubscription(artist.artistId, artist.artistName)}
                  >
                    <Text style={styles.artistUnsubscribeText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            Contact our support team if you have any questions about your subscription or billing.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: colors.error || '#F44336',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noSubscriptionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  subscriptionContainer: {
    marginVertical: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  subscriptionIcon: {
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTier: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  autoRenewToggle: {
    backgroundColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  autoRenewActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: 'white',
  },
  actionButtonsContainer: {
    marginVertical: 20,
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.error || '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: colors.error || '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  artistSubscriptionsSection: {
    marginVertical: 20,
  },
  artistSubscriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noArtistSubscriptions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noArtistSubscriptionsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  artistList: {
    gap: 12,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistAvatar: {
    marginRight: 12,
  },
  artistDetails: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  artistSubscriptionPrice: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  artistSubscriptionExpiry: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  artistUnsubscribeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error || '#F44336',
  },
  artistUnsubscribeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error || '#F44336',
  },
});
