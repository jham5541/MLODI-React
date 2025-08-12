import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import PlaylistCard from '../playlists/PlaylistCard';
import { Playlist } from '../../types/music';

interface PlaylistCarouselProps {
  title: string;
  playlists: Playlist[];
  onPlaylistPress?: (playlist: Playlist) => void;
  onPlayPress?: (playlist: Playlist) => void;
}

export default function PlaylistCarousel({ 
  title, 
  playlists, 
  onPlaylistPress, 
  onPlayPress,
  onSeeAllPress
}: PlaylistCarouselProps & { onSeeAllPress?: () => void }) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    seeAll: {
      fontSize: 14,
      color: themeColors.primary,
      fontWeight: '600',
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    playlistContainer: {
      width: 200,
      marginRight: 12,
    },
  });

  const renderPlaylist = ({ item }: { item: Playlist }) => (
    <View style={styles.playlistContainer}>
      <PlaylistCard
        playlist={item}
        onPress={() => onPlaylistPress?.(item)}
        onPlay={() => onPlayPress?.(item)}
        showCollaborators={false}
      />
    </View>
  );

  if (!playlists.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={playlists}
        renderItem={renderPlaylist}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}
