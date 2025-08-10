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
import { purchaseService } from '../services/purchaseService';
import PurchaseModal from '../components/purchase/PurchaseModal';
import { sampleSongs } from '../data/sampleData';

interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  duration: number;
  coverUrl: string;
  playCount?: number;
  popularity?: number;
  price?: number;
  releaseDate?: string;
  audioUrl?: string;
  supply?: {
    total: number;
    available: number;
  };
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
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedSongForPurchase, setSelectedSongForPurchase] = useState<Song | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadSongs();
  }, [artistId, sortBy]);

  const loadSongs = async () => {
    setLoading(true);
    
    // Get songs from sampleData for this artist
    const artistSongs = sampleSongs.filter(song => song.artistId === artistId);

    // Sort songs based on selected criteria
    let sortedSongs = [...artistSongs];
    switch (sortBy) {
      case 'popular':
        sortedSongs.sort((a, b) => (b.popularity || b.playCount || 0) - (a.popularity || a.playCount || 0));
        break;
      case 'recent':
        sortedSongs.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        });
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

  const handleBuyPress = (song: Song) => {
    setSelectedSongForPurchase(song);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseComplete = () => {
    setRefreshKey(prev => prev + 1); // Force re-render to show updated purchase status
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
    const isPurchased = purchaseService.isPurchased(item.id);
    const purchaseCount = purchaseService.getPurchaseCount(item.id);

    return (
      <View style={[
        styles.songItem,
        isPurchased && styles.songItemPurchased
      ]}>
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
              {formatNumber(item.popularity || item.playCount || 0)} plays
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

          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={(e) => {
                e.stopPropagation();
                handleBuyPress(item);
              }}
            >
              <Text style={styles.buyButtonText}>BUY</Text>
            </TouchableOpacity>
            
            {purchaseCount > 0 && (
              <View style={styles.purchaseCount}>
                <Text style={styles.purchaseCountText}>{purchaseCount}</Text>
              </View>
            )}
          </View>

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
    buyButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8,
      minWidth: 40,
      alignItems: 'center',
    },
    buyButtonText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
    songItemPurchased: {
      backgroundColor: themeColors.primary + '10',
      borderWidth: 1,
      borderColor: themeColors.primary + '30',
    },
    purchaseCount: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: themeColors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: themeColors.surface,
      zIndex: 1,
    },
    purchaseCountText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
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
      
      {selectedSongForPurchase && (
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={() => {
            setPurchaseModalVisible(false);
            setSelectedSongForPurchase(null);
          }}
          songId={selectedSongForPurchase.id}
          songTitle={selectedSongForPurchase.title}
          artist={selectedSongForPurchase.artist || artistName || 'Unknown Artist'}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </SafeAreaView>
  );
}
