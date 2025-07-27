import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { NFTDrop, nftDropsService } from '../../services/nftDropsService';

interface MarketplaceDropCardProps {
  drop: NFTDrop;
  onPress?: () => void;
}

export default function MarketplaceDropCard({
  drop,
  onPress,
}: MarketplaceDropCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isNotified, setIsNotified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateCountdown = () => {
    const now = new Date().getTime();
    const dropTime = new Date(drop.drop_date).getTime();
    const difference = dropTime - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    } else {
      setTimeLeft('Live Now!');
    }
  };

  const handleNotifyMe = async () => {
    try {
      setIsLoading(true);
      if (isNotified) {
        await nftDropsService.removeNotification(drop.id);
        setIsNotified(false);
        Alert.alert('Success', 'Notification removed successfully');
      } else {
        await nftDropsService.setNotification(drop.id);
        setIsNotified(true);
        Alert.alert('Success', 'You will be notified when this drop goes live!');
      }
    } catch (error) {
      console.error('Error managing notification:', error);
      Alert.alert('Error', 'Failed to update notification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [drop.drop_date]);

  useEffect(() => {
    // Check if user has notification set for this drop
    const checkNotificationStatus = async () => {
      try {
        // This would need to be implemented in the service
        // For now, we'll use the drop's notification_count as an indicator
        setIsNotified(false); // Default to false until we implement user-specific checks
      } catch (error) {
        console.error('Error checking notification status:', error);
      }
    };
    
    checkNotificationStatus();
  }, [drop.id]);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: themeColors.surface,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    imageContainer: {
      height: 200,
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'space-between',
      padding: 16,
    },
    topOverlay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    dropBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dropBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
    notifyButton: {
      backgroundColor: isNotified ? themeColors.success : 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isNotified ? themeColors.success : 'rgba(255, 255, 255, 0.3)',
    },
    notifyButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    bottomOverlay: {
      alignItems: 'flex-start',
    },
    countdown: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 8,
    },
    countdownText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    content: {
      padding: 16,
    },
    artistContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    artistAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
      backgroundColor: themeColors.background,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    description: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    priceContainer: {
      alignItems: 'flex-start',
    },
    priceLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    price: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.primary,
    },
    supplyContainer: {
      alignItems: 'flex-end',
    },
    supplyLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    supply: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: themeColors.primary,
    },
    secondaryButton: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    primaryButtonText: {
      color: 'white',
    },
    secondaryButtonText: {
      color: themeColors.text,
    },
    liveIndicator: {
      backgroundColor: '#FF4444',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    liveText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 6,
    },
  });

  const isLive = timeLeft === 'Live Now!';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <ImageBackground source={{ uri: drop.cover_image }} style={styles.coverImage}>
          <View style={styles.overlay}>
            <View style={styles.topOverlay}>
              <View style={styles.dropBadge}>
                <Ionicons name="flash" size={12} color="white" />
                <Text style={styles.dropBadgeText}>
                  {drop.status === 'live' ? 'LIVE DROP' : 'UPCOMING DROP'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.notifyButton} 
                onPress={handleNotifyMe}
                disabled={isLoading}
              >
                <Text style={styles.notifyButtonText}>
                  {isNotified ? 'Notified ✓' : 'Notify Me'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomOverlay}>
              {isLive ? (
                <View style={styles.liveIndicator}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'white',
                    }}
                  />
                  <Text style={styles.liveText}>LIVE NOW!</Text>
                </View>
              ) : (
                <View style={styles.countdown}>
                  <Text style={styles.countdownText}>{timeLeft}</Text>
                </View>
              )}
              <Text style={styles.title} numberOfLines={2}>
                {drop.title}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.content}>
        <View style={styles.artistContainer}>
          {drop.artist?.avatar_url && (
            <Image source={{ uri: drop.artist.avatar_url }} style={styles.artistAvatar} />
          )}
          <Text style={styles.artist}>by {drop.artist?.name || 'Unknown Artist'}</Text>
        </View>

        {drop.description && (
          <Text style={styles.description} numberOfLines={2}>
            {drop.description}
          </Text>
        )}

        <View style={styles.infoRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting Price</Text>
            <Text style={styles.price}>
              {drop.starting_price} {drop.currency}
            </Text>
          </View>

          <View style={styles.supplyContainer}>
            <Text style={styles.supplyLabel}>Supply</Text>
            <Text style={styles.supply}>{drop.total_supply.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => console.log('View details')}
          >
            <Ionicons name="information-circle-outline" size={16} color={themeColors.text} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => console.log(isLive ? 'Buy now' : 'Set reminder')}
          >
            <Ionicons 
              name={isLive ? "flash" : "time"} 
              size={16} 
              color="white" 
            />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {isLive ? 'Buy Now' : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
