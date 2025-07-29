import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types/music';
import { formatDuration } from '../utils/uiHelpers';
import { usePlay } from '../context/PlayContext';
import { likesService } from '../services/likesService';
import { useMusicStore } from '../store/musicStore';
import { useNavigation } from '@react-navigation/native';
import { trendingSongs as sampleTrendingSongs } from '../data/sampleData';
import PurchaseModal from '../components/purchase/PurchaseModal';
import { purchaseService } from '../services/purchaseService';

export default function TrendingAllSongs() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();
  const { playSong, currentSong, isPlaying } = usePlay();
  const { trendingSongs: storeTrendingSongs, isLoadingTrending, loadTrendingSongs } = useMusicStore();
  
  const [likeStatuses, setLikeStatuses] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedSongForPurchase, setSelectedSongForPurchase] = useState<Song | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use store songs if available, otherwise fall back to sample data
  const trendingSongs = storeTrendingSongs.length > 0 ? storeTrendingSongs : sampleTrendingSongs;
  
  // Debug logging
  console.log('TrendingAllSongs - Store songs count:', storeTrendingSongs.length);
  console.log('TrendingAllSongs - Sample songs count:', sampleTrendingSongs.length);
  console.log('TrendingAllSongs - Final songs count:', trendingSongs.length);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await loadTrendingSongs();
    } catch (error) {
      console.error('Failed to load trending songs:', error);
    }
  };
  
  // Load like data whenever trendingSongs changes
  useEffect(() => {
    if (trendingSongs.length > 0) {
      loadLikeData();
    }
  }, [trendingSongs]);

  const loadLikeData = async () => {
    try {
      const songIds = trendingSongs.map(song => song.id);
      const statuses = await likesService.getLikeStatuses(songIds, 'song');
      setLikeStatuses(statuses);
    } catch (error) {
      console.warn('Failed to load like data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handlePlayPress = (song: Song, index: number) => {
    if (currentSong?.id === song.id && isPlaying) {
      // Toggle pause
    } else {
      playSong(song, trendingSongs);
    }
  };

  const handleLikePress = async (songId: string) => {
    try {
      const newLikeStatus = await likesService.toggleLike(songId, 'song');
      setLikeStatuses(prev => ({
        ...prev,
        [songId]: newLikeStatus
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleArtistPress = (artistName: string) => {
    navigation.navigate('ArtistProfile', { artistId: artistName });
  };

  const handleBuyPress = (song: Song) => {
    setSelectedSongForPurchase(song);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseComplete = () => {
    setRefreshKey(prev => prev + 1); // Force re-render to show updated purchase status
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
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
    rankBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
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
    songActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
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
      backgroundColor: themeColors.primary + '20', // Transparent purple
      borderWidth: 1,
      borderColor: themeColors.primary + '40',
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
  });

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const isLiked = likeStatuses[item.id] || false;
    const isPurchased = purchaseService.isPurchased(item.id);
    const purchaseCount = purchaseService.getPurchaseCount(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.songItem,
          isPurchased && styles.songItemPurchased
        ]}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
        
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity onPress={() => handleArtistPress(item.artist)}>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </TouchableOpacity>
          <View style={styles.songMeta}>
            <Text style={styles.songDuration}>
              {formatDuration(item.duration)}
            </Text>
            {item.popularity && (
              <View style={styles.popularityBadge}>
                <Ionicons name="trending-up" size={10} color={themeColors.primary} />
                <Text style={styles.popularityText}>{item.popularity}</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={{ marginLeft: 8 }} 
          onPress={(e) => {
            e.stopPropagation();
            handlePlayPress(item, index);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trending Songs</Text>
      </View>
      
      <FlatList
        data={trendingSongs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
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
