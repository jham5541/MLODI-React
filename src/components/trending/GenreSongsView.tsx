import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTheme, colors } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../../types/music';
import { formatDuration } from '../../utils/uiHelpers';

interface GenreSongsViewProps {
  genre: string;
  songs: Song[];
  onSongPress: (song: Song) => void;
  onBackPress: () => void;
}

export default function GenreSongsView({ genre, songs, onSongPress, onBackPress }: GenreSongsViewProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

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
  });

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => onSongPress(item)}>
      <Image source={{ uri: item.coverUrl }} style={styles.songCover} />
      
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="musical-notes-outline"
        size={64}
        color={themeColors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No {genre} Songs Found</Text>
      <Text style={styles.emptySubtitle}>
        We couldn't find any songs in the {genre} genre at the moment.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{genre} Songs</Text>
      </View>
      
      {songs.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
