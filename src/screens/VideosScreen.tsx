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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, colors } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { purchaseService } from '../services/purchaseService';
import VideoPurchaseModal from '../components/purchase/VideoPurchaseModal';

type VideosScreenRouteProp = RouteProp<RootStackParamList, 'Videos'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  likes: number;
  releaseDate: string;
  price?: number;
  badgeRequired?: string;
  videoUrl?: string;
}

export default function VideosScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VideosScreenRouteProp>();
  const { artistId } = route.params;

  const [videos, setVideos] = useState<Video[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedVideoForPurchase, setSelectedVideoForPurchase] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadVideos();
  }, [artistId]);

  const loadVideos = async () => {
    // Mock data - replace with actual API call
    const mockVideos: Video[] = [
      {
        id: '1',
        title: 'Summer Nights - Official Music Video',
        thumbnailUrl: 'https://picsum.photos/400/225?random=20',
        duration: 195,
        views: 2500000,
        likes: 125000,
        releaseDate: '2023-08-20',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
      {
        id: '2',
        title: 'Electric Dreams (Live Performance)',
        thumbnailUrl: 'https://picsum.photos/400/225?random=21',
        duration: 208,
        views: 1800000,
        likes: 89000,
        releaseDate: '2023-07-15',
        price: 2.99,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      },
      {
        id: '3',
        title: 'Behind the Scenes - Golden Hour',
        thumbnailUrl: 'https://picsum.photos/400/225?random=22',
        duration: 360,
        views: 750000,
        likes: 32000,
        releaseDate: '2023-06-10',
        badgeRequired: 'Gold Fan',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: '4',
        title: 'Midnight Drive - Acoustic Version',
        thumbnailUrl: 'https://picsum.photos/400/225?random=23',
        duration: 183,
        views: 950000,
        likes: 48000,
        releaseDate: '2023-05-25',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      },
      {
        id: '5',
        title: 'City Lights - Director\'s Cut',
        thumbnailUrl: 'https://picsum.photos/400/225?random=24',
        duration: 245,
        views: 1200000,
        likes: 67000,
        releaseDate: '2023-04-12',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      },
      {
        id: '6',
        title: 'Unplugged Session - Vol. 1',
        thumbnailUrl: 'https://picsum.photos/400/225?random=25',
        duration: 320,
        views: 890000,
        likes: 45000,
        releaseDate: '2023-03-08',
        badgeRequired: 'VIP',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      },
    ];

    setVideos(mockVideos);
    setLoading(false);
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
    if (video.price && !purchaseService.isVideoPurchased(video.id)) {
      Alert.alert(
        'Premium Video',
        `This video requires a purchase of $${video.price}. Would you like to buy it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy & Watch', onPress: () => handleBuyVideo(video) },
        ]
      );
    } else if (video.badgeRequired && !purchaseService.isVideoPurchased(video.id)) {
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
  
  const handlePurchaseComplete = () => {
    setRefreshKey(prev => prev + 1); // Force re-render to show updated purchase status
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderVideoItem = ({ item }: { item: Video }) => {
    const isPurchased = purchaseService.isVideoPurchased(item.id);
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
