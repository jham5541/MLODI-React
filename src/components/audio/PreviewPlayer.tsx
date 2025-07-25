import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import WaveformVisualizer from './WaveformVisualizer';
import { Audio } from 'expo-av';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  hasFullAccess?: boolean;
  previewStart?: number;
  previewDuration?: number;
}

interface PreviewPlayerProps {
  track: Track;
  visible: boolean;
  onClose: () => void;
  onPurchase?: () => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
}

export default function PreviewPlayer({
  track,
  visible,
  onClose,
  onPurchase,
  onAddToPlaylist,
  onShare,
}: PreviewPlayerProps) {
  const { colors } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 0);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const progressInterval = useRef<NodeJS.Timeout>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      initializeAudio();
      animateIn();
    } else {
      cleanup();
      animateOut();
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [visible]);

  useEffect(() => {
    if (isPlaying) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }
  }, [isPlaying]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const initializeAudio = async () => {
    try {
      setIsLoading(true);
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        {
          shouldPlay: false,
          isLooping: false,
          volume: volume,
          rate: playbackRate,
        }
      );

      newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setSound(newSound);
      
      // Set duration from track metadata or loaded audio
      setDuration(track.duration || 180);

    } catch (error) {
      console.error('Failed to initialize audio:', error);
      Alert.alert('Error', 'Failed to load audio preview');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(0);
        // Handle preview end logic
        if (!track.hasFullAccess && track.previewDuration) {
          showPurchasePrompt();
        }
      }
    }
  };

  const showPurchasePrompt = () => {
    Alert.alert(
      'Preview Ended',
      'Unlock the full track to continue listening',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Purchase', onPress: onPurchase },
      ]
    );
  };

  const handlePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleSeek = async (time: number) => {
    if (!sound) return;

    try {
      const seekTime = Math.max(0, Math.min(time, duration));
      await sound.setPositionAsync(seekTime * 1000);
      setCurrentTime(seekTime);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    if (!sound) return;

    try {
      await sound.setVolumeAsync(newVolume);
      setVolume(newVolume);
    } catch (error) {
      console.error('Volume error:', error);
    }
  };

  const handlePlaybackRateChange = async (rate: number) => {
    if (!sound) return;

    try {
      await sound.setRateAsync(rate, true);
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Playback rate error:', error);
    }
  };

  const startProgressTracking = () => {
    progressInterval.current = setInterval(() => {
      if (sound) {
        sound.getStatusAsync().then((status: any) => {
          if (status.isLoaded && status.positionMillis) {
            const newTime = status.positionMillis / 1000;
            setCurrentTime(newTime);
            
            // Auto-stop preview after preview duration
            if (!track.hasFullAccess && track.previewDuration && 
                newTime >= track.previewDuration) {
              handlePlayPause();
              showPurchasePrompt();
            }
          }
        });
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = undefined;
    }
  };

  const cleanup = async () => {
    stopProgressTracking();
    
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    fullscreenContainer: {
      width: '95%',
      height: '80%',
      maxWidth: undefined,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    fullscreenButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      marginLeft: 8,
    },
    trackInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    cover: {
      width: isFullscreen ? 200 : 120,
      height: isFullscreen ? 200 : 120,
      borderRadius: isFullscreen ? 100 : 60,
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: isFullscreen ? 24 : 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    artist: {
      fontSize: isFullscreen ? 16 : 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    previewBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    previewBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.background,
      textTransform: 'uppercase',
    },
    waveformContainer: {
      marginBottom: 24,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      gap: 20,
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    controlButton: {
      padding: 12,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    timeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    currentTime: {
      color: colors.primary,
      fontWeight: '600',
    },
    volumeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    volumeSlider: {
      flex: 1,
      height: 40,
    },
    speedContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 20,
    },
    speedButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeSpeedButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    speedButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    activeSpeedButtonText: {
      color: colors.background,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      gap: 6,
    },
    primaryActionButton: {
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    primaryActionButtonText: {
      color: colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.container,
            isFullscreen && styles.fullscreenContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              Audio Preview
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={() => setIsFullscreen(!isFullscreen)}
              >
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="musical-notes" size={48} color={colors.primary} />
              <Text style={styles.loadingText}>Loading audio preview...</Text>
            </View>
          ) : (
            <>
              <View style={styles.trackInfo}>
                <Image source={{ uri: track.coverUrl }} style={styles.cover} />
                <Text style={styles.title} numberOfLines={2}>
                  {track.title}
                </Text>
                <Text style={styles.artist}>{track.artist}</Text>
                {!track.hasFullAccess && (
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>
                      {track.previewDuration ? `${track.previewDuration}s Preview` : 'Preview Only'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.waveformContainer}>
                <WaveformVisualizer
                  audioUrl={track.audioUrl}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                  onPlay={handlePlayPause}
                  onPause={handlePlayPause}
                  height={isFullscreen ? 120 : 80}
                  showPlayButton={false}
                  style={{ backgroundColor: 'transparent' }}
                />
              </View>

              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(Math.max(0, currentTime - 10))}
                >
                  <Ionicons name="play-back" size={20} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={28}
                    color={colors.background}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(Math.min(duration, currentTime + 10))}
                >
                  <Ionicons name="play-forward" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {isFullscreen && (
                <>
                  <View style={styles.speedContainer}>
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                      <TouchableOpacity
                        key={speed}
                        style={[
                          styles.speedButton,
                          playbackRate === speed && styles.activeSpeedButton,
                        ]}
                        onPress={() => handlePlaybackRateChange(speed)}
                      >
                        <Text
                          style={[
                            styles.speedButtonText,
                            playbackRate === speed && styles.activeSpeedButtonText,
                          ]}
                        >
                          {speed}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.volumeContainer}>
                    <Ionicons
                      name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'}
                      size={20}
                      color={colors.textSecondary}
                    />
                    <View style={styles.volumeSlider}>
                      {/* Custom volume slider would go here */}
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${volume * 100}%` }]} />
                      </View>
                    </View>
                    <Text style={styles.timeText}>{Math.round(volume * 100)}%</Text>
                  </View>
                </>
              )}

              <View style={styles.actions}>
                {!track.hasFullAccess && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryActionButton]}
                    onPress={onPurchase}
                  >
                    <Ionicons name="card" size={16} color={colors.background} />
                    <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                      Purchase
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.actionButton} onPress={onAddToPlaylist}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.text} />
                  <Text style={styles.actionButtonText}>Add to Playlist</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                  <Ionicons name="share-outline" size={16} color={colors.text} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}