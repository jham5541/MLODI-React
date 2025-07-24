import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Song } from '../../types/music';

interface SongCardProps {
  song: Song;
  onPress?: () => void;
  showArtwork?: boolean;
}

export default function SongCard({ song, onPress, showArtwork = true }: SongCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong, currentTrack, isPlaying } = useAudioPlayer();

  const isCurrentSong = currentTrack?.id === song.id;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async () => {
    try {
      await playSong(song);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: isCurrentSong ? themeColors.primary + '20' : 'transparent',
      borderRadius: 8,
      marginBottom: 8,
    },
    artwork: {
      width: 50,
      height: 50,
      borderRadius: 6,
      marginRight: 12,
    },
    content: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isCurrentSong ? themeColors.primary : themeColors.text,
      marginBottom: 2,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    duration: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    nftBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    nftText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    menuButton: {
      padding: 8,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {showArtwork && (
        <Image
          source={{ uri: song.coverUrl }}
          style={styles.artwork}
          defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=♪' }}
        />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
        <View style={styles.metadata}>
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
          {song.tokenMetadata && (
            <View style={styles.nftBadge}>
              <Text style={styles.nftText}>NFT</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Ionicons
            name={isCurrentSong && isPlaying ? 'pause' : 'play'}
            size={18}
            color="white"
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={16} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}