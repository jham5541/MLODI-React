import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Song, Artist } from '../../types/music';
import { formatDuration } from '../../utils/uiHelpers';

interface TrendingListProps {
  songs: Song[];
  artists: Artist[];
  onSongPress?: (song: Song) => void;
  onArtistPress?: (artist: Artist) => void;
  showType?: 'songs' | 'artists' | 'both';
}

export default function TrendingList({ 
  songs, 
  artists, 
  onSongPress, 
  onArtistPress,
  showType = 'both'
}: TrendingListProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();

  const handleSongArtistPress = (artistName: string) => {
    // Navigate to artist profile using artist name as ID
    // In a real app, you'd have the actual artist ID
    navigation.navigate('ArtistProfile', { artistId: artistName });
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
  });

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => onSongPress?.(item)}>
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
      
      <View style={styles.songActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="play-circle" size={24} color={themeColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
            <TouchableOpacity>
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
            <TouchableOpacity>
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
    </View>
  );
}
