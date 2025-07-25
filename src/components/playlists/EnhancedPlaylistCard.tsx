import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface PlaylistAnalytics {
  totalPlays: number;
  uniqueListeners: number;
  averageListenTime: number;
  completionRate: number;
  dailyGrowth: number;
  topRegions: string[];
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  trackCount: number;
  duration: number;
  isCollaborative: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  collaborators?: Collaborator[];
  analytics?: PlaylistAnalytics;
  tags?: string[];
  mood?: string;
  genre?: string;
  likes: number;
  shares: number;
  isLiked: boolean;
  isOwner: boolean;
}

interface EnhancedPlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onPlay: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onCollaborate?: () => void;
  onAnalytics?: () => void;
  viewMode?: 'compact' | 'detailed' | 'grid';
}

export default function EnhancedPlaylistCard({
  playlist,
  onPress,
  onPlay,
  onLike,
  onShare,
  onCollaborate,
  onAnalytics,
  viewMode = 'detailed',
}: EnhancedPlaylistCardProps) {
  const { colors } = useTheme();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMoodColor = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'energetic': return '#FF6B6B';
      case 'chill': return '#4ECDC4';
      case 'melancholic': return '#A8A8FF';
      case 'happy': return '#FFE66D';
      case 'dark': return '#6C5CE7';
      default: return colors.primary;
    }
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'energetic': return 'flash';
      case 'chill': return 'leaf';
      case 'melancholic': return 'rainy';
      case 'happy': return 'sunny';
      case 'dark': return 'moon';
      default: return 'musical-note';
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      'Playlist Options',
      playlist.title,
      [
        { text: 'View Analytics', onPress: onAnalytics },
        { text: 'Share Playlist', onPress: onShare },
        playlist.isCollaborative && { text: 'Manage Collaboration', onPress: onCollaborate },
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: viewMode === 'grid' ? 16 : 12,
      padding: viewMode === 'compact' ? 12 : 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    collaborativeCard: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    header: {
      flexDirection: 'row',
      marginBottom: viewMode === 'compact' ? 8 : 12,
    },
    coverContainer: {
      position: 'relative',
      marginRight: 12,
    },
    cover: {
      width: viewMode === 'compact' ? 60 : viewMode === 'grid' ? 80 : 80,
      height: viewMode === 'compact' ? 60 : viewMode === 'grid' ? 80 : 80,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    playButton: {
      position: 'absolute',
      bottom: -6,
      right: -6,
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    collaborativeBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    collaborativeBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: colors.background,
      textTransform: 'uppercase',
    },
    playlistInfo: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    title: {
      fontSize: viewMode === 'compact' ? 14 : 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    privateIcon: {
      marginLeft: 4,
    },
    creatorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    creatorText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 8,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metadataText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginTop: 8,
    },
    readMore: {
      color: colors.primary,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    tag: {
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    moodTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    moodText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.background,
    },
    collaboratorsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    collaboratorAvatars: {
      flexDirection: 'row',
      marginRight: 8,
    },
    collaboratorAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginLeft: -6,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    firstCollaboratorAvatar: {
      marginLeft: 0,
    },
    collaboratorCount: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    analyticsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    analyticsItem: {
      alignItems: 'center',
      flex: 1,
    },
    analyticsValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    analyticsLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    leftActions: {
      flexDirection: 'row',
      gap: 16,
    },
    rightActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    actionTextActive: {
      color: colors.primary,
    },
    growthIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: colors.success + '20',
    },
    growthText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.success,
      marginLeft: 2,
    },
    gridLayout: {
      width: '100%',
    },
    gridCover: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      marginBottom: 12,
    },
    gridPlayButton: {
      position: 'absolute',
      bottom: 8,
      right: 8,
    },
    gridTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    gridMetadata: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.card, styles.gridLayout]}
        onPress={onPress}
        onLongPress={handleLongPress}
      >
        <View style={styles.coverContainer}>
          <Image source={{ uri: playlist.coverUrl }} style={styles.gridCover} />
          <TouchableOpacity style={[styles.playButton, styles.gridPlayButton]} onPress={onPlay}>
            <Ionicons name="play" size={16} color={colors.background} />
          </TouchableOpacity>
          {playlist.isCollaborative && (
            <View style={styles.collaborativeBadge}>
              <Text style={styles.collaborativeBadgeText}>COLLAB</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.gridTitle} numberOfLines={2}>
          {playlist.title}
        </Text>
        <Text style={styles.gridMetadata}>
          {playlist.trackCount} tracks • {formatDuration(playlist.duration)}
        </Text>
        
        {playlist.mood && (
          <View style={[styles.moodTag, { backgroundColor: getMoodColor(playlist.mood), marginTop: 6 }]}>
            <Ionicons name={getMoodIcon(playlist.mood) as any} size={8} color={colors.background} />
            <Text style={styles.moodText}>{playlist.mood}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        playlist.isCollaborative && styles.collaborativeCard,
      ]}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      <View style={styles.header}>
        <View style={styles.coverContainer}>
          <Image source={{ uri: playlist.coverUrl }} style={styles.cover} />
          <TouchableOpacity style={styles.playButton} onPress={onPlay}>
            <Ionicons name="play" size={14} color={colors.background} />
          </TouchableOpacity>
          {playlist.isCollaborative && (
            <View style={styles.collaborativeBadge}>
              <Text style={styles.collaborativeBadgeText}>COLLAB</Text>
            </View>
          )}
        </View>
        
        <View style={styles.playlistInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {playlist.title}
            </Text>
            {!playlist.isPublic && (
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textSecondary}
                style={styles.privateIcon}
              />
            )}
          </View>
          
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorText}>by {playlist.createdBy}</Text>
            {playlist.analytics?.dailyGrowth && playlist.analytics.dailyGrowth > 0 && (
              <View style={styles.growthIndicator}>
                <Ionicons name="trending-up" size={8} color={colors.success} />
                <Text style={styles.growthText}>+{playlist.analytics.dailyGrowth}%</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="musical-notes" size={12} color={colors.textSecondary} />
              <Text style={styles.metadataText}>{playlist.trackCount} tracks</Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="time" size={12} color={colors.textSecondary} />
              <Text style={styles.metadataText}>{formatDuration(playlist.duration)}</Text>
            </View>
            {playlist.analytics && (
              <View style={styles.metadataItem}>
                <Ionicons name="headset" size={12} color={colors.textSecondary} />
                <Text style={styles.metadataText}>
                  {formatNumber(playlist.analytics.totalPlays)} plays
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {playlist.description && viewMode === 'detailed' && (
        <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 2}>
          {playlist.description}
          {playlist.description.length > 100 && !showFullDescription && (
            <Text style={styles.readMore} onPress={() => setShowFullDescription(true)}>
              {' '}Read more
            </Text>
          )}
        </Text>
      )}

      {(playlist.tags || playlist.mood) && viewMode === 'detailed' && (
        <View style={styles.tagsContainer}>
          {playlist.mood && (
            <View style={[styles.moodTag, { backgroundColor: getMoodColor(playlist.mood) }]}>
              <Ionicons name={getMoodIcon(playlist.mood) as any} size={10} color={colors.background} />
              <Text style={styles.moodText}>{playlist.mood}</Text>
            </View>
          )}
          {playlist.tags?.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {playlist.isCollaborative && playlist.collaborators && viewMode === 'detailed' && (
        <View style={styles.collaboratorsRow}>
          <View style={styles.collaboratorAvatars}>
            {playlist.collaborators.slice(0, 4).map((collaborator, index) => (
              <Image
                key={collaborator.id}
                source={{ uri: collaborator.avatar }}
                style={[
                  styles.collaboratorAvatar,
                  index === 0 && styles.firstCollaboratorAvatar,
                ]}
              />
            ))}
          </View>
          <Text style={styles.collaboratorCount}>
            {playlist.collaborators.length} collaborator{playlist.collaborators.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {playlist.analytics && viewMode === 'detailed' && (
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>
              {formatNumber(playlist.analytics.uniqueListeners)}
            </Text>
            <Text style={styles.analyticsLabel}>Listeners</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>
              {playlist.analytics.completionRate}%
            </Text>
            <Text style={styles.analyticsLabel}>Completion</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>
              {Math.round(playlist.analytics.averageListenTime / 60)}m
            </Text>
            <Text style={styles.analyticsLabel}>Avg. Time</Text>
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons
              name={playlist.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={playlist.isLiked ? colors.error : colors.textSecondary}
            />
            <Text style={[
              styles.actionText,
              playlist.isLiked && styles.actionTextActive,
            ]}>
              {formatNumber(playlist.likes)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>{formatNumber(playlist.shares)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightActions}>
          {playlist.analytics && playlist.isOwner && (
            <TouchableOpacity style={styles.actionButton} onPress={onAnalytics}>
              <Ionicons name="analytics-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {playlist.isCollaborative && (
            <TouchableOpacity style={styles.actionButton} onPress={onCollaborate}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}