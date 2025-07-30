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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';
import { Song as MusicSong } from '../../types/music';
import { RootStackParamList } from '../../navigation/AppNavigator';

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

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function PopularSongs({
  artistId,
  artistName,
  limit = 10,
}: PopularSongsProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong, currentSong, isPlaying } = usePlay();
  const navigation = useNavigation<NavigationProp>();
  const [songs, setSongs] = useState<Song[]>([]);

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

  const handlePlayPause = (song: Song) => {
    // Convert local song format to MusicSong format
    const musicSong: MusicSong = {
      id: song.id,
      title: song.title,
      artist: artistName || 'Unknown Artist',
      artistId: artistId,
      album: song.album,
      coverUrl: song.coverUrl,
      duration: song.duration,
      audioUrl: '', // Would be populated from API
    };

    // Create playlist from all songs
    const playlist: MusicSong[] = songs.map(s => ({
      id: s.id,
      title: s.title,
      artist: artistName || 'Unknown Artist',
      artistId: artistId,
      album: s.album,
      coverUrl: s.coverUrl,
      duration: s.duration,
      audioUrl: '',
    }));

    playSong(musicSong, playlist);
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

  const handleViewAll = () => {
    navigation.navigate('ArtistSongs', {
      artistId,
      artistName: artistName || 'Unknown Artist',
    });
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
      paddingVertical: 14,
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
      marginBottom: 4,
      lineHeight: 20,
    },
    songDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    albumName: {
      fontSize: 13,
      color: themeColors.textSecondary,
      lineHeight: 16,
    },
    playCount: {
      fontSize: 13,
      color: themeColors.textSecondary,
      lineHeight: 16,
    },
    separator: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: themeColors.textSecondary,
    },
    duration: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginRight: 16,
      fontWeight: '500',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
      backgroundColor: themeColors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
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
    const isCurrentlyPlaying = currentSong?.id === item.id && isPlaying;
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
            onPress={() => handlePlayPause(item)}
          >
            <Ionicons
              name={isCurrentlyPlaying ? 'pause' : 'play'}
              size={16}
              color={themeColors.background}
            />
          </TouchableOpacity>

          {item.price && (
            <TouchableOpacity
              style={[styles.actionButton, styles.priceButton]}
              onPress={() => handlePurchase(item)}
            >
              <Text style={styles.priceText}>BUY</Text>
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
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
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
