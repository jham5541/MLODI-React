import React, { useState } from 'react';
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
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

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

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.background,
    },
    bannerContainer: {
      height: 280,
      width: '100%',
      position: 'relative',
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
      backgroundColor: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)',
      zIndex: 2,
    },
    headerControls: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 20,
    },
    controlButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    profileSection: {
      backgroundColor: themeColors.background,
      paddingTop: 32,
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    profileImageContainer: {
      alignItems: 'center',
      marginTop: -80,
      marginBottom: 24,
      zIndex: 30,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: themeColors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
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
    },
    verifiedIcon: {
      marginLeft: 8,
    },
    statsContainer: {
      backgroundColor: themeColors.surface,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      marginBottom: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listenerCount: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.primary,
    },
    listenerLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
    },
    bio: {
      fontSize: 15,
      lineHeight: 22,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      paddingHorizontal: 16,
      maxWidth: '90%',
    },
    actionButtons: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
      paddingHorizontal: 8,
    },
    subscribeButton: {
      flex: 1,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    subscribedButton: {
      backgroundColor: themeColors.success,
    },
    subscribeButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    priceText: {
      fontSize: 11,
      color: '#FFFFFF',
      opacity: 0.9,
      fontWeight: '500',
    },
    secondaryButton: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
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
                size={22}
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
              style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
              onPress={() => onSubscribe?.()}
            >
              <Ionicons
                name={isSubscribed ? "checkmark" : "add"}
                size={18}
                color="#FFFFFF"
              />
              <View>
                <Text style={styles.subscribeButtonText}>
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </Text>
                {!isSubscribed && subscriptionPrice > 0 && (
                  <Text style={styles.priceText}>${subscriptionPrice}/month</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
