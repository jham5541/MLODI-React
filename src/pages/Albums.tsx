import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import AlbumCard from '../components/albums/AlbumCard';
import AlbumGrid from '../components/albums/AlbumGrid';
import { sampleAlbums } from '../data/sampleData';
import { Song } from '../types/music';

export default function AlbumsScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { playSong } = useAudioPlayer();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSongSelect = async (song: Song) => {
    try {
      await playSong(song);
    } catch (error) {
      console.error('Error playing song:', error);
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
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 2,
    },
    viewButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    activeViewButton: {
      backgroundColor: themeColors.primary,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      marginBottom: 16,
    },
    stats: {
      flexDirection: 'row',
      gap: 20,
    },
    stat: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    statLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
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
      fontSize: 24,
      fontWeight: 'bold',
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
    content: {
      flex: 1,
      padding: 16,
    },
  });

  const totalSongs = sampleAlbums.reduce((total, album) => total + album.songs.length, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Your Albums</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'grid' ? 'white' : themeColors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? 'white' : themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.subtitle}>
          Your personal album collection with owned tracks
        </Text>
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{sampleAlbums.length}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{totalSongs}</Text>
            <Text style={styles.statLabel}>Total Tracks</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {sampleAlbums.filter(album => 
                album.songs.some(song => song.duration && song.duration > 180)
              ).length}
            </Text>
            <Text style={styles.statLabel}>Long Tracks</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <AlbumGrid
          albums={sampleAlbums}
          viewMode={viewMode}
          onSongSelect={handleSongSelect}
        />
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}