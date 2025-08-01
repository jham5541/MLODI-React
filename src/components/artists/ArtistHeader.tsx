import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Share,
  Alert,
} from 'react-native';
// Audio import removed - using audioService instead
import { Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import ArtistDropdownMenu from './ArtistDropdownMenu';
import ArtistSubscriptionModal from './ArtistSubscriptionModal';
import { followService } from '../../services/followService';
import { subscriptionService } from '../../services/subscriptionService';

interface ArtistHeaderProps {
  artist: {
    id: string;
    name: string;
    bio: string;
    coverUrl: string;
    bannerUrl?: string;
    bannerMediaType?: 'image' | 'video' | 'gif'; // Optional: explicit media type
    isVerified?: boolean;
    monthlyListeners?: number;
    subscriptionPrice?: number;
    isSubscribed?: boolean;
  };
  onSubscribe?: () => void;
}

export default function ArtistHeader({
  artist,
  onSubscribe,
}: ArtistHeaderProps) {
  const {
    id: artistId,
    name,
    bio,
    coverUrl,
    bannerUrl,
    isVerified = false,
    monthlyListeners = 0,
    subscriptionPrice = 0,
    isSubscribed = false,
  } = artist;
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;
  
  // State for modals and follow/subscription status
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUserSubscribed, setIsUserSubscribed] = useState(false);
  
  // Load initial follow and subscription status
  useEffect(() => {
    setIsFollowing(followService.isFollowing(artistId));
    setIsUserSubscribed(subscriptionService.isSubscribedTo(artistId));
  }, [artistId]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${name} on MLODI! 🎵`,
        url: `https://mlodi.com/artist/${artistId}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share artist profile');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getMediaType = (url: string): 'video' | 'image' => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) ? 'video' : 'image';
  };
  
  // Handler for subscribe button
  const handleSubscribePress = () => {
    if (isUserSubscribed) {
      // If already subscribed, show subscription details
      setSubscriptionModalVisible(true);
    } else {
      // If not subscribed, show subscription modal
      setSubscriptionModalVisible(true);
    }
  };
  
  // Handler for dropdown menu
  const handleDropdownPress = () => {
    setDropdownVisible(true);
  };
  
  // Handler for follow toggle from dropdown
  const handleFollowToggle = (newFollowStatus: boolean) => {
    setIsFollowing(newFollowStatus);
  };
  
  // Handler for subscription change from modal
  const handleSubscriptionChange = (newSubscriptionStatus: boolean) => {
    setIsUserSubscribed(newSubscriptionStatus);
    onSubscribe?.(); // Call the optional callback
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.background,
    },
    bannerContainer: {
      height: 320,
      width: '100%',
      position: 'relative',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      zIndex: 1,
    },
    gradientOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 2,
    },
    headerControls: {
      position: 'absolute',
      top: 60,
      left: 24,
      right: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 20,
    },
    controlButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    profileSection: {
      backgroundColor: themeColors.background,
      paddingTop: 0,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    profileCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 24,
      paddingTop: 60,
      marginTop: -40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    profileImageContainer: {
      alignItems: 'center',
      position: 'absolute',
      top: -55,
      left: 0,
      right: 0,
      zIndex: 30,
    },
    profileImage: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 5,
      borderColor: themeColors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 12,
    },
    contentContainer: {
      alignItems: 'center',
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    artistName: {
      fontSize: 28,
      fontWeight: '800',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 0,
      letterSpacing: -0.5,
    },
    verifiedIcon: {
      marginLeft: 6,
    },
    statsContainer: {
      backgroundColor: 'transparent',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    listenerCount: {
      fontSize: 18,
      fontWeight: '800',
      color: themeColors.primary,
    },
    listenerLabel: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bio: {
      fontSize: 15,
      lineHeight: 22,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
      paddingHorizontal: 8,
      maxWidth: '100%',
      fontWeight: '400',
    },
    actionButtons: {
      flexDirection: 'row',
      width: '100%',
      paddingHorizontal: 0,
      marginTop: 8,
    },
    subscribeButton: {
      flex: 1,
      backgroundColor: themeColors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      transform: [{ scale: 1 }],
      marginRight: 8,
    },
    subscribedButton: {
      backgroundColor: themeColors.success,
      shadowColor: themeColors.success,
    },
    subscribeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    priceText: {
      fontSize: 11,
      color: '#FFFFFF',
      opacity: 0.9,
      fontWeight: '500',
      marginTop: 2,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderColor: themeColors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'transparent',
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        {bannerUrl ? (
          getMediaType(bannerUrl) === 'video' ? (
            <>
              <Video
                source={{ uri: bannerUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
                isLooping
                shouldPlay
                isMuted
                useNativeControls={false}
              />
              <View style={styles.gradientOverlay} />
            </>
          ) : (
            <ImageBackground source={{ uri: bannerUrl }} style={styles.bannerImage}>
              <View style={styles.gradientOverlay} />
            </ImageBackground>
          )
        ) : (
          // Demo banner image
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' }} 
            style={styles.bannerImage}
          >
            <View style={styles.gradientOverlay} />
          </ImageBackground>
        )}
        
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' }} 
              style={styles.profileImage} 
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.nameContainer}>
              <Text style={styles.artistName}>{name}</Text>
              {isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={themeColors.primary}
                  style={styles.verifiedIcon}
                />
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <Text style={styles.listenerCount}>{formatNumber(monthlyListeners)}</Text>
                <Text style={styles.listenerLabel}>monthly listeners</Text>
              </View>
            </View>

            <Text style={styles.bio}>{bio}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.subscribeButton, isUserSubscribed && styles.subscribedButton]}
                onPress={handleSubscribePress}
              >
                <Ionicons
                  name={isUserSubscribed ? "checkmark" : "add"}
                  size={20}
                  color="#FFFFFF"
                />
                <View>
                  <Text style={styles.subscribeButtonText}>
                    {isUserSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Text>
                  {!isUserSubscribed && subscriptionPrice > 0 && (
                    <Text style={styles.priceText}>${subscriptionPrice}/month</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleDropdownPress}>
                <Ionicons name="ellipsis-horizontal" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      {/* Dropdown Menu */}
      <ArtistDropdownMenu
        visible={dropdownVisible}
        onClose={() => setDropdownVisible(false)}
        artist={{
          id: artistId,
          name,
          coverUrl,
        }}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />
      
      {/* Subscription Modal */}
      <ArtistSubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        artist={{
          id: artistId,
          name,
          coverUrl,
        }}
        isSubscribed={isUserSubscribed}
        onSubscriptionChange={handleSubscriptionChange}
      />
    </View>
  );
}
