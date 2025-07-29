import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Song, Artist } from '../../types/music';
import { formatDuration } from '../../utils/uiHelpers';
import { usePlay } from '../../context/PlayContext';
import { likesService } from '../../services/likesService';
import { supabase } from '../../lib/supabase/client';
import PurchaseModal from '../purchase/PurchaseModal';
import { purchaseService } from '../../services/purchaseService';

interface TrendingListProps {
  songs: Song[];
  artists: Artist[];
  onSongPress?: (song: Song) => void;
  onArtistPress?: (artist: Artist) => void;
  showType?: 'songs' | 'artists' | 'both';
  onSeeAllSongs?: () => void;
  onSeeAllArtists?: () => void;
}

export default function TrendingList({ 
  songs, 
  artists, 
  onSongPress, 
  onArtistPress,
  showType = 'both',
  onSeeAllSongs,
  onSeeAllArtists
}: TrendingListProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();
  const { playSong, currentSong, isPlaying } = usePlay();
  
  const [likeStatuses, setLikeStatuses] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedSongForPurchase, setSelectedSongForPurchase] = useState<Song | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (songs.length > 0) {
      loadLikeData();
    }

    // Add Supabase authentication fallback
    const checkSupabaseUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Supabase user check failed:', error);
      }
      if (!user) {
        console.warn('No Supabase user found, ensure Supabase auth is properly configured.');
      }
    };

    checkSupabaseUser();
  }, [songs]);

  const loadLikeData = async () => {
    try {
      const songIds = songs.map(song => song.id);
      const [statuses, counts] = await Promise.all([
        likesService.getLikeStatuses(songIds, 'song'),
        likesService.getLikeCounts(songIds, 'song')
      ]);
      setLikeStatuses(statuses);
      setLikeCounts(counts);
    } catch (error) {
          console.warn('Failed to load like data from Supabase:', error);
          // Fallback to local storage
          const statuses = await likesService.getLikeStatuses(songs.map(song => song.id), 'song');
          const counts = await likesService.getLikeCounts(songs.map(song => song.id), 'song');
          setLikeStatuses(statuses);
          setLikeCounts(counts);
    }
  };

  const handleSongArtistPress = (artistName: string) => {
    // Navigate to artist profile using artist name as ID
    // In a real app, you'd have the actual artist ID
    navigation.navigate('ArtistProfile', { artistId: artistName });
  };

  const handlePlayPress = (song: Song, index: number) => {
    if (currentSong?.id === song.id && isPlaying) {
      // Song is already playing, call the existing onSongPress if available
      onSongPress?.(song);
    } else {
      // Play the song with the current song list as playlist
      playSong(song, songs);
      onSongPress?.(song);
    }
  };

  const handleLikePress = async (songId: string) => {
    console.log('Like button pressed for song:', songId);
    try {
      const newLikeStatus = await likesService.toggleLike(songId, 'song');
      console.log('New like status:', newLikeStatus);
      
      // Update like status
      setLikeStatuses(prev => {
        const updated = {
          ...prev,
          [songId]: newLikeStatus
        };
        console.log('Updated like statuses:', updated);
        return updated;
      });
      
      // Update like count
      setLikeCounts(prev => {
        const updated = {
          ...prev,
          [songId]: (prev[songId] || 0) + (newLikeStatus ? 1 : -1)
        };
        console.log('Updated like counts:', updated);
        return updated;
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
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
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    seeAllText: {
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
    songActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
    },
    artistItem: {
      alignItems: 'center',
      paddingHorizontal: 12,
      marginRight: 16,
    },
    artistCover: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 8,
    },
    artistName: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 2,
    },
    artistFollowers: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    likeCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 4,
      minWidth: 20,
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

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const isLiked = likeStatuses[item.id] || false;
    const likeCount = likeCounts[item.id] || 0;
    const isPurchased = purchaseService.isPurchased(item.id);
    const purchaseCount = purchaseService.getPurchaseCount(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.songItem,
          isPurchased && styles.songItemPurchased
        ]} 
        onPress={() => onSongPress?.(item)}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
        
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity onPress={() => handleSongArtistPress(item.artist)}>
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

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity style={styles.artistItem} onPress={() => onArtistPress?.(item)}>
      <Image source={{ uri: item.coverUrl }} style={styles.artistCover} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.isVerified && (
          <Ionicons 
            name="checkmark-circle" 
            size={14} 
            color={themeColors.primary} 
            style={styles.verifiedIcon}
          />
        )}
      </View>
      <Text style={styles.artistFollowers}>
        {formatFollowers(item.followers)} followers
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {(showType === 'songs' || showType === 'both') && songs.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Songs</Text>
            <TouchableOpacity onPress={onSeeAllSongs}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View>
            {songs.slice(0, 5).map((item, index) => (
              <View key={item.id}>
                {renderSongItem({ item, index })}
              </View>
            ))}
          </View>
        </>
      )}
      
      {(showType === 'artists' || showType === 'both') && artists.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Artists</Text>
            <TouchableOpacity onPress={onSeeAllArtists}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {artists.slice(0, 10).map((item) => (
              <View key={item.id}>
                {renderArtistItem({ item })}
              </View>
            ))}
          </ScrollView>
        </>
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
          artist={selectedSongForPurchase.artist}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </View>
  );
}
