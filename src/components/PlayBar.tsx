import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import MLService from '../services/ml/MLService';
import { AnomalyType } from '../services/ml/types';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { usePlayTracking } from '../context/PlayTrackingContext';
import { formatDuration } from '../utils/uiHelpers';
import { Song } from '../types/music';
import { currentMusicService as musicService } from '../services/serviceProvider';
import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';
import AddToPlaylistModal from './playlists/AddToPlaylistModal';
import PremiumGate from './common/PremiumGate';
import { usePremiumStatus } from '../hooks/usePremiumStatus';

import { Audio } from 'expo-av';

interface PlayBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isVisible: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onExpand: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PlayBar: React.FC<PlayBarProps & { sound?: Audio.Sound | null }> = ({
  currentSong,
  isPlaying,
  isVisible,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
  onExpand,
  sound,
}) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { updateProgress } = usePlayTracking();
  const { user } = useAuthStore();
  
  const [slideAnim] = useState(new Animated.Value(100));
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: repeat all, 2: repeat one
  const [volume, setVolume] = useState(75);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [anomalyDetected, setAnomalyDetected] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const { isPremium } = usePremiumStatus();
  const MAX_FREE_SKIPS = 6; // Maximum skips per hour for free tier

  const handleLike = async () => {
    console.log('👤 Like button pressed - User:', !!user, 'Current song:', !!currentSong, 'Is liked:', isLiked);
    if (!currentSong) return;
    
    // Check if user is authenticated
    if (!user) {
      console.log('🔐 User not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }
    
    try {
      console.log('💖 Processing like action - Current state:', isLiked ? 'liked' : 'not liked');
      if (isLiked) {
        await musicService.unlikeSong(currentSong.id);
        console.log('💔 Song unliked successfully');
      } else {
        await musicService.likeSong(currentSong.id);
        console.log('❤️ Song liked successfully');
      }
      setIsLiked(!isLiked);
      console.log('✅ Like state updated to:', !isLiked);
    } catch (error) {
      console.log('❌ Error liking song:', error);
    }
  };

  const handleShare = () => {
    // Placeholder for sharing functionality
    console.log('Open Share Options');
  };

  const handleAddToPlaylist = () => {
    console.log('📝 Add to playlist button pressed - User:', !!user, 'Modal state:', showAddToPlaylistModal);
    
    // Check if user is authenticated
    if (!user) {
      console.log('🔐 User not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }
    
    console.log('📱 Opening add to playlist modal');
    setShowAddToPlaylistModal(true);
  };

  useEffect(() => {
    if (isVisible && currentSong) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 85,
        friction: 12,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 200,
        useNativeDriver: true,
        tension: 85,
        friction: 12,
      }).start();
    }
  }, [isVisible, currentSong]);

// Detect stream anomalies for current song
  useEffect(() => {
    const detectAnomalies = async () => {
      if (currentSong && user) {
        try {
          const anomalies = await MLService.detectStreamAnomalies(currentSong.id);
          if (anomalies.length > 0) {
            console.log('🔍 Anomalies detected:', anomalies);
            setAnomalyDetected(true);
            
            // Notify backend about detected anomalies
            await notifyBackendAnomalies(anomalies);
            
            // Handle specific anomaly types
            const criticalAnomalies = anomalies.filter(
              a => a.anomalyType === AnomalyType.BOT_BEHAVIOR || 
                   a.anomalyType === AnomalyType.STREAM_FARMING
            );
            
            if (criticalAnomalies.length > 0) {
              // Show alert for critical anomalies
              Alert.alert(
                'Unusual Activity Detected',
                'We\'ve detected unusual streaming patterns. Your account activity is being reviewed.',
                [
                  { text: 'OK', onPress: () => console.log('Anomaly alert acknowledged') }
                ]
              );
            }
          } else {
            setAnomalyDetected(false);
          }
        } catch (error) {
          console.log('Error detecting anomalies:', error);
        }
      }
    };
    detectAnomalies();
  }, [currentSong, user]);
  
  // Notify backend about detected anomalies
  const notifyBackendAnomalies = async (anomalies: any[]) => {
    try {
      // Send anomaly data to backend for further processing
      await musicService.reportAnomalies({
        userId: user?.id,
        trackId: currentSong?.id,
        anomalies: anomalies.map(a => ({
          type: a.anomalyType,
          confidence: a.confidence,
          timestamp: a.timestamp,
          metadata: a.metadata
        }))
      });
      console.log('✅ Anomalies reported to backend');
    } catch (error) {
      console.error('Failed to report anomalies:', error);
    }
  };

  // Simulate progress (in a real app, this would come from audio player)
  // Use real audio progress instead of simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      interval = setInterval(async () => {
        try {
          const status = await sound?.getStatusAsync();
          if (status?.isLoaded) {
            const newTime = status.positionMillis / 1000; // Convert to seconds
            const totalSeconds = status.durationMillis ? status.durationMillis / 1000 : currentSong.duration;
            const newProgress = (newTime / totalSeconds) * 100;
            
            // Schedule updates for the next render cycle
            Promise.resolve().then(() => {
              setCurrentTime(newTime);
              setProgress(newProgress);
              updateProgress(newTime);
            });
          }
        } catch (error) {
          console.error('Error getting playback status:', error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong, sound]);

  // Check if song is liked when currentSong changes
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (currentSong && user) {
        try {
          const liked = await musicService.isLiked(currentSong.id);
          setIsLiked(liked);
        } catch (error) {
          console.log('Error checking like status:', error);
          setIsLiked(false);
        }
      } else {
        setIsLiked(false);
      }
    };
    checkLikeStatus();
  }, [currentSong, user]);

  // Reset modal states when playbar is hidden
  useEffect(() => {
    if (!isVisible) {
      setExpanded(false);
      setShowAddToPlaylistModal(false);
      setShowAuthModal(false);
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setExpanded(false);
      setShowAddToPlaylistModal(false);
      setShowAuthModal(false);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  if (!currentSong) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      margin: 16,
      marginBottom: Platform.OS === 'ios' ? 90 : 80,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
      zIndex: 1000,
    },
    progressBar: {
      height: 2,
      backgroundColor: themeColors.border,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    progressFill: {
      height: '100%',
      backgroundColor: themeColors.primary,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    anomalyIndicator: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#FF3B30',
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#FF3B30',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 72,
    },
    songInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    albumCover: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
      marginRight: 8,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    artistName: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    controlButton: {
      padding: 8,
      marginHorizontal: 4,
    },
    playButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    modalHeaderButton: {
      padding: 10,
    },
    modalContent: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 80,
    },
    modalTopSection: {
      alignItems: 'center',
    },
    modalAlbumCover: {
      width: screenWidth * 0.75,
      height: screenWidth * 0.75,
      borderRadius: 20,
      marginBottom: 36,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    modalSongInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    modalSongTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    modalArtistName: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    modalMiddleSection: {
      paddingHorizontal: 4,
    },
    modalSecondaryControls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      gap: 28,
    },
    modalSecondaryButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.surface + '40',
      borderWidth: 1,
      borderColor: themeColors.border + '30',
    },
    modalSecondaryButtonActive: {
      backgroundColor: themeColors.primary + '20',
      borderColor: themeColors.primary + '40',
    },
    progressContainer: {
      marginBottom: 36,
    },
    progressSlider: {
      width: '100%',
      height: 40,
      marginBottom: 12,
    },
    progressTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    progressTimeText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '400',
      opacity: 0.8,
    },
    modalBottomSection: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    modalControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      width: '100%',
      maxWidth: 520,
    },
    modalControlButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.surface + '40',
      borderWidth: 1,
      borderColor: themeColors.border + '30',
    },
    modalPlayButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      marginHorizontal: 8,
    },
    // Action sheet styles
    actionsBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    actionsPanel: {
      backgroundColor: themeColors.surface,
      paddingVertical: 8,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: 1,
      borderColor: themeColors.border,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '60',
    },
    actionRowText: {
      fontSize: 16,
      color: themeColors.text,
      fontWeight: '500',
    },
  });

  const handleProgressChange = (value: number) => {
    const totalSeconds = currentSong.duration; // duration is already in seconds
    const newTime = (value / 100) * totalSeconds;
    setCurrentTime(Math.floor(newTime));
    setProgress(value);
  };

  const seekBySeconds = async (deltaSeconds: number) => {
    try {
      if (!sound) return;
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      const currentMs = status.positionMillis ?? 0;
      const durationMs = status.durationMillis ?? Number.MAX_SAFE_INTEGER;
      const target = Math.max(0, Math.min(currentMs + deltaSeconds * 1000, durationMs));
      await sound.setPositionAsync(target);
      setCurrentTime(Math.floor(target / 1000));
    } catch (e) {
      console.error('Seek error:', e);
    }
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 1: return 'repeat';
      case 2: return 'repeat-outline';
      default: return 'repeat';
    }
  };

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Anomaly Indicator */}
        {anomalyDetected && (
          <View style={styles.anomalyIndicator}>
            <Ionicons name="warning" size={10} color="white" />
          </View>
        )}
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>

        {/* Main Content */}
        <TouchableOpacity 
          style={styles.content}
          onPress={() => {
            setExpanded(true);
            onExpand();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.songInfo}>
            <Image 
              source={{ uri: currentSong.coverUrl }} 
              style={styles.albumCover}
            />
            <View style={styles.textContainer}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <TouchableOpacity onPress={handleArtistPress}>
                <Text style={styles.artistName} numberOfLines={1}>
                  {currentSong.artist}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
                if (!isPremium && skipCount >= MAX_FREE_SKIPS) {
                  setShowPremiumGate(true);
                  return;
                }
                onPrevious();
                if (!isPremium) setSkipCount(prev => prev + 1);
              }}
            >
              <Ionicons 
                name="play-skip-back" 
                size={20} 
                color={themeColors.text} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playButton}
              onPress={(e) => {
                e.stopPropagation();
                onPlayPause();
              }}
            >
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={20} 
                color="white"
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
                if (!isPremium && skipCount >= MAX_FREE_SKIPS) {
                  setShowPremiumGate(true);
                  return;
                }
                onNext();
                if (!isPremium) setSkipCount(prev => prev + 1);
              }}
            >
              <Ionicons 
                name="play-skip-forward" 
                size={20} 
                color={themeColors.text} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Expanded Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={expanded}
        onRequestClose={() => {
          setExpanded(false);
          setShowAddToPlaylistModal(false);
          setShowAuthModal(false);
        }}
        statusBarTranslucent={true}
        presentationStyle="pageSheet"
        onDismiss={() => {
          setExpanded(false);
          setShowAddToPlaylistModal(false);
          setShowAuthModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={() => {
                setExpanded(false);
                setShowAddToPlaylistModal(false);
                setShowAuthModal(false);
              }}
            >
              <Ionicons name="chevron-down" size={28} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: themeColors.text }}>
              Now Playing
            </Text>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={() => setShowActions(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Top Section - Album & Info */}
            <View style={styles.modalTopSection}>
              <Image 
                source={{ uri: currentSong.coverUrl }} 
                style={styles.modalAlbumCover}
              />
              <View style={styles.modalSongInfo}>
                <Text style={styles.modalSongTitle}>{currentSong.title}</Text>
                <Text style={styles.modalArtistName}>{currentSong.artist}</Text>
              </View>
            </View>

          {/* Middle Section - Progress & Secondary */}
          <View style={styles.modalMiddleSection}>
            <View style={styles.modalSecondaryControls}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={22} color={themeColors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalSecondaryButton,
                  isLiked && styles.modalSecondaryButtonActive
                ]}
                onPress={handleLike}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isLiked ? 'heart' : 'heart-outline'} 
                  size={22} 
                  color={isLiked ? themeColors.primary : themeColors.textSecondary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={handleAddToPlaylist}
                activeOpacity={0.7}
              >
                <Ionicons name="list-outline" size={22} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

              <View style={styles.progressContainer}>
                <Slider
                  style={styles.progressSlider}
                  minimumValue={0}
                  maximumValue={100}
                  value={progress}
                  onValueChange={handleProgressChange}
                  minimumTrackTintColor={themeColors.primary}
                  maximumTrackTintColor={themeColors.border + '40'}
                  thumbTintColor={themeColors.primary}
                />
                <View style={styles.progressTimeContainer}>
                  <Text style={styles.progressTimeText}>{formatTime(currentTime)}</Text>
                  <Text style={styles.progressTimeText}>{formatTime(currentSong.duration)}</Text>
                </View>
              </View>
            </View>

            {/* Bottom Section - Main Controls */}
            <View style={styles.modalBottomSection}>
            <View style={styles.modalControls}>
                <TouchableOpacity 
                  style={styles.modalControlButton}
                  onPress={() => setShuffle(!shuffle)}
                >
                  <Ionicons 
                    name="shuffle" 
                    size={22} 
                    color={shuffle ? themeColors.primary : themeColors.textSecondary} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalControlButton}
                  onPress={() => seekBySeconds(-10)}
                >
                  <Ionicons name="play-back" size={24} color={themeColors.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalControlButton}
                  onPress={() => {
                    if (!isPremium && skipCount >= MAX_FREE_SKIPS) {
                      setShowPremiumGate(true);
                      return;
                    }
                    onPrevious();
                    if (!isPremium) setSkipCount(prev => prev + 1);
                  }}
                >
                  <Ionicons name="play-skip-back" size={26} color={themeColors.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalPlayButton}
                  onPress={onPlayPause}
                >
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={28} 
                    color="white"
                    style={{ marginLeft: isPlaying ? 0 : 2 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalControlButton}
                  onPress={() => {
                    if (!isPremium && skipCount >= MAX_FREE_SKIPS) {
                      setShowPremiumGate(true);
                      return;
                    }
                    onNext();
                    if (!isPremium) setSkipCount(prev => prev + 1);
                  }}
                >
                  <Ionicons name="play-skip-forward" size={26} color={themeColors.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalControlButton}
                  onPress={() => seekBySeconds(10)}
                >
                  <Ionicons name="play-forward" size={24} color={themeColors.text} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalControlButton}
                  onPress={() => setRepeatMode((repeatMode + 1) % 3)}
                >
                  <Ionicons 
                    name={getRepeatIcon()} 
                    size={22} 
                    color={repeatMode > 0 ? themeColors.primary : themeColors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Quick Actions Sheet */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity style={styles.actionsBackdrop} activeOpacity={1} onPress={() => setShowActions(false)}>
          <View style={styles.actionsPanel}>
            <TouchableOpacity style={styles.actionRow} onPress={() => { setShowActions(false); handleAddToPlaylist(); }}>
              <Ionicons name="add-circle-outline" size={20} color={themeColors.text} />
              <Text style={styles.actionRowText}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => { setShowActions(false); handleShare(); }}>
              <Ionicons name="share-outline" size={20} color={themeColors.text} />
              <Text style={styles.actionRowText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => { setShowActions(false); handleLike(); }}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? themeColors.primary : themeColors.text} />
              <Text style={styles.actionRowText}>{isLiked ? 'Unlike' : 'Like'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, { justifyContent: 'center' }]} onPress={() => setShowActions(false)}>
              <Text style={[styles.actionRowText, { color: themeColors.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        isVisible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      {/* Add to Playlist Modal */}
      {currentSong && (
        <AddToPlaylistModal
          isVisible={showAddToPlaylistModal}
          onClose={() => setShowAddToPlaylistModal(false)}
          songId={currentSong.id}
          songTitle={currentSong.title}
          songArtist={currentSong.artist}
          songCover={currentSong.coverUrl}
        />
      )}
      
      {/* Premium Gate Modal */}
      <PremiumGate
        feature="skip"
        visible={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
      />
    </>
  );
};

export default PlayBar;
