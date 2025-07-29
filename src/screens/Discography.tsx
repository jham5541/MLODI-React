import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme, colors } from '../context/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Album } from '../types/music';
import { sampleAlbums } from '../data/sampleData';

type DiscographyRouteProp = RouteProp<{
  Discography: {
    artistId: string;
    artistName: string;
  };
}, 'Discography'>;

interface AlbumItemProps {
  item: Album;
  index: number;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2; // 2 columns with padding

export default function Discography() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();
  const route = useRoute<DiscographyRouteProp>();
  
  const { artistId, artistName } = route.params;
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadInitialAlbums();
  }, [artistId]);

  const loadInitialAlbums = async () => {
    setLoading(true);
    try {
      // Mock API call - in real app, this would be an API call
      const artistAlbums = sampleAlbums.filter(album => album.artistId === artistId);
      
      // Generate more albums for demonstration of infinite scroll
      const generatedAlbums = generateMoreAlbums(artistAlbums, artistName, 1);
      
      setAlbums(generatedAlbums);
      setPage(2);
    } catch (error) {
      console.error('Error loading albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreAlbums = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const artistAlbums = sampleAlbums.filter(album => album.artistId === artistId);
      const moreAlbums = generateMoreAlbums(artistAlbums, artistName, page);
      
      if (moreAlbums.length > 0) {
        setAlbums(prevAlbums => [...prevAlbums, ...moreAlbums]);
        setPage(page + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMoreAlbums = (baseAlbums: Album[], artistName: string, pageNum: number): Album[] => {
    // Stop generating after page 5 for demo
    if (pageNum > 5) return [];
    
    const albumTitles = [
      'Echoes of Tomorrow', 'Digital Horizons', 'Neon Dreams', 'Cyber Symphony',
      'Electric Nights', 'Future Sounds', 'Midnight Beats', 'Urban Pulse',
      'Synthetic Love', 'Binary Sunset', 'Chrome Hearts', 'Pixel Paradise',
      'Data Dreams', 'Circuit Breaker', 'Virtual Reality', 'Quantum Leap'
    ];
    
    return Array.from({ length: 6 }, (_, index) => ({
      id: `${artistId}-album-${pageNum}-${index}`,
      title: albumTitles[(pageNum - 1) * 6 + index] || `Album ${pageNum}-${index + 1}`,
      artist: artistName,
      artistId: artistId,
      coverUrl: `https://picsum.photos/400/400?random=${pageNum * 10 + index + 50}`,
      releaseDate: `2024-0${Math.min(pageNum + index, 9)}-${10 + index}`,
      songs: [],
    }));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadInitialAlbums();
    setRefreshing(false);
  }, [artistId]);

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('AlbumPage', { albumId: album.id });
  };

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  const renderAlbum = ({ item, index }: AlbumItemProps) => (
    <TouchableOpacity 
      style={[styles.albumContainer, {
        marginLeft: index % 2 === 0 ? 20 : 10,
        marginRight: index % 2 === 0 ? 10 : 20,
      }]}
      onPress={() => handleAlbumPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.albumCoverContainer}>
        <Image 
          source={{ uri: item.coverUrl }} 
          style={styles.albumCover}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={24} color="white" />
        </View>
      </View>
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.albumYear}>
          {formatReleaseDate(item.releaseDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Discography</Text>
        <Text style={styles.headerSubtitle}>{artistName}</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.primary} />
        <Text style={styles.loadingText}>Loading more albums...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.emptyText}>Loading discography...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="musical-notes-outline" 
          size={64} 
          color={themeColors.textSecondary} 
        />
        <Text style={styles.emptyText}>No albums found</Text>
        <Text style={styles.emptySubtext}>Check back later for new releases</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {renderHeader()}
      <FlatList
        data={albums}
        renderItem={renderAlbum}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreAlbums}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={albums.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
        columnWrapperStyle={albums.length > 0 ? styles.row : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  albumContainer: {
    width: ITEM_WIDTH,
    marginBottom: 32,
  },
  albumCoverContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  albumCover: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  albumInfo: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  albumYear: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

