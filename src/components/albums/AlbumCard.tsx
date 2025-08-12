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

  const styles = StyleSheet.create({
    // Base styles shared between grid and list views
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: viewMode === 'grid' ? 16 : 12,
      ...(viewMode === 'grid' ? {
        width: 160,
        marginRight: 12,
      } : {
        flexDirection: 'row',
        alignItems: 'center',
      }),
    },
    image: {
      borderRadius: 8,
      ...(viewMode === 'grid' ? {
        width: '100%',
        height: 136,
        marginBottom: 12,
      } : {
        width: 60,
        height: 60,
        marginRight: 12,
      }),
    },
    content: {
      flex: viewMode === 'list' ? 1 : undefined,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: viewMode === 'grid' ? 4 : 2,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: viewMode === 'grid' ? 4 : 2,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      ...(viewMode === 'grid' ? {
        justifyContent: 'space-between',
        marginTop: 8,
      } : {
        gap: 12,
      }),
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
      ...(viewMode === 'grid' ? {
        position: 'absolute',
        top: 16,
        right: 16,
      } : {}),
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