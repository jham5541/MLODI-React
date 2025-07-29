import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { playlistService, Playlist } from '../../services/playlistService';
import CreatePlaylistModal from './CreatePlaylistModal';

interface AddToPlaylistModalProps {
  isVisible: boolean;
  onClose: () => void;
  songId: string;
  songTitle: string;
  songArtist: string;
  songCover: string;
}

export default function AddToPlaylistModal({
  isVisible,
  onClose,
  songId,
  songTitle,
  songArtist,
  songCover,
}: AddToPlaylistModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadPlaylists();
    }
  }, [isVisible]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const userPlaylists = await playlistService.getPlaylists({
        include_owner: true,
        limit: 50,
      });
      setPlaylists(userPlaylists);
    } catch (error) {
      console.log('Error loading playlists:', error);
      Alert.alert('Error', 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      setAddingToPlaylist(playlistId);
      await playlistService.addSongToPlaylist(playlistId, songId);
      Alert.alert('Success', 'Song added to playlist!');
      onClose();
    } catch (error: any) {
      console.log('Error adding to playlist:', error);
      if (error.message?.includes('duplicate')) {
        Alert.alert('Info', 'Song is already in this playlist');
      } else {
        Alert.alert('Error', 'Failed to add song to playlist');
      }
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const handleCreatePlaylist = async (playlistData: {
    name: string;
    description: string;
    isPrivate: boolean;
    coverImage: string | null;
    isCollaborative: boolean;
  }) => {
    try {
      const newPlaylist = await playlistService.createPlaylist({
        name: playlistData.name,
        description: playlistData.description,
        is_private: playlistData.isPrivate,
        cover_url: playlistData.coverImage,
        is_collaborative: playlistData.isCollaborative,
      });

      // Add the current song to the new playlist
      await playlistService.addSongToPlaylist(newPlaylist.id, songId);
      
      setShowCreateModal(false);
      Alert.alert('Success', 'Playlist created and song added!');
      onClose();
    } catch (error) {
      console.log('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handleAddToPlaylist(item.id)}
      disabled={addingToPlaylist === item.id}
    >
      <View style={styles.playlistInfo}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.playlistCover} />
        ) : (
          <View style={[styles.playlistCover, styles.defaultCover]}>
            <Ionicons name="musical-notes" size={20} color={themeColors.textSecondary} />
          </View>
        )}
        
        <View style={styles.playlistDetails}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistInfoText} numberOfLines={1}>
            {item.total_tracks} songs
            {item.is_private && ' • Private'}
            {item.is_collaborative && ' • Collaborative'}
          </Text>
        </View>
      </View>

      {addingToPlaylist === item.id ? (
        <ActivityIndicator size="small" color={themeColors.primary} />
      ) : (
        <Ionicons name="add" size={24} color={themeColors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      minHeight: '50%',
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    songInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    songCover: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 12,
    },
    songDetails: {
      flex: 1,
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
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginHorizontal: 20,
      marginVertical: 16,
    },
    createButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    playlistsList: {
      flex: 1,
    },
    playlistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '30',
    },
    playlistInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    playlistCover: {
      width: 48,
      height: 48,
      borderRadius: 8,
      marginRight: 12,
    },
    defaultCover: {
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playlistDetails: {
      flex: 1,
    },
    playlistName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    playlistInfoText: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  return (
    <>
      <Modal
        isVisible={isVisible}
        onBackdropPress={onClose}
        onSwipeComplete={onClose}
        swipeDirection="down"
        style={styles.modalContainer}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Add to Playlist</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.songInfo}>
              <Image source={{ uri: songCover }} style={styles.songCover} />
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {songTitle}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {songArtist}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.createButtonText}>Create New Playlist</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={styles.emptyText}>Loading playlists...</Text>
            </View>
          ) : playlists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={themeColors.textSecondary} />
              <Text style={styles.emptyText}>
                No playlists found{'\n'}Create your first playlist above!
              </Text>
            </View>
          ) : (
            <FlatList
              style={styles.playlistsList}
              data={playlists}
              renderItem={renderPlaylistItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>

      <CreatePlaylistModal
        isVisible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePlaylist={handleCreatePlaylist}
      />
    </>
  );
}
