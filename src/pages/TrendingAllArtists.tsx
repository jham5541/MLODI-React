import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Artist } from '../types/music';
import { useNavigation } from '@react-navigation/native';
import { sampleArtists } from '../data/sampleData';

export default function TrendingAllArtists() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = () => {
    // Sort by followers to show trending artists
    const sortedArtists = [...sampleArtists].sort((a, b) => b.followers - a.followers);
    setArtists(sortedArtists);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadArtists();
    setRefreshing(false);
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistProfile', { artistId: artist.id });
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
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
    artistItem: {
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
    artistCover: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginRight: 12,
    },
    artistInfo: {
      flex: 1,
    },
    artistName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    artistGenres: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    artistFollowers: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    followButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    followButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    followingButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    followingButtonText: {
      color: themeColors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  const handleFollowPress = (artistId: string) => {
    setFollowingState(prev => ({
      ...prev,
      [artistId]: !prev[artistId]
    }));
  };

  const renderArtistItem = ({ item, index }: { item: Artist; index: number }) => {
    const isFollowing = followingState[item.id] || false;
    
    return (
      <TouchableOpacity style={styles.artistItem} onPress={() => handleArtistPress(item)}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <Image source={{ uri: item.coverUrl }} style={styles.artistCover} />
        
        <View style={styles.artistInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.artistName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isVerified && (
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={themeColors.primary} 
                style={styles.verifiedIcon}
              />
            )}
          </View>
          <Text style={styles.artistGenres} numberOfLines={1}>
            {item.genres.slice(0, 2).join(' • ')}
          </Text>
          <Text style={styles.artistFollowers}>
            {formatFollowers(item.followers)} followers
          </Text>
        </View>
        
        <TouchableOpacity 
          style={isFollowing ? styles.followingButton : styles.followButton}
          onPress={() => handleFollowPress(item.id)}
        >
          <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trending Artists</Text>
      </View>
      
      <FlatList
        data={artists}
        renderItem={renderArtistItem}
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
    </View>
  );
}
