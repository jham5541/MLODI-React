import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface Song {
  id: string;
  title: string;
  album: string;
  duration: number;
  coverUrl: string;
  playCount: number;
  price?: number;
  isPlaying?: boolean;
}

interface PopularSongsProps {
  artistId: string;
  artistName?: string;
  limit?: number;
}

export default function PopularSongs({
  artistId,
  artistName,
  limit = 10,
}: PopularSongsProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [songs, setSongs] = useState<Song[]>([]);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockSongs: Song[] = [
      {
        id: '1',
        title: 'Summer Nights',
        album: 'Golden Hour',
        duration: 195,
        coverUrl: 'https://picsum.photos/200/200?random=1',
        playCount: 2500000,
        price: 1.99,
      },
      {
        id: '2',
        title: 'Electric Dreams',
        album: 'Neon City',
        duration: 208,
        coverUrl: 'https://picsum.photos/200/200?random=2',
        playCount: 1800000,
        price: 1.99,
      },
      {
        id: '3',
        title: 'Midnight Drive',
        album: 'Golden Hour',
        duration: 183,
        coverUrl: 'https://picsum.photos/200/200?random=3',
        playCount: 1200000,
        price: 1.99,
      },
      {
        id: '4',
        title: 'Ocean Waves',
        album: 'Serenity',
        duration: 222,
        coverUrl: 'https://picsum.photos/200/200?random=4',
        playCount: 950000,
      },
      {
        id: '5',
        title: 'City Lights',
        album: 'Neon City',
        duration: 176,
        coverUrl: 'https://picsum.photos/200/200?random=5',
        playCount: 780000,
        price: 1.99,
      },
    ];

    setSongs(mockSongs.slice(0, limit));
  }, [artistId, limit]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handlePlayPause = (songId: string) => {
    if (playingSongId === songId) {
      setPlayingSongId(null);
    } else {
      setPlayingSongId(songId);
    }
  };

  const handlePurchase = (song: Song) => {
    Alert.alert(
      'Purchase Song',
      `Purchase "${song.title}" for $${song.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => console.log('Purchase:', song.id) },
      ]
    );
  };

  const handleShare = (song: Song) => {
    Alert.alert('Share', `Share "${song.title}" by ${artistName}`);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
    },
    viewAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: themeColors.primary + '20',
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.primary,
    },
    songItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    rankContainer: {
      width: 24,
      alignItems: 'center',
      marginRight: 12,
    },
    rank: {
      fontSize: 14,
      fontWeight: '700',
      color: themeColors.textSecondary,
    },
    coverImage: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 12,
    },
    songInfo: {
      flex: 1,
      marginRight: 8,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    songDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    albumName: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    playCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    separator: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: themeColors.textSecondary,
    },
    duration: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginRight: 12,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    priceButton: {
      backgroundColor: themeColors.success + '20',
      borderColor: themeColors.success,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    priceText: {
      fontSize: 10,
      fontWeight: '600',
      color: themeColors.success,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isPlaying = playingSongId === item.id;
    const isLastItem = index === songs.length - 1;

    return (
      <View style={[styles.songItem, isLastItem && styles.lastItem]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rank}>{index + 1}</Text>
        </View>

        <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />

        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.songDetails}>
            <Text style={styles.albumName} numberOfLines={1}>
              {item.album}
            </Text>
            <View style={styles.separator} />
            <Text style={styles.playCount}>
              {formatNumber(item.playCount)} plays
            </Text>
          </View>
        </View>

        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayPause(item.id)}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              color={themeColors.background}
            />
          </TouchableOpacity>

          {item.price && (
            <TouchableOpacity
              style={[styles.actionButton, styles.priceButton]}
              onPress={() => handlePurchase(item)}
            >
              <Text style={styles.priceText}>${item.price}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={14} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (songs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Popular Songs</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No songs available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Songs</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {songs.map((item, index) => (
        <View key={item.id}>
          {renderSongItem({ item, index })}
        </View>
      ))}
    </View>
  );
}
