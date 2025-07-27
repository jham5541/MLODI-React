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
import { formatDuration } from '../utils/uiHelpers';
import { Song } from '../types/music';

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
  const [slideAnim] = useState(new Animated.Value(100));
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: repeat all, 2: repeat one
  const [volume, setVolume] = useState(75);

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
          return newTime >= totalSeconds ? 0 : newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

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
      alignItems: 'center',
      paddingHorizontal: 30,
      paddingTop: 40,
    },
    modalAlbumCover: {
      width: screenWidth - 80,
      height: screenWidth - 80,
      borderRadius: 20,
      marginBottom: 40,
    },
    modalSongTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalArtistName: {
      fontSize: 18,
      color: themeColors.textSecondary,
      marginBottom: 40,
      textAlign: 'center',
    },
    progressContainer: {
      width: '100%',
      marginBottom: 30,
    },
    progressSlider: {
      width: '100%',
      height: 40,
    },
    progressTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 5,
    },
    progressTimeText: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    modalControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 30,
    },
    modalControlButton: {
      padding: 15,
    },
    modalPlayButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalSecondaryControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 20,
    },
    modalSecondaryButton: {
      padding: 15,
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
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Album Cover */}
            <Image 
              source={{ uri: currentSong.coverUrl }} 
              style={styles.modalAlbumCover}
            />

            {/* Song Info */}
            <Text style={styles.modalSongTitle}>{currentSong.title}</Text>
            <Text style={styles.modalArtistName}>{currentSong.artist}</Text>

            {/* Progress Slider */}
            <View style={styles.progressContainer}>
              <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={100}
                value={progress}
                onValueChange={handleProgressChange}
                minimumTrackTintColor={themeColors.primary}
                maximumTrackTintColor={themeColors.border}
                thumbTintColor={themeColors.primary}
              />
              <View style={styles.progressTimeContainer}>
                <Text style={styles.progressTimeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.progressTimeText}>{currentSong.duration}</Text>
              </View>
            </View>

            {/* Main Controls */}
            <View style={styles.modalControls}>
              <TouchableOpacity 
                style={styles.modalControlButton}
                onPress={() => setShuffle(!shuffle)}
              >
                <Ionicons 
                  name="shuffle" 
                  size={24} 
                  color={shuffle ? themeColors.primary : themeColors.textSecondary} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalControlButton}
                onPress={onPrevious}
              >
                <Ionicons name="play-skip-back" size={32} color={themeColors.text} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalPlayButton}
                onPress={onPlayPause}
              >
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={32} 
                  color="white"
                  style={{ marginLeft: isPlaying ? 0 : 3 }}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalControlButton}
                onPress={onNext}
              >
                <Ionicons name="play-skip-forward" size={32} color={themeColors.text} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalControlButton}
                onPress={() => setRepeatMode((repeatMode + 1) % 3)}
              >
                <Ionicons 
                  name={getRepeatIcon()} 
                  size={24} 
                  color={repeatMode > 0 ? themeColors.primary : themeColors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Secondary Controls */}
            <View style={styles.modalSecondaryControls}>
              <TouchableOpacity style={styles.modalSecondaryButton}>
                <Ionicons name="share-outline" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={() => setIsLiked(!isLiked)}
              >
                <Ionicons 
                  name={isLiked ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isLiked ? themeColors.primary : themeColors.textSecondary} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalSecondaryButton}>
                <Ionicons name="list-outline" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default PlayBar;
