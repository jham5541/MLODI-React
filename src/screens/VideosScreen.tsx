import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, colors } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { purchaseService } from '../services/purchaseService';
import VideoPurchaseModal from '../components/purchase/VideoPurchaseModal';
import videoService, { Video } from '../services/videoService';
import videoPurchaseService from '../services/videoPurchaseService';

type VideosScreenRouteProp = RouteProp<RootStackParamList, 'Videos'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

// Using the Video interface from videoService

export default function VideosScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VideosScreenRouteProp>();
  const { artistId } = route.params;

  const [videos, setVideos] = useState<Video[]>([]);
  const [purchasedVideos, setPurchasedVideos] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
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

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderVideoItem = ({ item }: { item: Video }) => {
    const isPurchased = purchasedVideos.includes(item.id);
    const purchaseCount = purchaseService.getVideoPurchaseCount(item.id);

    return (
      <TouchableOpacity
        style={styles.videoItem}
        onPress={() => handleVideoPress(item)}
      >
        <View style={styles.thumbnailContainer}>
          <Image 
            source={{ uri: item.thumbnailUrl }} 
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
              {formatDuration(item.duration)}
            </Text>
          </View>

          {/* Play button overlay */}
          <View style={styles.playButtonOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handleVideoPress(item)}
            >
              <Ionicons name="play" size={20} color={themeColors.background} />
            </TouchableOpacity>
          </View>

          {/* Ownership count badge */}
          {purchaseCount > 0 && (
            <View style={styles.ownershipBadge}>
              <Text style={styles.ownershipCount}>{purchaseCount}</Text>
            </View>
          )}

          {/* Premium/Badge indicators - hide if purchased */}
          {item.price && !isPurchased && (
            <View style={styles.priceIndicator}>
              <Ionicons name="diamond" size={12} color="#FFD700" />
              <Text style={styles.priceIndicatorText}>${item.price}</Text>
            </View>
          )}
          
          {item.badgeRequired && !isPurchased && (
            <View style={styles.badgeIndicator}>
              <Ionicons name="shield" size={12} color="#FF6B6B" />
              <Text style={styles.badgeIndicatorText}>{item.badgeRequired}</Text>
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
            {item.title}
          </Text>
          
          <View style={styles.videoStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={12} color={themeColors.textSecondary} />
              <Text style={styles.statText}>{formatNumber(item.views)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="heart" size={12} color={themeColors.textSecondary} />
              <Text style={styles.statText}>{formatNumber(item.likes)}</Text>
            </View>
            
            <Text style={styles.releaseDate}>
              {formatDate(item.releaseDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
      paddingHorizontal: 16,
      paddingTop: StatusBar.currentHeight || 44,
      paddingBottom: 16,
      backgroundColor: themeColors.surface,
    },
    backButton: {
      marginRight: 16,
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    videoItem: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    thumbnailContainer: {
      position: 'relative',
      aspectRatio: 16 / 9,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
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
      padding: 16,
    },
    videoTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 8,
      lineHeight: 22,
    },
    videoStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    releaseDate: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 'auto',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginTop: 12,
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Videos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videos</Text>
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color={themeColors.textSecondary} />
            <Text style={styles.emptyText}>No videos available</Text>
          </View>
        }
      />
      
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
          artist="Artist Name"
          price={`$${selectedVideoForPurchase.price}`}
          thumbnailUrl={selectedVideoForPurchase.thumbnailUrl}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </View>
  );
}
