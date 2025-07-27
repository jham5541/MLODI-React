import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { usePlay } from '../context/PlayContext';
import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';

type DiscoverFilter = 'albums' | 'artists' | 'songs' | 'genres';
type GenreFilter = 'all' | 'pop' | 'rock' | 'hip-hop' | 'electronic' | 'jazz' | 'classical' | 'country' | 'r&b' | 'indie';

interface Album {
  id: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string;
  year: number;
  trackCount: number;
  duration: string;
}

interface Artist {
  id: string;
  name: string;
  genre: string;
  imageUrl: string;
  albumCount: number;
  followers: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  coverUrl: string;
}

// Generate 100 dummy albums
const generateDummyAlbums = (): Album[] => {
  const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'country', 'r&b', 'indie'];
  const artists = ['The Midnight', 'Arctic Monkeys', 'Kendrick Lamar', 'Daft Punk', 'Miles Davis', 'Bach', 'Johnny Cash', 'Frank Ocean', 'Tame Impala', 'Billie Eilish', 'Post Malone', 'The Weeknd', 'Taylor Swift', 'Drake', 'Adele', 'Ed Sheeran', 'Bruno Mars', 'Ariana Grande', 'The Beatles', 'Queen'];
  const albums = [];
  
  for (let i = 1; i <= 100; i++) {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const artist = artists[Math.floor(Math.random() * artists.length)];
    albums.push({
      id: `album-${i}`,
      title: `Album ${i}`,
      artist: artist,
      genre: genre,
      coverUrl: `https://picsum.photos/300/300?random=${i}`,
      year: 2020 + Math.floor(Math.random() * 4),
      trackCount: 8 + Math.floor(Math.random() * 15),
      duration: `${30 + Math.floor(Math.random() * 30)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
    });
  }
  return albums;
};

// Generate dummy artists
const generateArtists = (): Artist[] => {
  const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'country', 'r&b', 'indie'];
  const artistNames = ['The Midnight', 'Arctic Monkeys', 'Kendrick Lamar', 'Daft Punk', 'Miles Davis', 'Bach', 'Johnny Cash', 'Frank Ocean', 'Tame Impala', 'Billie Eilish', 'Post Malone', 'The Weeknd', 'Taylor Swift', 'Drake', 'Adele', 'Ed Sheeran', 'Bruno Mars', 'Ariana Grande', 'The Beatles', 'Queen'];
  
  return artistNames.map((name, index) => ({
    id: `artist-${index + 1}`,
    name: name,
    genre: genres[Math.floor(Math.random() * genres.length)],
    imageUrl: `https://picsum.photos/200/200?random=${index + 200}`,
    albumCount: Math.floor(Math.random() * 10) + 1,
    followers: `${Math.floor(Math.random() * 900) + 100}K`
  }));
};

// Generate dummy songs
const generateSongs = (): Song[] => {
  const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'country', 'r&b', 'indie'];
  const artists = ['The Midnight', 'Arctic Monkeys', 'Kendrick Lamar', 'Daft Punk', 'Miles Davis', 'Bach', 'Johnny Cash', 'Frank Ocean', 'Tame Impala', 'Billie Eilish'];
  const songs = [];
  
  for (let i = 1; i <= 50; i++) {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const artist = artists[Math.floor(Math.random() * artists.length)];
    songs.push({
      id: `song-${i}`,
      title: `Song ${i}`,
      artist: artist,
      album: `Album ${Math.floor(Math.random() * 20) + 1}`,
      genre: genre,
      duration: `${Math.floor(Math.random() * 3) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      coverUrl: `https://picsum.photos/150/150?random=${i + 300}`
    });
  }
  return songs;
};

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Discover'>,
  StackScreenProps<RootStackParamList>
>;

export default function DiscoverScreen({ navigation }: Props) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const screenWidth = Dimensions.get('window').width;
  const { playSong } = usePlay();
  
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('albums');
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dummyAlbums] = useState(generateDummyAlbums());
  const [dummyArtists] = useState(generateArtists());
  const [dummySongs] = useState(generateSongs());

  // Filter data based on selected genre and search query
  const getFilteredData = () => {
    const filterByGenre = (items: any[]) => {
      if (selectedGenre === 'all') return items;
      return items.filter(item => item.genre === selectedGenre);
    };

    const filterBySearch = (items: any[]) => {
      if (!searchQuery.trim()) return items;
      const query = searchQuery.toLowerCase();
      
      switch (activeFilter) {
        case 'albums':
          return items.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.artist.toLowerCase().includes(query)
          );
        case 'artists':
          return items.filter(item => 
            item.name.toLowerCase().includes(query) ||
            item.genre.toLowerCase().includes(query)
          );
        case 'songs':
          return items.filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.artist.toLowerCase().includes(query) ||
            item.album.toLowerCase().includes(query)
          );
        default:
          return items;
      }
    };

    let data;
    switch (activeFilter) {
      case 'albums':
        data = filterByGenre(dummyAlbums);
        break;
      case 'artists':
        data = filterByGenre(dummyArtists);
        break;
      case 'songs':
        data = filterByGenre(dummySongs);
        break;
      default:
        data = filterByGenre(dummyAlbums);
    }
    
    return filterBySearch(data);
  };

  const filters = [
    { key: 'albums', label: 'Albums', icon: 'albums-outline' },
    { key: 'artists', label: 'Artists', icon: 'person-outline' },
    { key: 'songs', label: 'Songs', icon: 'musical-notes-outline' },
  ];

  const genres = [
    { key: 'all', label: 'All Genres' },
    { key: 'pop', label: 'Pop' },
    { key: 'rock', label: 'Rock' },
    { key: 'hip-hop', label: 'Hip-Hop' },
    { key: 'electronic', label: 'Electronic' },
    { key: 'jazz', label: 'Jazz' },
    { key: 'classical', label: 'Classical' },
    { key: 'country', label: 'Country' },
    { key: 'r&b', label: 'R&B' },
    { key: 'indie', label: 'Indie' },
  ];

  const filteredData = getFilteredData();
  const itemCount = filteredData.length;

  const onRefresh = () => {
    // In a real app, this would refresh data from API
    console.log('Refreshing discover data...');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 16,
      paddingBottom: 8,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    refreshButton: {
      padding: 8,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    // Search bar styles
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 24,
      marginHorizontal: 0,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 48,
      borderWidth: 1,
      borderColor: themeColors.border,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: themeColors.text,
      paddingVertical: 0,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    filtersContainer: {
      marginBottom: 8,
    },
    filtersList: {
      paddingHorizontal: 16,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
    },
    activeFilterText: {
      color: 'white',
    },
    content: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    statsText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: themeColors.background,
    },
    sortText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginRight: 4,
    },
    gridContainer: {
      paddingTop: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginTop: 16,
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
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    emptyButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 20,
    },
    emptyButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    // Genre filters
    genreFiltersContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    genreFilterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeGenreFilterButton: {
      backgroundColor: themeColors.secondary,
      borderColor: themeColors.secondary,
    },
    genreFilterText: {
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.text,
    },
    activeGenreFilterText: {
      color: 'white',
    },
    // Album card styles
    albumCard: {
      width: (screenWidth - 48) / 2,
      marginBottom: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    albumCover: {
      width: '100%',
      height: (screenWidth - 48) / 2 - 24,
      borderRadius: 8,
      marginBottom: 8,
    },
    albumTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    albumArtist: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    albumInfo: {
      fontSize: 11,
      color: themeColors.textSecondary,
    },
    // Artist list styles
    artistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    artistImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
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
    },
    artistGenre: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    artistStats: {
      fontSize: 11,
      color: themeColors.textSecondary,
    },
    // Song list styles
    songItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: themeColors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    songCover: {
      width: 40,
      height: 40,
      borderRadius: 6,
      marginRight: 12,
    },
    songInfo: {
      flex: 1,
    },
    songTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    songArtistAlbum: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    songDuration: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 8,
    },
  });

  // Render functions for different view types
  const renderAlbumCard = ({ item, index }: { item: Album; index: number }) => (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.albumCard, { marginLeft: index % 2 === 0 ? 16 : 8, marginRight: index % 2 === 1 ? 16 : 8 }]}
      onPress={() => navigation?.navigate('AlbumPage', { albumId: item.id })}
    >
      <Image source={{ uri: item.coverUrl }} style={styles.albumCover} />
      <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
      <Text style={styles.albumInfo}>{item.year} • {item.trackCount} tracks</Text>
    </TouchableOpacity>
  );

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity 
      style={styles.artistItem}
      onPress={() => navigation?.navigate('ArtistProfile', { artistId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.artistImage} />
      <View style={styles.artistInfo}>
        <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artistGenre}>{item.genre}</Text>
        <Text style={styles.artistStats}>{item.albumCount} albums • {item.followers} followers</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
    </TouchableOpacity>
  );

  const handlePlaySong = (song: Song) => {
    // Convert Song to the format expected by PlayContext
    const playContextSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      coverUrl: song.coverUrl,
      duration: song.duration,
    };
    
    // Get all filtered songs as playlist
    const songsPlaylist = (filteredData as Song[]).map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      coverUrl: s.coverUrl,
      duration: s.duration,
    }));
    
    playSong(playContextSong, songsPlaylist);
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => handlePlaySong(item)}>
      <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtistAlbum} numberOfLines={1}>{item.artist} • {item.album}</Text>
      </View>
      <Text style={styles.songDuration}>{item.duration}</Text>
      <TouchableOpacity 
        style={{ marginLeft: 8 }} 
        onPress={(e) => {
          e.stopPropagation();
          handlePlaySong(item);
        }}
      >
        <Ionicons name="play" size={20} color={themeColors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="musical-notes-outline"
            size={64}
            color={themeColors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Items Found</Text>
          <Text style={styles.emptySubtitle}>
            No {activeFilter} found for the selected genre. Try a different filter.
          </Text>
        </View>
      );
    }

    if (activeFilter === 'albums') {
      return (
        <FlatList
          key={`albums-${selectedGenre}`}
          data={filteredData as Album[]}
          renderItem={renderAlbumCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      );
    } else if (activeFilter === 'artists') {
      return (
        <FlatList
          key={`artists-${selectedGenre}`}
          data={filteredData as Artist[]}
          renderItem={renderArtistItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      );
    } else if (activeFilter === 'songs') {
      return (
        <FlatList
          key={`songs-${selectedGenre}`}
          data={filteredData as Song[]}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Discover</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>Find new music to love</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeFilter}...`}
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter.key as DiscoverFilter)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={activeFilter === filter.key ? 'white' : themeColors.text}
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter.key && styles.activeFilterText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Genre Filters */}
      <View style={styles.genreFiltersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
        >
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.key}
              style={[
                styles.genreFilterButton,
                selectedGenre === genre.key && styles.activeGenreFilterButton,
              ]}
              onPress={() => setSelectedGenre(genre.key as GenreFilter)}
            >
              <Text
                style={[
                  styles.genreFilterText,
                  selectedGenre === genre.key && styles.activeGenreFilterText,
                ]}
              >
                {genre.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}
