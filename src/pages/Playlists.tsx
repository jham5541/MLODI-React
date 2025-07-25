import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import EnhancedPlaylistCard from '../components/playlists/EnhancedPlaylistCard';
import CollaborativePlaylistModal from '../components/playlists/CollaborativePlaylistModal';
import CreatePlaylistModal from '../components/playlists/CreatePlaylistModal';
import { usePlaylistStore } from '../store/playlistStore';
import { useMusicStore } from '../store/musicStore';

type PlaylistFilter = 'all' | 'owned' | 'collaborative' | 'liked';
type ViewMode = 'list' | 'grid';

export default function PlaylistsScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  // Playlist store
  const {
    userPlaylists,
    likedPlaylists,
    collaborativePlaylists,
    isLoadingPlaylists,
    isCreatingPlaylist,
    loadUserPlaylists,
    loadLikedPlaylists,
    loadCollaborativePlaylists,
    createPlaylist,
    likePlaylist,
    unlikePlaylist,
  } = usePlaylistStore();

  // Music store for playback
  const { playSong } = useMusicStore();
  
  const [filteredPlaylists, setFilteredPlaylists] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<PlaylistFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterPlaylists();
  }, [userPlaylists, likedPlaylists, collaborativePlaylists, activeFilter, searchQuery]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadUserPlaylists(),
        loadLikedPlaylists(),
        loadCollaborativePlaylists(),
      ]);
    } catch (error) {
      console.error('Failed to load playlist data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const filterPlaylists = () => {
    let allPlaylists: any[] = [];

    // Get playlists based on active filter
    switch (activeFilter) {
      case 'owned':
        allPlaylists = userPlaylists;
        break;
      case 'collaborative':
        allPlaylists = collaborativePlaylists;
        break;
      case 'liked':
        allPlaylists = likedPlaylists;
        break;
      default:
        // Combine all playlists, removing duplicates
        const playlistMap = new Map();
        [...userPlaylists, ...likedPlaylists, ...collaborativePlaylists].forEach(playlist => {
          playlistMap.set(playlist.id, playlist);
        });
        allPlaylists = Array.from(playlistMap.values());
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      allPlaylists = allPlaylists.filter(playlist =>
        playlist.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlaylists(allPlaylists);
  };

  const handlePlaylistPress = (playlist: any) => {
    console.log('Open playlist:', playlist.name);
    // TODO: Navigate to playlist detail screen
  };

  const handlePlayPlaylist = async (playlist: any) => {
    console.log('Play playlist:', playlist.name);
    // TODO: Load playlist songs and start playback
    // For now, just log the action
  };

  const handleLikePlaylist = async (playlistId: string) => {
    try {
      const playlist = filteredPlaylists.find(p => p.id === playlistId);
      if (!playlist) return;

      // Check if playlist is already liked
      const isLiked = likedPlaylists.some(p => p.id === playlistId);
      
      if (isLiked) {
        await unlikePlaylist(playlistId);
      } else {
        await likePlaylist(playlistId);
      }
    } catch (error) {
      console.error('Failed to like/unlike playlist:', error);
      Alert.alert('Error', 'Failed to update playlist. Please try again.');
    }
  };

  const handleSharePlaylist = (playlist: any) => {
    console.log('Share playlist:', playlist.name);
    // TODO: Implement sharing functionality
  };

  const handleCollaborate = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setShowCollabModal(true);
  };

  const handleAnalytics = (playlist: any) => {
    console.log('View analytics for:', playlist.name);
    // TODO: Navigate to analytics screen
  };

  const handleCreatePlaylist = async (playlistData: any) => {
    try {
      const newPlaylist = await createPlaylist({
        name: playlistData.title,
        description: playlistData.description,
        is_public: playlistData.isPublic,
        is_collaborative: playlistData.isCollaborative,
      });
      setShowCreateModal(false);
      Alert.alert('Success', 'Playlist created successfully!');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    }
  };

  const getFilterCount = (filter: PlaylistFilter) => {
    switch (filter) {
      case 'owned':
        return userPlaylists.length;
      case 'collaborative':
        return collaborativePlaylists.length;
      case 'liked':
        return likedPlaylists.length;
      default:
        // Total unique playlists
        const playlistMap = new Map();
        [...userPlaylists, ...likedPlaylists, ...collaborativePlaylists].forEach(playlist => {
          playlistMap.set(playlist.id, playlist);
        });
        return playlistMap.size;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: themeColors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: themeColors.surface,
    },
    createButton: {
      backgroundColor: themeColors.primary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: themeColors.text,
      marginLeft: 8,
    },
    filtersContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterButtons: {
      flexDirection: 'row',
      gap: 8,
      flex: 1,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
    activeFilterButtonText: {
      color: themeColors.background,
    },
    filterCount: {
      fontSize: 10,
      fontWeight: '700',
      backgroundColor: themeColors.background,
      color: themeColors.text,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 4,
    },
    activeFilterCount: {
      backgroundColor: themeColors.background + '20',
      color: themeColors.background,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 2,
    },
    viewButton: {
      padding: 8,
      borderRadius: 6,
    },
    viewButtonActive: {
      backgroundColor: themeColors.primary,
    },
    content: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: themeColors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    listContainer: {
      padding: 16,
    },
    gridContainer: {
      padding: 16,
    },
    gridItem: {
      width: '48%',
      marginBottom: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    emptyButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      color: themeColors.background,
      fontWeight: '600',
    },
  });

  const filters = [
    { key: 'all' as const, label: 'All', icon: 'albums' },
    { key: 'owned' as const, label: 'Owned', icon: 'person' },
    { key: 'collaborative' as const, label: 'Collaborative', icon: 'people' },
    { key: 'liked' as const, label: 'Liked', icon: 'heart' },
  ];

  const totalStats = {
    totalPlaylists: getFilterCount('all'),
    totalTracks: [...userPlaylists, ...likedPlaylists, ...collaborativePlaylists]
      .reduce((sum, p) => sum + (p.total_tracks || 0), 0),
    totalHours: Math.floor(
      [...userPlaylists, ...likedPlaylists, ...collaborativePlaylists]
        .reduce((sum, p) => sum + (p.duration || 0), 0) / 3600
    ),
  };

  if (filteredPlaylists.length === 0 && searchQuery === '' && activeFilter === 'all') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Playlists</Text>
            <TouchableOpacity 
              style={[styles.headerButton, styles.createButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={themeColors.background} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons
            name="musical-notes-outline"
            size={64}
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Playlists Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first playlist to organize your favorite tracks
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.emptyButtonText}>Create Playlist</Text>
          </TouchableOpacity>
        </View>

        <CreatePlaylistModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPlaylistCreated={(playlist) => {
            setPlaylists(prev => [...prev, playlist]);
            setShowCreateModal(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Playlists</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search" size={20} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerButton, styles.createButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={themeColors.background} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={themeColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search playlists..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterButtons}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={12}
                  color={activeFilter === filter.key ? themeColors.background : themeColors.text}
                />
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === filter.key && styles.activeFilterButtonText,
                ]}>
                  {filter.label}
                </Text>
                <Text style={[
                  styles.filterCount,
                  activeFilter === filter.key && styles.activeFilterCount,
                ]}>
                  {getFilterCount(filter.key)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? themeColors.background : themeColors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'grid' ? themeColors.background : themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStats.totalPlaylists}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStats.totalTracks}</Text>
            <Text style={styles.statLabel}>Total Tracks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isLoadingPlaylists ? '...' : totalStats.totalHours + 'h'}</Text>
            <Text style={styles.statLabel}>Total Duration</Text>
          </View>
        </View>

        {/* Playlists */}
        {isLoadingPlaylists && filteredPlaylists.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>
              Loading playlists...
            </Text>
          </View>
        ) : filteredPlaylists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="musical-notes-outline"
              size={64}
              color={themeColors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Playlists Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 
               activeFilter === 'liked' ? 'Like some playlists to see them here' :
               activeFilter === 'collaborative' ? 'Join or create collaborative playlists' :
               'Create your first playlist to get started'}
            </Text>
            {!searchQuery && activeFilter === 'all' && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>Create Playlist</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : viewMode === 'list' ? (
          <View style={styles.listContainer}>
            {filteredPlaylists.map((playlist) => (
              <EnhancedPlaylistCard
                key={playlist.id}
                playlist={{
                  ...playlist,
                  title: playlist.name,
                  trackCount: playlist.total_tracks,
                  isCollaborative: playlist.is_collaborative,
                  isPublic: playlist.is_public,
                  createdBy: playlist.owner?.display_name || 'Anonymous',
                  createdAt: playlist.created_at,
                  updatedAt: playlist.updated_at,
                  coverUrl: playlist.cover_url || 'https://picsum.photos/300/300?random=' + playlist.id,
                  isLiked: likedPlaylists.some(p => p.id === playlist.id),
                  isOwner: userPlaylists.some(p => p.id === playlist.id),
                  likes: 0, // TODO: Add likes count from database
                  shares: 0, // TODO: Add shares count from database
                  duration: playlist.duration || 0,
                }}
                onPress={() => handlePlaylistPress(playlist)}
                onPlay={() => handlePlayPlaylist(playlist)}
                onLike={() => handleLikePlaylist(playlist.id)}
                onShare={() => handleSharePlaylist(playlist)}
                onCollaborate={() => handleCollaborate(playlist)}
                onAnalytics={() => handleAnalytics(playlist)}
                viewMode="detailed"
              />
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredPlaylists}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <EnhancedPlaylistCard
                  playlist={{
                    ...item,
                    title: item.name,
                    trackCount: item.total_tracks,
                    isCollaborative: item.is_collaborative,
                    isPublic: item.is_public,
                    createdBy: item.owner?.display_name || 'Anonymous',
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                    coverUrl: item.cover_url || 'https://picsum.photos/300/300?random=' + item.id,
                    isLiked: likedPlaylists.some(p => p.id === item.id),
                    isOwner: userPlaylists.some(p => p.id === item.id),
                    likes: 0, // TODO: Add likes count from database
                    shares: 0, // TODO: Add shares count from database
                    duration: item.duration || 0,
                  }}
                  onPress={() => handlePlaylistPress(item)}
                  onPlay={() => handlePlayPlaylist(item)}
                  onLike={() => handleLikePlaylist(item.id)}
                  onShare={() => handleSharePlaylist(item)}
                  onCollaborate={() => handleCollaborate(item)}
                  onAnalytics={() => handleAnalytics(item)}
                  viewMode="grid"
                />
              </View>
            )}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPlaylistCreated={handleCreatePlaylist}
      />

      {selectedPlaylist && (
        <CollaborativePlaylistModal
          visible={showCollabModal}
          onClose={() => {
            setShowCollabModal(false);
            setSelectedPlaylist(null);
          }}
          playlistId={selectedPlaylist.id}
          playlistTitle={selectedPlaylist.name || selectedPlaylist.title}
          isOwner={userPlaylists.some(p => p.id === selectedPlaylist.id)}
        />
      )}
    </View>
  );
}