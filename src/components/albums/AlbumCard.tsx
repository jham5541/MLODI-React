import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Album } from '../../types/music';

interface AlbumCardProps {
  album: Album;
  onPress?: () => void;
  viewMode?: 'grid' | 'list';
}

export default function AlbumCard({ album, onPress, viewMode = 'grid' }: AlbumCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  const hasNFTTracks = album.songs.some(song => song.tokenMetadata);

  const gridStyles = StyleSheet.create({
    container: {
      width: 160,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      marginRight: 12,
      marginBottom: 16,
    },
    image: {
      width: '100%',
      height: 136,
      borderRadius: 8,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    year: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    trackCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    nftBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    nftText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
    },
  });

  const listStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      alignItems: 'center',
    },
    image: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
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
      gap: 12,
    },
    year: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    trackCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    nftBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    nftText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
    },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const styles = viewMode === 'grid' ? gridStyles : listStyles;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: album.coverUrl }}
          style={styles.image}
          defaultSource={{ uri: 'https://via.placeholder.com/160x136?text=♪' }}
        />
        {hasNFTTracks && (
          <View style={styles.nftBadge}>
            <Text style={styles.nftText}>NFT</Text>
          </View>
        )}
      </View>
      
      <View style={viewMode === 'list' ? styles.content : undefined}>
        <Text style={styles.title} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {album.artist}
        </Text>
        
        <View style={styles.metadata}>
          <Text style={styles.year}>{formatDate(album.releaseDate)}</Text>
          <Text style={styles.trackCount}>
            {album.songs.length} track{album.songs.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {viewMode === 'list' && (
        <View style={styles.actions}>
          {hasNFTTracks && (
            <View style={styles.nftBadge}>
              <Text style={styles.nftText}>NFT</Text>
            </View>
          )}
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}