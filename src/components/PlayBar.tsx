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
  ScrollView
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { usePlayTracking } from '../context/PlayTrackingContext';
import { formatDuration } from '../utils/uiHelpers';
import { Song } from '../types/music';
import { musicService } from '../services/musicService';
import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';
import AddToPlaylistModal from './playlists/AddToPlaylistModal';

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

const PlayBar: React.FC<PlayBarProps> = ({
  currentSong,
  isPlaying,
  isVisible,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
  onExpand,
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
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isVisible, currentSong]);

  // Simulate progress (in a real app, this would come from audio player)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const totalSeconds = currentSong.duration; // duration is already in seconds
          const newTime = prev + 1;
          setProgress((newTime / totalSeconds) * 100);
          
          // Update play tracking with current progress
          updateProgress(newTime);
          
          return newTime >= totalSeconds ? 0 : newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 90,
      left: 16,
      right: 16,
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
      paddingHorizontal: 32,
      paddingTop: 40,
      paddingBottom: 50,
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
    },
    modalControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    modalControlButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
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
    },
  });

  const handleProgressChange = (value: number) => {
    const totalSeconds = currentSong.duration; // duration is already in seconds
    const newTime = (value / 100) * totalSeconds;
    setCurrentTime(Math.floor(newTime));
    setProgress(value);
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
          onPress={() => setExpanded(true)}
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
              <Text style={styles.artistName} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
                onPrevious();
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
                onNext();
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
        onRequestClose={() => setExpanded(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={() => setExpanded(false)}
            >
              <Ionicons name="chevron-down" size={28} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: themeColors.text }}>
              Now Playing
            </Text>
            <TouchableOpacity style={styles.modalHeaderButton}>
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
                  onPress={onPrevious}
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
                  onPress={onNext}
                >
                  <Ionicons name="play-skip-forward" size={26} color={themeColors.text} />
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
    </>
  );
};

export default PlayBar;
