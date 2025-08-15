import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, colors } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { purchaseService } from '../../services/purchaseService';
import VideoPurchaseModal from '../purchase/VideoPurchaseModal';
import videoService, { Video } from '../../services/videoService';
import videoPurchaseService from '../../services/videoPurchaseService';

// Using the Video interface from videoService

interface VideoCarouselProps {
  artistId: string;
  artistName?: string;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function VideoCarousel({
  artistId,
  artistName = 'Artist',
}: VideoCarouselProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProp>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedVideos, setPurchasedVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedVideoForPurchase, setSelectedVideoForPurchase] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadVideos();
  }, [artistId, refreshKey]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      
      // Load videos and user's purchases in parallel
      const [videosData, userPurchases] = await Promise.all([
        videoService.getArtistVideos(artistId),
        videoPurchaseService.getUserPurchasedVideos(),
      ]);
      
      setVideos(videosData);
      setPurchasedVideos(userPurchases);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    });
  };

  const handleVideoPress = (video: Video) => {
    const isPurchased = purchasedVideos.includes(video.id);
    
    if (video.price && !isPurchased) {
      Alert.alert(
        'Premium Video',
        `This video requires a purchase of $${video.price}. Would you like to buy it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy & Watch', onPress: () => handleBuyVideo(video) },
        ]
      );
    } else if (video.badgeRequired && !isPurchased) {
      Alert.alert(
        'Badge Required',
        `This video requires the "${video.badgeRequired}" badge to watch.`,
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      navigation.navigate('VideoPage', { videoId: video.id });
    }
  };
  
  const handleBuyVideo = (video: Video) => {
    setSelectedVideoForPurchase(video);
    setPurchaseModalVisible(true);
  };
  
  const handlePurchaseComplete = async () => {
    // Reload purchased videos
    const userPurchases = await videoPurchaseService.getUserPurchasedVideos();
    setPurchasedVideos(userPurchases);
    setRefreshKey(prev => prev + 1); // Force re-render to show updated purchase status
  };

  const openVideoModal = (video: Video) => {
    setSelectedVideo(video);
    setModalVisible(true);
  };

  const handlePlayVideo = (video: Video) => {
    Alert.alert('Play Video', `Playing "${video.title}" by ${artistName}`);
  };

  const handleLikeVideo = (video: Video) => {
    Alert.alert('Like Video', `Liked "${video.title}"`);
  };

  const handleShareVideo = (video: Video) => {
    Alert.alert('Share Video', `Sharing "${video.title}" by ${artistName}`);
  };

  const renderVideoCard = (video: Video) => {
    const isPurchased = purchasedVideos.includes(video.id);
    const purchaseCount = purchaseService.getVideoPurchaseCount(video.id);

    return (
      <TouchableOpacity
        key={video.id}
        style={styles.videoCard}
        onPress={() => handleVideoPress(video)}
      >
        <View style={styles.thumbnailContainer}>
          <Image 
            source={{ uri: video.thumbnailUrl }} 
            style={[
              styles.thumbnail,
              isPurchased && {
                borderWidth: 3,
                borderColor: themeColors.primary,
              }
            ]} 
          />
          
          {/* Duration overlay */}
          <View style={styles.durationOverlay}>
            <Text style={styles.durationText}>
              {formatDuration(video.duration)}
            </Text>
          </View>

          {/* Play button overlay */}
          <View style={styles.playButtonOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handleVideoPress(video)}
            >
              <Ionicons 
                name="play" 
                size={24} 
                color={themeColors.background} 
              />
            </TouchableOpacity>
          </View>

          {/* Ownership count badge */}
          {purchaseCount > 0 && (
            <View style={styles.ownershipBadge}>
              <Text style={styles.ownershipCount}>{purchaseCount}</Text>
            </View>
          )}

          {/* Premium/Badge indicators - hide if purchased */}
          {video.price && !isPurchased && (
            <View style={styles.priceIndicator}>
              <Ionicons name="diamond" size={12} color="#FFD700" />
              <Text style={styles.priceIndicatorText}>${video.price}</Text>
            </View>
          )}
          
          {video.badgeRequired && !isPurchased && (
            <View style={styles.badgeIndicator}>
              <Ionicons name="shield" size={12} color="#FF6B6B" />
              <Text style={styles.badgeIndicatorText}>{video.badgeRequired}</Text>
            </View>
          )}
          
          {/* Purchased indicator */}
          {isPurchased && (
            <View style={styles.purchasedIndicator}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.primary} />
              <Text style={styles.purchasedText}>OWNED</Text>
            </View>
          )}
        </View>

        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          
          <View style={styles.videoStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={12} color={themeColors.textSecondary} />
              <Text style={styles.statText}>{formatNumber(video.views)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="heart" size={12} color={themeColors.textSecondary} />
              <Text style={styles.statText}>{formatNumber(video.likes)}</Text>
            </View>
            
            <Text style={styles.releaseDate}>
              {formatDate(video.releaseDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
    },
    viewAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: themeColors.primary + '20',
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.primary,
    },
    scrollContainer: {
      paddingLeft: 4,
    },
    videoCard: {
      width: 220,
      marginRight: 16,
    },
    thumbnailContainer: {
      position: 'relative',
      marginBottom: 8,
    },
    thumbnail: {
      width: 220,
      height: 124, // 16:9 aspect ratio
      borderRadius: 12,
    },
    durationOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    durationText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    playButtonOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -20 }, { translateY: -20 }],
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    priceIndicator: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(255, 215, 0, 0.9)',
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    priceIndicatorText: {
      color: '#000',
      fontSize: 10,
      fontWeight: '700',
    },
    badgeIndicator: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(255, 107, 107, 0.9)',
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    badgeIndicatorText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '700',
    },
    videoInfo: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 6,
      lineHeight: 18,
    },
    videoStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    statText: {
      fontSize: 11,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    releaseDate: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginLeft: 'auto',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderRadius: 20,
      width: '95%',
      maxHeight: '90%',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      flex: 1,
      marginRight: 16,
    },
    closeButton: {
      padding: 8,
    },
    videoPlayerContainer: {
      backgroundColor: '#000',
      aspectRatio: 16 / 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    videoPlaceholderText: {
      color: 'white',
      fontSize: 16,
      marginTop: 8,
    },
    videoDetails: {
      padding: 16,
    },
    videoStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      marginBottom: 16,
    },
    videoStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    videoStatLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    videoStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    videoActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    actionButtonText: {
      color: themeColors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryActionButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    secondaryActionButtonText: {
      color: themeColors.text,
    },
    // Ownership and purchase indicators
    ownershipBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'white',
    },
    ownershipCount: {
      color: 'white',
      fontSize: 12,
      fontWeight: '800',
    },
    purchasedIndicator: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    purchasedText: {
      color: themeColors.primary,
      fontSize: 10,
      fontWeight: '800',
    },
  });

  if (videos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Videos</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No videos available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Videos</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Videos', { artistId })}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {videos.map(renderVideoCard)}
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedVideo && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedVideo.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={themeColors.text} />
                  </TouchableOpacity>
                </View>

                {/* Video Player Placeholder */}
                <View style={styles.videoPlayerContainer}>
                  <View style={styles.videoPlaceholder}>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => handlePlayVideo(selectedVideo)}
                    >
                      <Ionicons name="play" size={32} color={themeColors.background} />
                    </TouchableOpacity>
                    <Text style={styles.videoPlaceholderText}>
                      Tap to play video
                    </Text>
                  </View>
                </View>

                <View style={styles.videoDetails}>
                  <View style={styles.videoStatsRow}>
                    <View style={styles.videoStatItem}>
                      <Ionicons name="eye" size={16} color={themeColors.textSecondary} />
                      <Text style={styles.videoStatLabel}>Views:</Text>
                      <Text style={styles.videoStatValue}>
                        {formatNumber(selectedVideo.views)}
                      </Text>
                    </View>
                    
                    <View style={styles.videoStatItem}>
                      <Ionicons name="heart" size={16} color={themeColors.textSecondary} />
                      <Text style={styles.videoStatLabel}>Likes:</Text>
                      <Text style={styles.videoStatValue}>
                        {formatNumber(selectedVideo.likes)}
                      </Text>
                    </View>
                    
                    <View style={styles.videoStatItem}>
                      <Ionicons name="calendar" size={16} color={themeColors.textSecondary} />
                      <Text style={styles.videoStatValue}>
                        {formatDate(selectedVideo.releaseDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.videoActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleLikeVideo(selectedVideo)}
                    >
                      <Ionicons name="heart-outline" size={16} color={themeColors.background} />
                      <Text style={styles.actionButtonText}>Like</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.secondaryActionButton]}
                      onPress={() => handleShareVideo(selectedVideo)}
                    >
                      <Ionicons name="share-outline" size={16} color={themeColors.text} />
                      <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Video Purchase Modal */}
      {selectedVideoForPurchase && (
        <VideoPurchaseModal
          visible={purchaseModalVisible}
          onClose={() => {
            setPurchaseModalVisible(false);
            setSelectedVideoForPurchase(null);
          }}
          videoId={selectedVideoForPurchase.id}
          videoTitle={selectedVideoForPurchase.title}
          artist={artistName}
          price={`$${selectedVideoForPurchase.price}`}
          thumbnailUrl={selectedVideoForPurchase.thumbnailUrl}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </View>
  );
}
