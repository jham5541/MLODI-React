import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { usePlay } from '../context/PlayContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Song as MusicSong } from '../types/music';

interface Song {
  id: string;
  title: string;
  album: string;
  duration: number;
  coverUrl: string;
  playCount: number;
  price?: number;
  releaseDate: string;
}

type ArtistSongsRouteProp = RouteProp<RootStackParamList, 'ArtistSongs'>;
type ArtistSongsNavigationProp = StackNavigationProp<RootStackParamList, 'ArtistSongs'>;

interface Props {
  route: ArtistSongsRouteProp;
  navigation: ArtistSongsNavigationProp;
}

export default function ArtistSongsScreen({ route, navigation }: Props) {
  const { artistId, artistName } = route.params;
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong, currentSong, isPlaying } = usePlay();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical'>('popular');

  useEffect(() => {
    loadSongs();
  }, [artistId, sortBy]);

  const loadSongs = async () => {
    setLoading(true);
    
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
        releaseDate: '2023-08-15',
      },
      {
        id: '2',
        title: 'Electric Dreams',
        album: 'Neon City',
        duration: 208,
        coverUrl: 'https://picsum.photos/200/200?random=2',
        playCount: 1800000,
        price: 1.99,
        releaseDate: '2022-11-20',
      },
      {
        id: '3',
        title: 'Midnight Drive',
        album: 'Golden Hour',
        duration: 183,
        coverUrl: 'https://picsum.photos/200/200?random=3',
        playCount: 1200000,
        price: 1.99,
        releaseDate: '2023-08-15',
      },
      {
        id: '4',
        title: 'Ocean Waves',
        album: 'Serenity',
        duration: 222,
        coverUrl: 'https://picsum.photos/200/200?random=4',
        playCount: 950000,
        releaseDate: '2021-05-10',
      },
      {
        id: '5',
        title: 'City Lights',
        album: 'Neon City',
        duration: 176,
        coverUrl: 'https://picsum.photos/200/200?random=5',
        playCount: 780000,
        price: 1.99,
        releaseDate: '2022-11-20',
      },
      {
        id: '6',
        title: 'Starlight',
        album: 'Golden Hour',
        duration: 201,
        coverUrl: 'https://picsum.photos/200/200?random=6',
        playCount: 650000,
        releaseDate: '2023-08-15',
      },
      {
        id: '7',
        title: 'Moonbeam',
        album: 'Serenity',
        duration: 189,
        coverUrl: 'https://picsum.photos/200/200?random=7',
        playCount: 520000,
        releaseDate: '2021-05-10',
      },
      {
        id: '8',
        title: 'Digital Heart',
        album: 'Neon City',
        duration: 214,
        coverUrl: 'https://picsum.photos/200/200?random=8',
        playCount: 445000,
        price: 1.99,
        releaseDate: '2022-11-20',
      },
      {
        id: '9',
        title: 'Golden Dawn',
        album: 'Golden Hour',
        duration: 196,
        coverUrl: 'https://picsum.photos/200/200?random=9',
        playCount: 380000,
        releaseDate: '2023-08-15',
      },
      {
        id: '10',
        title: 'Peace Within',
        album: 'Serenity',
        duration: 234,
        coverUrl: 'https://picsum.photos/200/200?random=10',
        playCount: 290000,
        releaseDate: '2021-05-10',
      },
    ];

    // Sort songs based on selected criteria
    let sortedSongs = [...mockSongs];
    switch (sortBy) {
      case 'popular':
        sortedSongs.sort((a, b) => b.playCount - a.playCount);
        break;
      case 'recent':
        sortedSongs.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        break;
      case 'alphabetical':
        sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setSongs(sortedSongs);
    setLoading(false);
  };

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

  const SortButton = ({ type, label }: { type: typeof sortBy; label: string }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === type && styles.activeSortButton
      ]}
      onPress={() => setSortBy(type)}
    >
      <Text style={[
        styles.sortButtonText,
        sortBy === type && styles.activeSortButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentlyPlaying = currentSong?.id === item.id && isPlaying;

    return (
      <View style={styles.songItem}>
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
    },
    sortContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    sortButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeSortButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    sortButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    activeSortButtonText: {
      color: 'white',
    },
    listContainer: {
      flex: 1,
    },
    songItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '30',
    },
    rankContainer: {
      width: 32,
      alignItems: 'center',
      marginRight: 12,
    },
    rank: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.textSecondary,
    },
    coverImage: {
      width: 52,
      height: 52,
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={activeTheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>All Songs</Text>
            <Text style={styles.subtitle}>{artistName}</Text>
          </View>
        </View>

        <View style={styles.sortContainer}>
          <SortButton type="popular" label="Popular" />
          <SortButton type="recent" label="Recent" />
          <SortButton type="alphabetical" label="A-Z" />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Loading songs...</Text>
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={64} color={themeColors.textSecondary} />
          <Text style={styles.emptyText}>No songs found</Text>
        </View>
      ) : (
        <FlatList
          style={styles.listContainer}
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}
