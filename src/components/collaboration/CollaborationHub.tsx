import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

export interface CollaborationProject {
  id: string;
  title: string;
  type: 'song' | 'album' | 'playlist' | 'remix';
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  progress: number;
  lastActivity: number;
  collaborators: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
    status: 'active' | 'inactive';
  }>;
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  description?: string;
  deadline?: number;
  genre?: string;
}

interface CollaborationHubProps {
  projects?: CollaborationProject[];
  onRefresh?: () => void;
  onProjectPress?: (project: CollaborationProject) => void;
  onCreateProject?: () => void;
  isRefreshing?: boolean;
  userRole?: 'owner' | 'collaborator' | 'all';
}

export default function CollaborationHub({
  projects = [],
  onRefresh,
  onProjectPress,
  onCreateProject,
  isRefreshing = false,
  userRole = 'all',
}: CollaborationHubProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

// Development sample data for empty state preview in dev only
const DEV_MODE = process.env.NODE_ENV === 'development';
  const sampleProjects: CollaborationProject[] = [
    {
      id: '1',
      title: 'Midnight Vibes Remix',
      type: 'remix',
      status: 'active',
      progress: 75,
      lastActivity: Date.now() - 3600000,
      owner: {
        id: 'user1',
        username: 'beatmaster_pro',
        displayName: 'Beat Master',
        avatarUrl: 'https://via.placeholder.com/40x40?text=BM',
      },
      collaborators: [
        {
          id: 'user2',
          username: 'vocal_queen',
          displayName: 'Sarah Vocals',
          avatarUrl: 'https://via.placeholder.com/40x40?text=SV',
          role: 'Vocalist',
          status: 'active',
        },
        {
          id: 'user3',
          username: 'mix_engineer',
          displayName: 'Mix Pro',
          avatarUrl: 'https://via.placeholder.com/40x40?text=MP',
          role: 'Mixing Engineer',
          status: 'inactive',
        },
      ],
      description: 'Creating a chill house remix of the original track',
      deadline: Date.now() + 604800000, // 1 week
      genre: 'House',
    },
    {
      id: '2',
      title: 'Future Sounds Album',
      type: 'album',
      status: 'pending',
      progress: 25,
      lastActivity: Date.now() - 86400000,
      owner: {
        id: 'user4',
        username: 'electrowave',
        displayName: 'ElectroWave',
        avatarUrl: 'https://via.placeholder.com/40x40?text=EW',
      },
      collaborators: [
        {
          id: 'user5',
          username: 'synthking',
          displayName: 'Synth King',
          avatarUrl: 'https://via.placeholder.com/40x40?text=SK',
          role: 'Synthesizer',
          status: 'active',
        },
      ],
      description: 'Collaborative album exploring futuristic electronic sounds',
      genre: 'Electronic',
    },
    {
      id: '3',
      title: 'Acoustic Sessions',
      type: 'song',
      status: 'completed',
      progress: 100,
      lastActivity: Date.now() - 172800000,
      owner: {
        id: 'user6',
        username: 'acoustic_soul',
        displayName: 'Acoustic Soul',
        avatarUrl: 'https://via.placeholder.com/40x40?text=AS',
      },
      collaborators: [
        {
          id: 'user7',
          username: 'guitar_master',
          displayName: 'Guitar Master',
          avatarUrl: 'https://via.placeholder.com/40x40?text=GM',
          role: 'Guitarist',
          status: 'active',
        },
      ],
      description: 'Beautiful acoustic collaboration with guitar accompaniment',
      genre: 'Acoustic',
    },
  ];

  const displayProjects = projects.length > 0 ? projects : (DEV_MODE ? sampleProjects : []);

  const filteredProjects = displayProjects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const getStatusColor = (status: CollaborationProject['status']) => {
    switch (status) {
      case 'active':
        return themeColors.success;
      case 'completed':
        return themeColors.primary;
      case 'pending':
        return themeColors.warning;
      case 'cancelled':
        return themeColors.error;
      default:
        return themeColors.textSecondary;
    }
  };

  const getTypeIcon = (type: CollaborationProject['type']) => {
    switch (type) {
      case 'song':
        return 'musical-note';
      case 'album':
        return 'albums';
      case 'playlist':
        return 'list';
      case 'remix':
        return 'shuffle';
      default:
        return 'musical-notes';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderProject = ({ item }: { item: CollaborationProject }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => onProjectPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectTitleContainer}>
          <View style={[styles.typeIcon, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Ionicons
              name={getTypeIcon(item.type) as any}
              size={16}
              color={getStatusColor(item.status)}
            />
          </View>
          <View style={styles.projectTitleText}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.projectType}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              {item.genre && ` • ${item.genre}`}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{item.progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.progress}%`,
                backgroundColor: getStatusColor(item.status),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.collaboratorsContainer}>
        <View style={styles.collaboratorsList}>
          <View style={styles.ownerContainer}>
            {item.owner.avatarUrl ? (
              <Image source={{ uri: item.owner.avatarUrl }} style={styles.collaboratorAvatar} />
            ) : (
              <View style={styles.collaboratorAvatarPlaceholder}>
                <Text style={styles.collaboratorAvatarText}>
                  {item.owner.displayName.slice(0, 1)}
                </Text>
              </View>
            )}
            <View style={styles.ownerBadge}>
              <Ionicons name="star" size={8} color="white" />
            </View>
          </View>
          
          {item.collaborators.slice(0, 3).map((collaborator, index) => (
            <View key={collaborator.id} style={[styles.collaboratorContainer, { marginLeft: -8 }]}>
              {collaborator.avatarUrl ? (
                <Image source={{ uri: collaborator.avatarUrl }} style={styles.collaboratorAvatar} />
              ) : (
                <View style={styles.collaboratorAvatarPlaceholder}>
                  <Text style={styles.collaboratorAvatarText}>
                    {collaborator.displayName.slice(0, 1)}
                  </Text>
                </View>
              )}
              {collaborator.status === 'inactive' && (
                <View style={styles.inactiveOverlay} />
              )}
            </View>
          ))}
          
          {item.collaborators.length > 3 && (
            <View style={[styles.moreCollaborators, { marginLeft: -8 }]}>
              <Text style={styles.moreCollaboratorsText}>
                +{item.collaborators.length - 3}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.lastActivity}>
          {formatTimeAgo(item.lastActivity)}
        </Text>
      </View>

      {item.deadline && item.status === 'active' && (
        <View style={styles.deadlineContainer}>
          <Ionicons name="time" size={14} color={themeColors.warning} />
          <Text style={styles.deadlineText}>
            Due {new Date(item.deadline).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={themeColors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Collaborations</Text>
      <Text style={styles.emptyStateMessage}>
        {filter === 'all' 
          ? "Start collaborating with other artists to create amazing music together"
          : `No ${filter} collaborations found`}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.surface,
      marginTop: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    filterContainer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: themeColors.surface,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
    activeFilterButtonText: {
      color: 'white',
    },
    content: {
      flex: 1,
    },
    projectCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    projectTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    typeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    projectTitleText: {
      flex: 1,
    },
    projectTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    projectType: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    statusContainer: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    projectDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    progressLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    progressValue: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
    progressBar: {
      height: 4,
      backgroundColor: themeColors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    collaboratorsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    collaboratorsList: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ownerContainer: {
      position: 'relative',
    },
    collaboratorContainer: {
      position: 'relative',
    },
    collaboratorAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: themeColors.surface,
    },
    collaboratorAvatarPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: themeColors.surface,
    },
    collaboratorAvatarText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    ownerBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: themeColors.warning,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inactiveOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 14,
    },
    moreCollaborators: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: themeColors.surface,
    },
    moreCollaboratorsText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: themeColors.textSecondary,
    },
    lastActivity: {
      fontSize: 11,
      color: themeColors.textSecondary,
    },
    deadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    deadlineText: {
      fontSize: 12,
      color: themeColors.warning,
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    createButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    createButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collaborations</Text>
      </View>

      <View style={styles.filterContainer}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              filter === option.key && styles.activeFilterButton,
            ]}
            onPress={() => setFilter(option.key as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === option.key && styles.activeFilterButtonText,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {filteredProjects.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredProjects}
            renderItem={renderProject}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={themeColors.primary}
                />
              ) : undefined
            }
          />
        )}
      </View>
    </View>
  );
}