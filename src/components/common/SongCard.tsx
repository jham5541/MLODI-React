import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';
import { Song } from '../../types/music';
import { formatDuration } from '../../utils/uiHelpers';

interface SongCardProps {
  song: Song;
  onPress?: () => void;
  showArtwork?: boolean;
}

export default function SongCard({ song, onPress, showArtwork = true }: SongCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong, currentSong, isPlaying } = usePlay();
  const navigation = useNavigation();

  const isCurrentSong = currentSong?.id === song.id;

  const handlePlay = () => {
    try {
      playSong(song, [song]);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const handleArtistPress = () => {
    // Navigate to artist profile - we'll use the artist name as ID for now
    // In a real app, you'd have an artistId field in the song object
    navigation.navigate('ArtistProfile', { artistId: song.artist });
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
        <TouchableOpacity onPress={handleArtistPress}>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </TouchableOpacity>
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