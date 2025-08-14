import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';
import { Song as MusicSong } from '../../types/music';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { purchaseService } from '../../services/purchaseService';
import { demoSongs } from '../../data/demoMusic';
import { supabase } from '../../lib/supabase/client';
import PurchaseModal from '../purchase/PurchaseModal';

interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  coverUrl: string;
  duration: number;
  audioUrl: string;
  supply?: {
    total: number;
    available: number;
  };
  popularity?: number;
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
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedSongForPurchase, setSelectedSongForPurchase] = useState<Song | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularSongs();
  }, [artistId, limit]);

  const fetchPopularSongs = async () => {
    try {
      setLoading(true);
      
      // Fetch tracks from the database for the specific artist
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist_id,
          description,
          duration,
          audio_url,
          cover_url,
          genre,
          play_count,
          created_at,
          profiles!inner(
            id,
            display_name,
            username
          )
        `)
        .eq('artist_id', artistId)
        .order('play_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching tracks:', error);
        // Fall back to demo songs if there's an error
        const artistSongs = demoSongs
          .filter(song => song.artistId === artistId)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, limit);
        setSongs(artistSongs);
      } else if (tracks && tracks.length > 0) {
        // Transform the data to match our Song interface
        const transformedSongs = tracks.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.profiles?.display_name || artistName || 'Unknown Artist',
          artistId: track.artist_id,
          album: 'Album', // Default album name
          coverUrl: track.cover_url || 'https://picsum.photos/400/400?random=' + Math.random(),
          duration: track.duration || 240,
          audioUrl: track.audio_url || '',
          supply: {
            total: 1000,
            available: Math.floor(Math.random() * 500) + 500
          },
          popularity: track.play_count || 0
        }));
        setSongs(transformedSongs);
      } else {
        // If no tracks in database, use demo songs
        const artistSongs = demoSongs
          .filter(song => song.artistId === artistId)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, limit);
        setSongs(artistSongs);
      }
    } catch (error) {
      console.error('Error in fetchPopularSongs:', error);
      // Fall back to demo songs
      const artistSongs = demoSongs
        .filter(song => song.artistId === artistId)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit);
      setSongs(artistSongs);
    } finally {
      setLoading(false);
    }
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
      audioUrl: song.audioUrl,
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
      audioUrl: s.audioUrl,
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

  const handleViewAll = () => {
    navigation.navigate('ArtistSongs', {
      artistId,
      artistName: artistName || 'Unknown Artist',
    });
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    viewAllText: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: '500',
    },
    songItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      marginBottom: 8,
      marginHorizontal: 16,
      borderRadius: 12,
    },
    songItemPurchased: {
      backgroundColor: themeColors.primary + '20',
      borderWidth: 1,
      borderColor: themeColors.primary + '40',
    },
    rankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rankText: {
      fontSize: 12,
      color: 'white',
      fontWeight: 'bold',
    },
    songCover: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 12,
    },
    songInfo: {
      flex: 1,
      marginRight: 12,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    songArtist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    songMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    songDuration: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginRight: 8,
    },
    popularityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    popularityText: {
      fontSize: 10,
      color: themeColors.primary,
      fontWeight: '600',
      marginLeft: 2,
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
    },
    purchaseCountText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      marginHorizontal: 16,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });


  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const isPurchased = purchaseService.isPurchased(item.id);
    const purchaseCount = purchaseService.getPurchaseCount(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.songItem,
          isPurchased && styles.songItemPurchased
        ]}
        onPress={() => handlePlayPause(item)}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
        
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist || artistName || 'Unknown Artist'}
          </Text>
          <View style={styles.songMeta}>
            <Text style={styles.songDuration}>
              {formatDuration(item.duration)}
            </Text>
            {item.popularity && (
              <View style={styles.popularityBadge}>
                <Ionicons name="trending-up" size={10} color={themeColors.primary} />
                <Text style={styles.popularityText}>{formatNumber(item.popularity)}</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={{ marginLeft: 8 }} 
          onPress={(e) => {
            e.stopPropagation();
            handlePlayPause(item);
          }}
        >
          <Ionicons 
            name={isCurrentSong && isPlaying ? "pause" : "play"} 
            size={20} 
            color={themeColors.primary} 
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
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Popular Songs</Text>
        </View>
        <View style={[styles.emptyState, { paddingVertical: 60 }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading songs...</Text>
        </View>
      </View>
    );
  }

  if (songs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Popular Songs</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={48} color={themeColors.textSecondary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>No songs available yet</Text>
          <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>Check back soon for new music!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Songs</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderSongItem({ item, index })}
        scrollEnabled={false}
      />
      
      {selectedSongForPurchase && (
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={() => {
            setPurchaseModalVisible(false);
            setSelectedSongForPurchase(null);
          }}
          songId={selectedSongForPurchase.id}
          songTitle={selectedSongForPurchase.title}
          artist={selectedSongForPurchase.artist}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </View>
  );
}
