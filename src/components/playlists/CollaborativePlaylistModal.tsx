import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  Image,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Collaborator {
  id: string;
  address: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive: string;
  contributions: number;
}

interface PlaylistPermissions {
  canAddTracks: boolean;
  canRemoveTracks: boolean;
  canEditPlaylist: boolean;
  canInviteOthers: boolean;
  canManageRoles: boolean;
}

interface CollaborativePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  playlistId: string;
  playlistTitle: string;
  isOwner: boolean;
}

export default function CollaborativePlaylistModal({
  visible,
  onClose,
  playlistId,
  playlistTitle,
  isOwner,
}: CollaborativePlaylistModalProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'collaborators' | 'permissions' | 'invites'>('collaborators');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteAddress, setInviteAddress] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [permissions, setPermissions] = useState<PlaylistPermissions>({
    canAddTracks: true,
    canRemoveTracks: false,
    canEditPlaylist: false,
    canInviteOthers: false,
    canManageRoles: false,
  });
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadCollaborators();
      loadPendingInvites();
    }
  }, [visible, playlistId]);

  const loadCollaborators = () => {
    // Mock data - replace with actual API call
    setCollaborators([
      {
        id: '1',
        address: '0x1234...5678',
        name: 'Alice Cooper',
        avatar: 'https://picsum.photos/40/40?random=1',
        role: 'owner',
        joinedAt: '2024-01-15',
        lastActive: '2 hours ago',
        contributions: 25,
      },
      {
        id: '2',
        address: '0x9876...5432',
        name: 'Bob Dylan',
        avatar: 'https://picsum.photos/40/40?random=2',
        role: 'admin',
        joinedAt: '2024-01-18',
        lastActive: '1 day ago',
        contributions: 12,
      },
      {
        id: '3',
        address: '0x5555...7777',
        name: 'Charlie Parker',
        avatar: 'https://picsum.photos/40/40?random=3',
        role: 'editor',
        joinedAt: '2024-01-20',
        lastActive: '3 days ago',
        contributions: 8,
      },
    ]);
  };

  const loadPendingInvites = () => {
    // Mock pending invites
    setPendingInvites([
      {
        id: '1',
        address: '0xAAAA...BBBB',
        role: 'editor',
        invitedAt: '2024-01-22',
        expiresAt: '2024-02-22',
      },
      {
        id: '2',
        address: '0xCCCC...DDDD',
        role: 'viewer',
        invitedAt: '2024-01-21',
        expiresAt: '2024-02-21',
      },
    ]);
  };

  const handleInviteCollaborator = async () => {
    if (!inviteAddress.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    if (!inviteAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      Alert.alert('Error', 'Please enter a valid Ethereum address');
      return;
    }

    try {
      // Mock API call
      const newInvite = {
        id: Date.now().toString(),
        address: inviteAddress,
        role: inviteRole,
        invitedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      setPendingInvites(prev => [...prev, newInvite]);
      setInviteAddress('');
      Alert.alert('Success', 'Invitation sent successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (collaboratorId: string, newRole: string) => {
    if (!isOwner && newRole === 'owner') {
      Alert.alert('Error', 'Only the owner can transfer ownership');
      return;
    }

    Alert.alert(
      'Change Role',
      `Are you sure you want to change this collaborator's role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setCollaborators(prev =>
              prev.map(collab =>
                collab.id === collaboratorId
                  ? { ...collab, role: newRole as any }
                  : collab
              )
            );
          },
        },
      ]
    );
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    Alert.alert(
      'Remove Collaborator',
      'Are you sure you want to remove this collaborator?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return colors.primary;
      case 'admin': return colors.warning;
      case 'editor': return colors.success;
      case 'viewer': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return 'crown';
      case 'admin': return 'shield';
      case 'editor': return 'create';
      case 'viewer': return 'eye';
      default: return 'person';
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      width: '95%',
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    collaboratorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    collaboratorInfo: {
      flex: 1,
    },
    collaboratorName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    collaboratorAddress: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    collaboratorMeta: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    roleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
      textTransform: 'capitalize',
    },
    actionButton: {
      padding: 8,
    },
    inviteContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    roleSelector: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    roleSelectorButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    roleSelectorButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    roleSelectorText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    roleSelectorTextActive: {
      color: colors.background,
    },
    inviteButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    inviteButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.background,
    },
    permissionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    permissionInfo: {
      flex: 1,
      marginRight: 12,
    },
    permissionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    permissionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pendingInviteItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.warning,
      borderStyle: 'dashed',
    },
    pendingInviteInfo: {
      flex: 1,
    },
    pendingInviteAddress: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'monospace',
    },
    pendingInviteMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cancelButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.error,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
  });

  const renderCollaborators = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Collaborators ({collaborators.length})</Text>
        {collaborators.map((collaborator) => (
          <View key={collaborator.id} style={styles.collaboratorItem}>
            <Image source={{ uri: collaborator.avatar }} style={styles.avatar} />
            <View style={styles.collaboratorInfo}>
              <Text style={styles.collaboratorName}>{collaborator.name}</Text>
              <Text style={styles.collaboratorAddress}>{collaborator.address}</Text>
              <Text style={styles.collaboratorMeta}>
                Joined {collaborator.joinedAt} • {collaborator.contributions} contributions
              </Text>
            </View>
            
            <View style={[styles.roleContainer, { backgroundColor: getRoleColor(collaborator.role) + '20' }]}>
              <Ionicons 
                name={getRoleIcon(collaborator.role) as any} 
                size={12} 
                color={getRoleColor(collaborator.role)} 
              />
              <Text style={[styles.roleText, { color: getRoleColor(collaborator.role) }]}>
                {collaborator.role}
              </Text>
            </View>

            {isOwner && collaborator.role !== 'owner' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRemoveCollaborator(collaborator.id)}
              >
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPermissions = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collaboration Permissions</Text>
        
        {Object.entries({
          canAddTracks: {
            title: 'Add Tracks',
            description: 'Allow collaborators to add new tracks to the playlist',
          },
          canRemoveTracks: {
            title: 'Remove Tracks',
            description: 'Allow collaborators to remove tracks from the playlist',
          },
          canEditPlaylist: {
            title: 'Edit Playlist',
            description: 'Allow collaborators to edit playlist title and description',
          },
          canInviteOthers: {
            title: 'Invite Others',
            description: 'Allow collaborators to invite new people to collaborate',
          },
          canManageRoles: {
            title: 'Manage Roles',
            description: 'Allow collaborators to change other users\' roles',
          },
        }).map(([key, config]) => (
          <View key={key} style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>{config.title}</Text>
              <Text style={styles.permissionDescription}>{config.description}</Text>
            </View>
            <Switch
              value={permissions[key as keyof PlaylistPermissions]}
              onValueChange={(value) => setPermissions(prev => ({ ...prev, [key]: value }))}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={permissions[key as keyof PlaylistPermissions] ? colors.primary : colors.textSecondary}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderInvites = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite New Collaborator</Text>
        <View style={styles.inviteContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter wallet address (0x...)"
            placeholderTextColor={colors.textSecondary}
            value={inviteAddress}
            onChangeText={setInviteAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.roleSelector}>
            {(['editor', 'viewer'] as const).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleSelectorButton,
                  inviteRole === role && styles.roleSelectorButtonActive,
                ]}
                onPress={() => setInviteRole(role)}
              >
                <Text style={[
                  styles.roleSelectorText,
                  inviteRole === role && styles.roleSelectorTextActive,
                ]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.inviteButton} onPress={handleInviteCollaborator}>
            <Text style={styles.inviteButtonText}>Send Invitation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pendingInvites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Invitations ({pendingInvites.length})</Text>
          {pendingInvites.map((invite) => (
            <View key={invite.id} style={styles.pendingInviteItem}>
              <View style={styles.pendingInviteInfo}>
                <Text style={styles.pendingInviteAddress}>{invite.address}</Text>
                <Text style={styles.pendingInviteMeta}>
                  Role: {invite.role} • Expires: {invite.expiresAt}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPendingInvites(prev => prev.filter(i => i.id !== invite.id))}
              >
                <Ionicons name="close" size={16} color={colors.background} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{playlistTitle}</Text>
              <Text style={styles.subtitle}>Collaboration Settings</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            {[
              { key: 'collaborators', label: 'Collaborators', icon: 'people' },
              { key: 'permissions', label: 'Permissions', icon: 'shield-checkmark' },
              { key: 'invites', label: 'Invites', icon: 'mail' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.key ? colors.primary : colors.textSecondary}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.content}>
            {activeTab === 'collaborators' && renderCollaborators()}
            {activeTab === 'permissions' && renderPermissions()}
            {activeTab === 'invites' && renderInvites()}
          </View>
        </View>
      </View>
    </Modal>
  );
}