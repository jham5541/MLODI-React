import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme, colors } from '../../context/ThemeContext';
import { useSearch } from '../../context/SearchContext';
import SearchBar from './SearchBar';
import SongCard from '../common/SongCard';
import ArtistCard from '../common/ArtistCard';
import { sampleSongs, sampleArtists, sampleAlbums } from '../../data/sampleData';
import { Song, Artist, Album } from '../../types/music';

type SearchResult = {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function SearchModal() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { isSearchOpen, closeSearch, searchQuery, setSearchQuery } = useSearch();
  const navigation = useNavigation<NavigationProp>();
  const [results, setResults] = useState<SearchResult>({ songs: [], artists: [], albums: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], albums: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const filteredSongs = sampleSongs.filter(song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album.toLowerCase().includes(lowerQuery)
    );

    const filteredArtists = sampleArtists.filter(artist =>
      artist.name.toLowerCase().includes(lowerQuery) ||
      artist.genres.some(genre => genre.toLowerCase().includes(lowerQuery))
    );

    const filteredAlbums = sampleAlbums.filter(album =>
      album.title.toLowerCase().includes(lowerQuery) ||
      album.artist.toLowerCase().includes(lowerQuery)
    );

    setResults({
      songs: filteredSongs,
      artists: filteredArtists,
      albums: filteredAlbums,
    });
  };

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  // Handle navigation after modal closes
  useEffect(() => {
    if (!isSearchOpen && pendingNavigation) {
      console.log('Modal closed, executing pending navigation to artist:', pendingNavigation);
      navigation.navigate('ArtistProfile', { artistId: pendingNavigation });
      setPendingNavigation(null);
    }
  }, [isSearchOpen, pendingNavigation, navigation]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const styles = StyleSheet.create({
    modalContainer: {
      margin: 0,
      justifyContent: 'flex-start',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      height: '100%',
      paddingTop: 50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    searchContainer: {
      flex: 1,
      marginRight: 12,
    },
    cancelButton: {
      padding: 8,
    },
    cancelText: {
      color: themeColors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
    },
    recentSearches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    recentSearchItem: {
      backgroundColor: themeColors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    recentSearchText: {
      color: themeColors.text,
      fontSize: 14,
    },
    clearRecentButton: {
      alignSelf: 'flex-start',
    },
    clearRecentText: {
      color: themeColors.textSecondary,
      fontSize: 14,
    },
    resultsContainer: {
      flex: 1,
    },
    resultCount: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    artistsList: {
      paddingLeft: 16,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  const totalResults = results.songs.length + results.artists.length + results.albums.length;

  return (
    <Modal
      isVisible={isSearchOpen}
      style={styles.modalContainer}
      animationIn="slideInDown"
      animationOut="slideOutUp"
      avoidKeyboard
    >
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Search songs, artists, albums..."
              onSearch={handleSearch}
              autoFocus
            />
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={closeSearch}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {!searchQuery.trim() ? (
            /* Recent Searches */
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity style={styles.clearRecentButton} onPress={clearRecentSearches}>
                    <Text style={styles.clearRecentText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {recentSearches.length > 0 ? (
                <View style={styles.recentSearches}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentSearchItem}
                      onPress={() => handleRecentSearch(search)}
                    >
                      <Text style={styles.recentSearchText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="time-outline"
                    size={48}
                    color={themeColors.textSecondary}
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>No Recent Searches</Text>
                  <Text style={styles.emptySubtitle}>
                    Start searching for your favorite songs, artists, and albums
                  </Text>
                </View>
              )}
            </View>
          ) : totalResults > 0 ? (
            /* Search Results */
            <View style={styles.resultsContainer}>
              <Text style={styles.resultCount}>
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>

              {results.songs.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Songs ({results.songs.length})</Text>
                  {results.songs.slice(0, 5).map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      onPress={() => console.log('Play song:', song.title)}
                    />
                  ))}
                </View>
              )}

              {results.artists.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Artists ({results.artists.length})</Text>
                  <FlatList
                    data={results.artists.slice(0, 5)}
                    renderItem={({ item }) => (
                      <ArtistCard
                        artist={item}
                        onPress={() => {
                          console.log('Artist pressed:', item.name, 'ID:', item.id);
                          console.log('Setting pending navigation and closing search');
                          setPendingNavigation(item.id);
                          closeSearch();
                        }}
                      />
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.artistsList}
                  />
                </View>
              )}

              {results.albums.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Albums ({results.albums.length})</Text>
                  {results.albums.slice(0, 3).map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={styles.recentSearchItem}
                      onPress={() => console.log('View album:', album.title)}
                    >
                      <Text style={styles.recentSearchText}>
                        {album.title} - {album.artist}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            /* No Results */
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={48}
                color={themeColors.textSecondary}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching with different keywords or check your spelling
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}