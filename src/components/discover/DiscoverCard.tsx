import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Song } from '../../types/music';
import { formatDuration } from '../../utils/uiHelpers';

interface DiscoverCardProps {
  song: Song;
  onPress?: () => void;
  onPlayPreview?: (song: Song) => void;
  size?: 'small' | 'medium' | 'large';
}

const { width } = Dimensions.get('window');
const cardMargin = 8;
const cardWidth = (width - 32 - cardMargin * 2) / 2; // 2 columns with padding

export default function DiscoverCard({ 
  song, 
  onPress, 
  onPlayPreview,
  size = 'medium' 
}: DiscoverCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong, currentTrack, isPlaying } = useAudioPlayer();

  const isCurrentSong = currentTrack?.id === song.id;

  const handlePlay = async () => {
    try {
      if (onPlayPreview) {
        onPlayPreview(song);
      } else {
        await playSong(song);
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return { width: cardWidth * 0.8, height: cardWidth * 0.8 };
      case 'large':
        return { width: cardWidth * 1.2, height: cardWidth * 1.2 };
      default:
        return { width: cardWidth, height: cardWidth };
    }
  };

  const cardSize = getCardSize();

  const styles = StyleSheet.create({
    container: {
      width: cardSize.width,
      marginHorizontal: cardMargin / 2,
      marginVertical: 8,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: cardSize.height * 0.7,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0,
    },
    overlayVisible: {
      opacity: 1,
    },
    playButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    currentSongIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: themeColors.primary,
    },
    nftBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    nftText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
    },
    popularityBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    popularityText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
      marginLeft: 2,
    },
    content: {
      padding: 12,
      height: cardSize.height * 0.3,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: isCurrentSong ? themeColors.primary : themeColors.text,
      marginBottom: 4,
      numberOfLines: 1,
    },
    artist: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 4,
      numberOfLines: 1,
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    duration: {
      fontSize: 11,
      color: themeColors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 4,
      marginLeft: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: song.coverUrl }}
          style={styles.image}
          defaultSource={{ uri: 'https://via.placeholder.com/300x300?text=♪' }}
        />
        
        <TouchableOpacity 
          style={[styles.overlay, isCurrentSong && styles.overlayVisible]} 
          onPress={handlePlay}
          activeOpacity={0.8}
        >
          <View style={styles.playButton}>
            <Ionicons
              name={isCurrentSong && isPlaying ? 'pause' : 'play'}
              size={24}
              color="white"
            />
          </View>
        </TouchableOpacity>

        {isCurrentSong && <View style={styles.currentSongIndicator} />}
        
        {song.tokenMetadata && (
          <View style={styles.nftBadge}>
            <Text style={styles.nftText}>NFT</Text>
          </View>
        )}

        {song.popularity && song.popularity > 70 && (
          <View style={styles.popularityBadge}>
            <Ionicons name="trending-up" size={10} color="white" />
            <Text style={styles.popularityText}>{song.popularity}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
        
        <View style={styles.metadata}>
          <Text style={styles.duration}>
            {formatDuration(song.duration)}
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons 
                name="heart-outline" 
                size={16} 
                color={themeColors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons 
                name="ellipsis-horizontal" 
                size={16} 
                color={themeColors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
