import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import AuthButton from '../components/auth/AuthButton';
import SongCard from '../components/common/SongCard';
import ArtistCard from '../components/common/ArtistCard';
import { trendingSongs, popularArtists, samplePlaylists } from '../data/sampleData';

export default function HomeScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { openSearch } = useSearch();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    subtitle: {
      fontSize: 18,
      color: themeColors.textSecondary,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
      marginTop: 24,
    },
    placeholder: {
      padding: 20,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 16,
    },
    placeholderText: {
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    horizontalList: {
      paddingLeft: 16,
    },
    songsList: {
      marginHorizontal: -4,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Welcome to M3lodi</Text>
            <Text style={styles.subtitle}>Your Web3 Music Platform</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.searchButton} onPress={openSearch}>
              <Ionicons name="search" size={20} color={themeColors.text} />
            </TouchableOpacity>
            <AuthButton />
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Popular Artists</Text>
        <FlatList
          data={popularArtists}
          renderItem={({ item }) => (
            <ArtistCard
              artist={item}
              onPress={() => console.log('Navigate to artist:', item.name)}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
        
        <Text style={styles.sectionTitle}>Trending Tracks</Text>
        <View style={styles.songsList}>
          {trendingSongs.slice(0, 3).map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPress={() => console.log('Navigate to song:', song.title)}
            />
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Featured Playlists</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {samplePlaylists[0].name} • {samplePlaylists[0].songs.length} tracks
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Your NFT Collection</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Connect your wallet to view owned music NFTs</Text>
        </View>
      </View>
    </ScrollView>
  );
}