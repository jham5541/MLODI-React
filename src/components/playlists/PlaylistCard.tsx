import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';
import { Playlist } from '../../types/music';

interface PlaylistCardProps {
  playlist: Playlist;
  onPress?: () => void;
  onPlay?: () => void;
  showCollaborators?: boolean;
}

export default function PlaylistCard({ 
  playlist, 
  onPress, 
  onPlay,
  showCollaborators = true 
}: PlaylistCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

const { playSong } = usePlay();

  const formatDuration = () => {
    const totalSeconds = playlist.songs.reduce((total, song) => total + song.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePlayPress = () => {
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0]); // Play the first song in the playlist
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    coverImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 16,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      flex: 1,
    },
    privacyIcon: {
      marginLeft: 8,
    },
    description: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metadataText: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    collaborators: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    collaboratorsList: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    collaboratorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -8,
      borderWidth: 2,
      borderColor: themeColors.surface,
    },
    collaboratorText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    moreCollaborators: {
      marginLeft: 8,
    },
    moreText: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      backgroundColor: themeColors.primary,
    },
    menuButton: {
      backgroundColor: themeColors.background,
    },
    analytics: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    analyticsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    analyticsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    analyticsItem: {
      alignItems: 'center',
    },
    analyticsValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    analyticsLabel: {
      fontSize: 11,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    trendIcon: {
      marginLeft: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Image
          source={{ uri: playlist.coverUrl }}
          style={styles.coverImage}
          defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=♪' }}
        />
        
        <View style={styles.content}>
          <View>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {playlist.name}
              </Text>
              {playlist.isPrivate && (
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={themeColors.textSecondary}
                  style={styles.privacyIcon}
                />
              )}
            </View>
            
            {playlist.description && (
              <Text style={styles.description} numberOfLines={2}>
                {playlist.description}
              </Text>
            )}
          </View>
          
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="musical-notes" size={12} color={themeColors.textSecondary} />
              <Text style={styles.metadataText}>
                {playlist.songs.length} track{playlist.songs.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.metadataItem}>
              <Ionicons name="time" size={12} color={themeColors.textSecondary} />
              <Text style={styles.metadataText}>{formatDuration()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
onPress={handlePlayPress}
          >
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.menuButton]}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Collaborators */}
      {showCollaborators && playlist.collaborators && playlist.collaborators.length > 0 && (
        <View style={styles.collaborators}>
          <View style={styles.collaboratorsList}>
            {playlist.collaborators.slice(0, 3).map((collaborator, index) => (
              <View key={collaborator.address} style={styles.collaboratorAvatar}>
                <Text style={styles.collaboratorText}>
                  {collaborator.address.slice(2, 4).toUpperCase()}
                </Text>
              </View>
            ))}
            {playlist.collaborators.length > 3 && (
              <View style={styles.moreCollaborators}>
                <Text style={styles.moreText}>
                  +{playlist.collaborators.length - 3} more
                </Text>
              </View>
            )}
          </View>
          
          {playlist.analytics && (
            <View style={styles.metadataItem}>
              <Ionicons name="trending-up" size={12} color={themeColors.success} />
              <Text style={styles.metadataText}>
                +{playlist.analytics.trend}% this week
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Analytics */}
      {playlist.analytics && (
        <View style={styles.analytics}>
          <Text style={styles.analyticsTitle}>Performance</Text>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {playlist.analytics.totalPlays.toLocaleString()}
              </Text>
              <Text style={styles.analyticsLabel}>Total Plays</Text>
            </View>
            
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {playlist.analytics.uniqueListeners.toLocaleString()}
              </Text>
              <Text style={styles.analyticsLabel}>Listeners</Text>
            </View>
            
            <View style={styles.analyticsItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.analyticsValue}>
                  {Math.round(playlist.analytics.averageListenTime / 60)}m
                </Text>
                <Ionicons
                  name={playlist.analytics.trend > 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={playlist.analytics.trend > 0 ? themeColors.success : themeColors.error}
                  style={styles.trendIcon}
                />
              </View>
              <Text style={styles.analyticsLabel}>Avg. Listen</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}