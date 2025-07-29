import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  FlatList,
  RefreshControl,
  Image
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useMusicStore } from '../store/musicStore';
import { purchaseService } from '../services/purchaseService';
import { Song, Artist } from '../types/music';
import { sampleArtists, trendingSongs } from '../data/sampleData';
import ArtistCard from '../components/common/ArtistCard';
import SongItem from '../components/common/SongItem';

type GenreDetailRouteParams = {
  genre: string;
};

type GenreDetailRouteProp = RouteProp<{ GenreDetail: GenreDetailRouteParams }, 'GenreDetail'>;

const { width } = Dimensions.get('window');

type TabType = 'songs' | 'artists';

export default function GenreDetail() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const route = useRoute<GenreDetailRouteProp>();
  const navigation = useNavigation();
  const { playSong } = useMusicStore();
  
  const { genre } = route.params;
  
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filter artists by genre
  const genreArtists = sampleArtists.filter(artist => 
    artist.genres.includes(genre)
  ).sort((a, b) => b.followers - a.followers);

  // Filter songs by genre (checking artist genres)
  const genreSongs = trendingSongs.filter(song => {
    const artist = sampleArtists.find(a => a.id === song.artistId);
    return artist?.genres.includes(genre);
  }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const artistShowcaseScroll = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-scrolling artist showcase animation
    if (genreArtists.length > 0) {
      const startAutoScroll = () => {
        Animated.loop(
          Animated.timing(artistShowcaseScroll, {
            toValue: -(genreArtists.length * 120),
            duration: genreArtists.length * 3000,
            useNativeDriver: true,
          })
        ).start();
      };
      
      setTimeout(startAutoScroll, 1000);
    }
  }, [genreArtists.length]);

  useEffect(() => {
    // Animate tab indicator
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'songs' ? 0 : 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setRefreshKey(prev => prev + 1);
    }, 1000);
  };

  const handleSongPress = (song: Song) => {
    const songIndex = genreSongs.findIndex(s => s.id === song.id);
    playSong(song, genreSongs, songIndex);
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistProfile', { artistId: artist.id });
  };

  const handlePurchaseComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isPurchased = purchaseService.isPurchased(item.id);
    const purchaseCount = purchaseService.getPurchaseCount(item.id);
    
    return (
      <View style={[styles.songItemContainer, isPurchased && styles.purchasedSong]}>
        <SongItem
          song={item}
          onPress={handleSongPress}
          showArtist={true}
          onPurchaseComplete={handlePurchaseComplete}
        />
        {purchaseCount > 0 && (
          <View style={styles.purchaseBadge}>
            <Text style={styles.purchaseCount}>{purchaseCount}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <View style={styles.artistItem}>
      <ArtistCard
        artist={item}
        onPress={() => handleArtistPress(item)}
      />
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'songs') {
      if (genreSongs.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="musical-notes-outline" 
              size={64} 
              color={themeColors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No {genre} Songs</Text>
            <Text style={styles.emptyDescription}>
              We couldn't find any songs in this genre. Try exploring other genres.
            </Text>
          </View>
        );
      }

      return (
        <FlatList
          key={`${genre}-songs-${refreshKey}`}
          data={genreSongs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      );
    }

    if (activeTab === 'artists') {
      if (genreArtists.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="person-outline" 
              size={64} 
              color={themeColors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No {genre} Artists</Text>
            <Text style={styles.emptyDescription}>
              We couldn't find any artists in this genre. Try exploring other genres.
            </Text>
          </View>
        );
      }

      return (
        <FlatList
          key={`${genre}-artists-${refreshKey}`}
          data={genreArtists}
          renderItem={renderArtistItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      );
    }

    return null;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      height: 250,
      justifyContent: 'flex-end',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    artistShowcaseBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      opacity: 0.8,
    },
    artistShowcaseContainer: {
      flexDirection: 'row',
      height: '100%',
    },
    artistShowcaseImage: {
      width: 120,
      height: '100%',
      marginRight: 10,
      borderRadius: 8,
    },
    headerContent: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingBottom: 30,
      position: 'relative',
      zIndex: 2,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    genreTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    genreStats: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      position: 'relative',
    },
    tabButton: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
    },
    activeTabText: {
      color: themeColors.primary,
    },
    inactiveTabText: {
      color: themeColors.textSecondary,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      height: 3,
      backgroundColor: themeColors.primary,
      borderRadius: 1.5,
      width: width / 2,
    },
    content: {
      flex: 1,
    },
    songItemContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    purchasedSong: {
      backgroundColor: `${themeColors.primary}15`,
    },
    purchaseBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    purchaseCount: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    artistItem: {
      marginBottom: 16,
    },
    emptyContainer: {
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
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header with scrolling artist background */}
      <View style={styles.header}>
        <View style={styles.artistShowcaseBackground}>
          <Animated.View 
            style={[
              styles.artistShowcaseContainer,
              {
                transform: [{ translateX: artistShowcaseScroll }]
              }
            ]}
          >
            {/* Duplicate artists for seamless loop */}
            {[...genreArtists, ...genreArtists].map((artist, index) => (
              <Image
                key={`${artist.id}-${index}`}
                source={{ uri: artist.image }}
                style={styles.artistShowcaseImage}
                resizeMode="cover"
              />
            ))}
          </Animated.View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.headerContent,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.genreTitle}>{genre}</Text>
          <Text style={styles.genreStats}>
            {genreSongs.length} songs • {genreArtists.length} artists
          </Text>
        </Animated.View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => setActiveTab('songs')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'songs' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Songs ({genreSongs.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => setActiveTab('artists')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'artists' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Artists ({genreArtists.length})
          </Text>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.tabIndicator,
            {
              transform: [{
                translateX: tabIndicatorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width / 2],
                })
              }]
            }
          ]}
        />
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </Animated.View>
  );
}
