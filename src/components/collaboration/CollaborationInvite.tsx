import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface Collaborator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isFollowing?: boolean;
  skills?: string[];
}

interface CollaborationInviteProps {
  isVisible: boolean;
  onClose: () => void;
  projectTitle: string;
  projectType: 'song' | 'album' | 'playlist' | 'remix';
  onSendInvite: (collaborators: Collaborator[], message: string, permissions: string[]) => void;
  suggestedCollaborators?: Collaborator[];
}

export default function CollaborationInvite({
  isVisible,
  onClose,
  projectTitle,
  projectType,
  onSendInvite,
  suggestedCollaborators = [],
}: CollaborationInviteProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['edit']);
  const [isLoading, setIsLoading] = useState(false);

  // Sample collaborators if none provided
  const defaultCollaborators: Collaborator[] = [
    {
      id: '1',
      username: 'beatmaster_pro',
      displayName: 'Beat Master',
      avatarUrl: 'https://via.placeholder.com/40x40?text=BM',
      isFollowing: true,
      skills: ['Producer', 'Mixing'],
    },
    {
      id: '2',
      username: 'vocal_queen',
      displayName: 'Sarah Vocals',
      avatarUrl: 'https://via.placeholder.com/40x40?text=SV',
      isFollowing: false,
      skills: ['Vocalist', 'Songwriter'],
    },
    {
      id: '3',
      username: 'synthwave_king',
      displayName: 'Synth King',
      avatarUrl: 'https://via.placeholder.com/40x40?text=SK',
      isFollowing: true,
      skills: ['Synthesizer', 'Sound Design'],
    },
    {
      id: '4',
      username: 'drum_wizard',
      displayName: 'Drum Wizard',
      avatarUrl: 'https://via.placeholder.com/40x40?text=DW',
      isFollowing: false,
      skills: ['Drummer', 'Percussion'],
    },
  ];

  const collaborators = suggestedCollaborators.length > 0 ? suggestedCollaborators : defaultCollaborators;

  const filteredCollaborators = collaborators.filter(collaborator =>
    collaborator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collaborator.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const permissionOptions = [
    { id: 'view', label: 'View Only', description: 'Can listen and comment' },
    { id: 'edit', label: 'Edit', description: 'Can make changes to the project' },
    { id: 'manage', label: 'Manage', description: 'Can invite others and manage settings' },
  ];

  const toggleCollaborator = (collaborator: Collaborator) => {
    setSelectedCollaborators(prev => {
      const isSelected = prev.find(c => c.id === collaborator.id);
      if (isSelected) {
        return prev.filter(c => c.id !== collaborator.id);
      } else {
        return [...prev, collaborator];
      }
    });
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSendInvite = async () => {
    if (selectedCollaborators.length === 0) {
      Alert.alert('Error', 'Please select at least one collaborator');
      return;
    }

    if (selectedPermissions.length === 0) {
      Alert.alert('Error', 'Please select at least one permission level');
      return;
    }

    setIsLoading(true);
    try {
      await onSendInvite(selectedCollaborators, inviteMessage, selectedPermissions);
      
      // Reset form
      setSelectedCollaborators([]);
      setInviteMessage('');
      setSearchQuery('');
      onClose();
      
      Alert.alert('Success', 'Collaboration invites sent successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send collaboration invites');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCollaborator = ({ item }: { item: Collaborator }) => {
    const isSelected = selectedCollaborators.find(c => c.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.collaboratorItem, isSelected && styles.selectedCollaboratorItem]}
        onPress={() => toggleCollaborator(item)}
      >
        <View style={styles.collaboratorContent}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.collaboratorInfo}>
            <Text style={styles.displayName}>{item.displayName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            {item.skills && (
              <View style={styles.skillsContainer}>
                {item.skills.slice(0, 2).map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.collaboratorActions}>
            {item.isFollowing && (
              <View style={styles.followingBadge}>
                <Ionicons name="checkmark" size={12} color={themeColors.success} />
                <Text style={styles.followingText}>Following</Text>
              </View>
            )}
            <View style={[styles.checkbox, isSelected && styles.checkedCheckbox]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      minHeight: '60%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerContent: {
      flex: 1,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    searchContainer: {
      marginBottom: 20,
    },
    searchInput: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
    },
    collaboratorsList: {
      maxHeight: 200,
    },
    collaboratorItem: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedCollaboratorItem: {
      borderColor: themeColors.primary,
      backgroundColor: `${themeColors.primary}10`,
    },
    collaboratorContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    collaboratorInfo: {
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    username: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    skillsContainer: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 4,
    },
    skillTag: {
      backgroundColor: themeColors.background,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    skillText: {
      fontSize: 10,
      color: themeColors.textSecondary,
    },
    collaboratorActions: {
      alignItems: 'flex-end',
      gap: 8,
    },
    followingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${themeColors.success}20`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 2,
    },
    followingText: {
      fontSize: 10,
      color: themeColors.success,
      fontWeight: '600',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: themeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkedCheckbox: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    permissionsContainer: {
      gap: 8,
    },
    permissionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedPermission: {
      borderColor: themeColors.primary,
      backgroundColor: `${themeColors.primary}10`,
    },
    permissionContent: {
      flex: 1,
      marginLeft: 12,
    },
    permissionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    permissionDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    messageContainer: {
      marginBottom: 24,
    },
    messageInput: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
      height: 80,
      textAlignVertical: 'top',
    },
    selectedCollaborators: {
      marginBottom: 16,
    },
    selectedCollaboratorsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectedCollaboratorChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.primary,
      borderRadius: 16,
      paddingLeft: 4,
      paddingRight: 8,
      paddingVertical: 4,
      gap: 4,
    },
    selectedCollaboratorName: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    removeButton: {
      padding: 2,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    sendButton: {
      backgroundColor: themeColors.primary,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: themeColors.text,
    },
    sendButtonText: {
      color: 'white',
    },
  });

  return (
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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Invite Collaborators</Text>
            <Text style={styles.headerSubtitle}>
              For {projectType}: {projectTitle}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for collaborators..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {selectedCollaborators.length > 0 && (
            <View style={styles.selectedCollaborators}>
              <Text style={styles.sectionTitle}>
                Selected ({selectedCollaborators.length})
              </Text>
              <View style={styles.selectedCollaboratorsList}>
                {selectedCollaborators.map(collaborator => (
                  <View key={collaborator.id} style={styles.selectedCollaboratorChip}>
                    {collaborator.avatarUrl ? (
                      <Image source={{ uri: collaborator.avatarUrl }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                    ) : (
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 8 }}>
                          {collaborator.displayName.slice(0, 1)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.selectedCollaboratorName}>
                      {collaborator.displayName}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => toggleCollaborator(collaborator)}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Collaborators</Text>
            <FlatList
              style={styles.collaboratorsList}
              data={filteredCollaborators}
              renderItem={renderCollaborator}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.permissionsContainer}>
              {permissionOptions.map(permission => (
                <TouchableOpacity
                  key={permission.id}
                  style={[
                    styles.permissionOption,
                    selectedPermissions.includes(permission.id) && styles.selectedPermission,
                  ]}
                  onPress={() => togglePermission(permission.id)}
                >
                  <View style={[
                    styles.checkbox,
                    selectedPermissions.includes(permission.id) && styles.checkedCheckbox,
                  ]}>
                    {selectedPermissions.includes(permission.id) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View style={styles.permissionContent}>
                    <Text style={styles.permissionLabel}>{permission.label}</Text>
                    <Text style={styles.permissionDescription}>{permission.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.sectionTitle}>Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Add a personal message to your invitation..."
              placeholderTextColor={themeColors.textSecondary}
              value={inviteMessage}
              onChangeText={setInviteMessage}
              multiline
              maxLength={500}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.sendButton,
                (selectedCollaborators.length === 0 || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendInvite}
              disabled={selectedCollaborators.length === 0 || isLoading}
            >
              <Text style={[styles.buttonText, styles.sendButtonText]}>
                {isLoading ? 'Sending...' : `Send Invites (${selectedCollaborators.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}