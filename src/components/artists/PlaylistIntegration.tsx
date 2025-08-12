import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { LoadingState } from '../../utils/uiHelpers';
import { playlistService } from '../../services/playlistService';

interface FeaturedPlaylist {
  id: string;
  name: string;
  description: string;
  user_id: string;
  creator_username: string;
  creator_avatar_url: string | null;
  is_public: boolean;
  followers_count: number;
  track_count: number;
  matching_tracks_count: number;
  trending?: boolean;
}

// Initial loading state playlists
const initialPlaylists = [
  {
    id: '1',
    name: 'New Wave Hits',
    curator: 'MLODI Editorial',
    followers: 12500,
    trending: true,
    accessLevel: 'public',
    trackCount: 45,
    description: 'Best of emerging artists'
  },
  {
    id: '2',
    name: 'Fan Favorites',
    curator: 'Community Curated',
    followers: 8900,
    trending: false,
    accessLevel: 'fan_level_2',
    trackCount: 32,
    description: 'Voted by top fans'
  },
  {
    id: '3',
    name: 'Exclusive Drops',
    curator: 'Artist Official',
    followers: 25000,
    trending: true,
    accessLevel: 'premium',
    trackCount: 18,
    description: 'Premium subscriber exclusive'
  }
];

interface PlaylistIntegrationProps {
  artistId: string;
  artistName: string;
}

const PlaylistIntegration: React.FC<PlaylistIntegrationProps> = ({ artistId, artistName }) => {
  const [playlists, setPlaylists] = useState<FeaturedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedPlaylists();
  }, [artistId]);

  const loadFeaturedPlaylists = async () => {
    try {
      setLoading(true);
      const { data } = await playlistService.queryFromFunction('get_playlists_featuring_artist', { artist_id_param: artistId });
      setPlaylists(data || []);
    } catch (err) {
      console.error('Error loading featured playlists:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const handlePlaylistPress = (playlist: FeaturedPlaylist) => {
    if (playlist.is_public) {
      Alert.alert('Opening Playlist', `Now playing: ${playlist.name}`);
    } else {
      Alert.alert('Private Playlist', 'This playlist is private');
    }
  };

  const getAccessIcon = (isPublic: boolean) => {
    if (!isPublic) {
      return 'lock-closed';
    }
    return 'musical-notes';
  };

  const getAccessIconColor = (isPublic: boolean) => {
    if (!isPublic) {
      return '#007AFF';
    }
    return themeColors.textSecondary;
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 16,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginLeft: 6,
    },
    subtitle: {
      fontSize: 13,
      color: themeColors.textSecondary,
      fontWeight: '400',
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    playlistCard: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      width: 280,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    playlistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    playlistInfo: {
      flex: 1,
    },
    playlistName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    curator: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    accessBadge: {
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 6,
      marginLeft: 8,
    },
    description: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    playlistStats: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      marginBottom: 4,
    },
    statText: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
    },
    trendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF0E6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    trendingText: {
      fontSize: 11,
      color: '#FF6B35',
      marginLeft: 4,
      fontWeight: '600',
    },
  });

  const renderPlaylist = (playlist: FeaturedPlaylist) => (
    <TouchableOpacity
      key={playlist.id}
      style={styles.playlistCard}
      onPress={() => handlePlaylistPress(playlist)}
    >
      <View style={styles.playlistHeader}>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName}>{playlist.name}</Text>
          <Text style={styles.curator}>by {playlist.creator_username}</Text>
        </View>
        <View style={styles.accessBadge}>
          <Ionicons
            name={getAccessIcon(playlist.is_public)}
            size={16}
            color={getAccessIconColor(playlist.is_public)}
          />
        </View>
      </View>
      
      <Text style={styles.description}>{playlist.description}</Text>
      
      <View style={styles.playlistStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={14} color={themeColors.textSecondary} />
          <Text style={styles.statText}>{formatFollowers(playlist.followers_count)} followers</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="musical-notes-outline" size={14} color={themeColors.textSecondary} />
          <Text style={styles.statText}>{playlist.track_count} tracks</Text>
        </View>
        {playlist.trending && (
          <View style={styles.trendingBadge}>
            <Ionicons name="trending-up" size={14} color="#FF6B35" />
            <Text style={styles.trendingText}>Trending</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="albums" size={20} color={themeColors.primary} />
          <Text style={styles.title}>Featured in Playlists</Text>
        </View>
        <Text style={styles.subtitle}>Discover {artistName}'s music in curated collections</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {loading ? (
          <View style={{ minWidth: 280 }}>
            <LoadingState 
              text="Loading Featured Playlists..."
              themeColors={themeColors}
              size="large"
            />
          </View>
        ) : error ? (
          <View style={{ minWidth: 280 }}>
            <LoadingState 
              text={`Error: ${error}`}
              themeColors={themeColors}
              size="large"
              iconName="alert-circle"
            />
          </View>
        ) : playlists.length === 0 ? (
          <View style={{ minWidth: 280 }}>
            <LoadingState 
              text={`No playlists featuring ${artistName} yet`}
              themeColors={themeColors}
              size="large"
              iconName="musical-notes"
            />
          </View>
        ) : (
          playlists.map(renderPlaylist)
        )}
      </ScrollView>
    </View>
  );
};


export default PlaylistIntegration;
