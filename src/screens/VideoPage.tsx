import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-video';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, colors } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type VideoPageRouteProp = RouteProp<RootStackParamList, 'VideoPage'>;
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
  artistName: string;
  description: string;
}

export default function VideoPage() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VideoPageRouteProp>();
  const { videoId } = route.params;

  const [video, setVideo] = useState<Video | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({});
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [hasViewed, setHasViewed] = useState(false);
  const videoRef = useRef(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockVideo: Video = {
      id: videoId,
      title: 'Summer Nights - Official Music Video',
      thumbnailUrl: 'https://picsum.photos/400/225?random=20',
      duration: 195,
      views: 2500000,
      likes: 125000,
      releaseDate: '2023-08-20',
      // Using a sample video URL that works with expo-av
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      artistName: 'Artist Name',
      description: 'Experience the magic of summer nights in this official music video. Shot in stunning locations with breathtaking cinematography that captures the essence of the season.',
    };

    setVideo(mockVideo);
    setViewCount(mockVideo.views);
    setLikeCount(mockVideo.likes);
    setLoading(false);
  }, [videoId]);

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
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.presentFullscreenPlayer();
      
      // Increment view count when video is played (only once per session)
      if (!hasViewed) {
        setViewCount(prev => prev + 1);
        setHasViewed(true);
      }
    }
  };

  const handleLikeVideo = () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    
    // Update like count based on action
    if (wasLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    
    // Optional: Show feedback without alert for better UX
    // Alert.alert('Like Video', `${wasLiked ? 'Unliked' : 'Liked'} "${video?.title}"`);
  };

  const handleShareVideo = () => {
    Alert.alert('Share Video', `Sharing "${video?.title}"`);
  };

  const handleGoBack = () => {
    navigation.goBack();
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
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      flex: 1,
    },
    videoPlayerContainer: {
      backgroundColor: '#000',
      aspectRatio: 16 / 9,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    fullscreenOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButtonOverlay: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    tapToPlayText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    content: {
      flex: 1,
    },
    videoInfo: {
      padding: 24,
    },
    videoTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 6,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    artistName: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.primary,
      marginBottom: 20,
      letterSpacing: 0.2,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      marginBottom: 24,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statItem: {
      alignItems: 'center',
      gap: 8,
    },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statText: {
      fontSize: 16,
      color: themeColors.text,
      fontWeight: '700',
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 2,
      letterSpacing: 0.5,
    },
    releaseDate: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
      marginLeft: 'auto',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 32,
    },
    actionButton: {
      flex: 1,
      backgroundColor: themeColors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    actionButtonText: {
      color: themeColors.background,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    secondaryActionButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1.5,
      borderColor: themeColors.border,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    secondaryActionButtonText: {
      color: themeColors.text,
      fontWeight: '600',
    },
    likedButton: {
      backgroundColor: '#FF6B6B',
      shadowColor: '#FF6B6B',
    },
    descriptionContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 8,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    descriptionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    description: {
      fontSize: 16,
      color: themeColors.textSecondary,
      lineHeight: 26,
      letterSpacing: 0.2,
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
  });

  if (loading || !video) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading video...</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {video.title}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoPlayerContainer}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={{
              uri: video.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={status => setStatus(() => status)}
            shouldPlay={false}
            onFullscreenUpdate={({ fullscreenUpdate }) => {
              // Handle fullscreen changes if needed
              console.log('Fullscreen update:', fullscreenUpdate);
            }}
          />
          <TouchableOpacity 
            style={styles.fullscreenOverlay} 
            onPress={handlePlayVideo}
            activeOpacity={0.7}
          >
            <View style={styles.playButtonOverlay}>
              <Ionicons name="play" size={32} color="white" />
            </View>
            <Text style={styles.tapToPlayText}>Tap to play fullscreen</Text>
          </TouchableOpacity>
        </View>

        {/* Video Information */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.artistName}>{video.artistName}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="eye" size={18} color={themeColors.primary} />
              </View>
              <Text style={styles.statText}>{formatNumber(viewCount)}</Text>
              <Text style={styles.statLabel}>VIEWS</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="heart" size={18} color={themeColors.primary} />
              </View>
              <Text style={styles.statText}>{formatNumber(likeCount)}</Text>
              <Text style={styles.statLabel}>LIKES</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={18} color={themeColors.primary} />
              </View>
              <Text style={styles.statText}>{formatDuration(video.duration)}</Text>
              <Text style={styles.statLabel}>DURATION</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar" size={18} color={themeColors.primary} />
              </View>
              <Text style={styles.statText}>{new Date(video.releaseDate).getFullYear()}</Text>
              <Text style={styles.statLabel}>RELEASE</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={handleLikeVideo}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={themeColors.background} 
              />
              <Text style={styles.actionButtonText}>
                {isLiked ? 'Liked' : 'Like'} ({formatNumber(likeCount)})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryActionButton]}
              onPress={handleShareVideo}
            >
              <Ionicons name="share-outline" size={20} color={themeColors.text} />
              <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>{video.description}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
