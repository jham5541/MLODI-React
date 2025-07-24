import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Slider } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

export default function Player() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const {
    isPlaying,
    currentTrack,
    position,
    duration,
    isLoading,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
  } = useAudioPlayer();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: themeColors.surface,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    trackInfo: {
      marginBottom: 8,
    },
    trackTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    trackArtist: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    progressContainer: {
      marginBottom: 12,
    },
    slider: {
      height: 20,
      marginHorizontal: -16,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    timeText: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButton: {
      marginHorizontal: 12,
      padding: 8,
    },
    playButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={(value) => seekTo(value)}
          minimumTrackTintColor={themeColors.primary}
          maximumTrackTintColor={themeColors.border}
          thumbTintColor={themeColors.primary}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={skipToPrevious}
        >
          <Ionicons
            name="play-skip-back"
            size={24}
            color={themeColors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          <Ionicons
            name={isLoading ? 'hourglass' : isPlaying ? 'pause' : 'play'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={skipToNext}
        >
          <Ionicons
            name="play-skip-forward"
            size={24}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}