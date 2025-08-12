import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CollaborationProject, collaborationService } from '../../services/collaborationService';

interface CollaborationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  project: CollaborationProject;
  onProjectAccepted?: (projectId: string) => void;
  onProjectCompleted?: (projectId: string) => void;
}

interface MediaContent {
  id: string;
  type: 'audio' | 'video' | 'image';
  url: string;
  createdAt: number;
  version: number;
  uploadedBy: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface Update {
  id: string;
  content: string;
  createdAt: number;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  mediaContent?: MediaContent;
}

export default function CollaborationDetailModal({
  visible,
  onClose,
  project,
  onProjectAccepted,
  onProjectCompleted,
}: CollaborationDetailModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuth();
  const [update, setUpdate] = useState('');
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState(project.status);
  const [isEditing, setIsEditing] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalContent, setOriginalContent] = useState<MediaContent | null>(null);
  const [mediaVersions, setMediaVersions] = useState<MediaContent[]>([]);
  const [hasAccepted, setHasAccepted] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Calculate time-based progress based on lastActivity -> deadline window when pending
  useEffect(() => {
    if (project.deadline && status === 'pending') {
      const startTime = project.lastActivity || Date.now();
      const endTime = new Date(project.deadline).getTime();
      
      const updateTimeProgress = () => {
        const currentTime = Date.now();
        const totalDuration = Math.max(endTime - startTime, 1);
        const elapsed = Math.max(currentTime - startTime, 0);
        const timeProgress = Math.min(Math.floor((elapsed / totalDuration) * 100), 100);
        setProgress(timeProgress);
      };
      
      // Update progress every minute
      updateTimeProgress();
      progressInterval.current = setInterval(updateTimeProgress, 60000);
      
      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      };
    }
  }, [project.deadline, project.lastActivity, status]);

  // Anyone can accept a collaboration when it's active
  const canAcceptAndPay = status === 'active';
  // Only collaborators who've paid can upload; treat owner and recent acceptors as eligible uploaders
  const isCollaborator = project.collaborators.some(c => c.id === user?.id);
  const isOwner = user?.id === project.owner.id;
  const canUploadContent = status === 'pending' && (isCollaborator || isOwner || hasAccepted);

  console.log('Status:', status, 'User:', user?.id, 'Owner:', project.owner.id, 'Collaborators:', project.collaborators.map(c=>c.id), 'isCollaborator:', isCollaborator, 'hasAccepted:', hasAccepted, 'Can Pay:', canAcceptAndPay, 'Can Upload:', canUploadContent);


  useEffect(() => {
    loadUpdates();
    const subscription = collaborationService.subscribeToProjectUpdates(project.id, () => {
      loadUpdates();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [project.id]);

  const loadUpdates = async () => {
    try {
      const data = await collaborationService.getProjectUpdates(project.id);
      setUpdates(data);
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!update.trim()) return;

    try {
      await collaborationService.addUpdate(project.id, user!.id, update.trim());
      setUpdate('');
      await loadUpdates();
    } catch (error) {
      console.error('Error adding update:', error);
      Alert.alert('Error', 'Failed to add update. Please try again.');
    }
  };

  const handleSaveChanges = async () => {
    if (!isOwner) return;
    setIsSaving(true);

    try {
      await collaborationService.updateProject(project.id, user!.id, {
        status: status as any,
        progress,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const styles = StyleSheet.create({
    modalView: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 30,
      maxHeight: '90%',
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: themeColors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
    },
    closeButton: {
      padding: 8,
    },
    section: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    ctaSection: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonTextPrimary: { color: 'white', fontSize: 16, fontWeight: '600' },
    buttonTextSecondary: { color: themeColors.text, fontSize: 16, fontWeight: '600' },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    value: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
    },
    collaboratorsList: {
      marginTop: 12,
    },
    collaborator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
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
      fontSize: 16,
      fontWeight: 'bold',
    },
    collaboratorInfo: {
      flex: 1,
    },
    collaboratorName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    collaboratorRole: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    progressContainer: {
      marginVertical: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: themeColors.border,
      borderRadius: 4,
      marginTop: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    inputContainer: {
      marginTop: 16,
    },
    input: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 12,
      color: themeColors.text,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      minHeight: 80,
    },
    sendButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    sendButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    updatesList: {
      marginTop: 12,
    },
    update: {
      marginBottom: 16,
    },
    updateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    updateAuthor: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    updateTime: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 8,
    },
    updateContent: {
      fontSize: 14,
      color: themeColors.text,
      lineHeight: 20,
    },
    mediaContainer: {
      height: 200,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: themeColors.surface,
      marginTop: 12,
    },
    mediaContent: {
      width: '100%',
      height: '100%',
    },
    versionsScroll: {
      marginTop: 12,
    },
    versionCard: {
      width: 120,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: themeColors.surface,
      padding: 8,
      alignItems: 'center',
    },
    versionThumbnail: {
      width: 100,
      height: 100,
      borderRadius: 8,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    versionText: {
      fontSize: 12,
      color: themeColors.text,
      marginTop: 4,
      fontWeight: '600',
    },
    versionDate: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    editButton: {
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      padding: 8,
      marginLeft: 8,
    },
    statusPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    statusOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    statusOptionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    progressInput: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    progressSlider: {
      flex: 1,
      height: 40,
    },
    progressText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      width: 48,
      textAlign: 'right',
    },
    saveButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const onAcceptAndPay = async () => {
    if (!user || !canAcceptAndPay) return;
    try {
      setIsPaying(true);
      // TODO: Integrate real payment flow. For now, simulate success.
      await new Promise((res) => setTimeout(res, 1200));
      // Update status in database
      await collaborationService.updateProject(project.id, user.id, {
        status: 'pending',
        progress: 0
      });
      setStatus('pending');
      setHasAccepted(true);
      onProjectAccepted?.(project.id);
      Alert.alert('Success', 'Collaboration fee paid. Ready for content upload.');
    } catch (e) {
      console.error('Payment failed:', e);
      Alert.alert('Payment Failed', 'Unable to process payment. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const onUploadContent = async () => {
    if (!user || !canUploadContent) return;
    
    try {
      // Request media permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant media access permissions to upload content.');
          return;
        }
      }
      
      // Pick media file
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });
      
      if (!result.canceled) {
        setIsUploading(true);
        const asset = result.assets[0];
        
        // Determine media type
        const type = asset.type || 'image';
        
        // Upload to storage service (simulated)
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(res => setTimeout(res, 150));
        }
        
        // Create new media version
        const newVersion: MediaContent = {
          id: Date.now().toString(),
          type: type as 'audio' | 'video' | 'image',
          url: asset.uri,
          createdAt: Date.now(),
          version: mediaVersions.length + 1,
          uploadedBy: {
            id: user.id,
            displayName: (user as any).displayName || user.email?.split('@')[0] || 'User',
            avatarUrl: (user as any).avatarUrl
          }
        };
        
        setMediaVersions(prev => [...prev, newVersion]);
        
        // Add media update to database
        await collaborationService.addUpdate(
          project.id,
          user.id,
          `Uploaded new ${type} version ${newVersion.version}`,
          newVersion // This will be stored as JSONB in media_content column
        );
        
        if (status === 'pending') {
          // Update project status in database
          await collaborationService.updateProject(project.id, user.id, {
            status: 'completed',
            progress: 100
          });
          setStatus('completed');
          setProgress(100);
          onProjectCompleted?.(project.id);
          
          // Add completion update
          await collaborationService.addUpdate(
            project.id,
            user.id,
            'Content uploaded. Collaboration completed.'
          );
        }
        
        Alert.alert('Success', 'Content uploaded successfully!');
        await loadUpdates();
      }
    } catch (e) {
      console.error('Upload failed:', e);
      Alert.alert('Upload Failed', 'Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = (projectStatus: string) => {
    switch (projectStatus) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalView}>
        <View style={styles.container}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>{project.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.infoRow}>
                <View
                  style={[
                    styles.progressBar,
                    { flex: 1, marginRight: 12, backgroundColor: themeColors.border + '40' }
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: getStatusColor(status),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.value, { color: getStatusColor(status) }]}>
                  {status.toUpperCase()} • {progress}%
                </Text>
              </View>
            </View>

            {/* Action Buttons based on state */}
            <View style={styles.ctaSection}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.ctaRow}>
                {canAcceptAndPay && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onAcceptAndPay}
                    disabled={isPaying}
                  >
                    {isPaying ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonTextPrimary}>Accept & Pay</Text>
                    )}
                  </TouchableOpacity>
                )}
                {canUploadContent && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onUploadContent}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonTextPrimary}>Upload Content</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {isUploading && (
                <View style={[styles.progressBar, { marginTop: 12 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${uploadProgress}%`,
                        backgroundColor: themeColors.primary,
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Project Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>
                  {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Genre</Text>
                <Text style={styles.value}>{project.genre || 'Not specified'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Status</Text>
                {isEditing ? (
                  <View style={styles.statusPicker}>
                    {['active', 'completed', 'pending', 'cancelled'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusOption,
                          {
                            borderColor: getStatusColor(s),
                            backgroundColor: status === s ? getStatusColor(s) : 'transparent',
                          },
                        ]}
                        onPress={() => setStatus(s as any)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            {
                              color: status === s ? 'white' : getStatusColor(s),
                            },
                          ]}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.statusOption,
                      {
                        borderColor: getStatusColor(status),
                        backgroundColor: getStatusColor(status) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                )}
              </View>

              {project.deadline && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Deadline</Text>
                  <Text style={styles.value}>
                    {new Date(project.deadline).toLocaleDateString()}
                  </Text>
                </View>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Progress</Text>
                  {isEditing ? (
                    <View style={styles.progressInput}>
                      <TextInput
                        style={[styles.value, styles.progressText]}
                        value={String(progress)}
                        onChangeText={(text) => {
                          const num = parseInt(text, 10);
                          if (!isNaN(num) && num >= 0 && num <= 100) {
                            setProgress(num);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                      <Text style={styles.value}>%</Text>
                    </View>
                  ) : (
                    <Text style={styles.value}>{progress}%</Text>
                  )}
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: getStatusColor(status),
                      },
                    ]}
                  />
                </View>
              </View>

              {isOwner && !isEditing && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="pencil" size={20} color={themeColors.primary} />
                </TouchableOpacity>
              )}

              {isEditing && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team</Text>
              <View style={styles.collaboratorsList}>
                <View style={styles.collaborator}>
                  {project.owner.avatarUrl ? (
                    <Image
                      source={{ uri: project.owner.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {project.owner.displayName.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.collaboratorInfo}>
                    <Text style={styles.collaboratorName}>
                      {project.owner.displayName}
                    </Text>
                    <Text style={styles.collaboratorRole}>Owner</Text>
                  </View>
                  <Ionicons name="star" size={20} color={themeColors.warning} />
                </View>

                {project.collaborators.map((collaborator) => (
                  <View key={collaborator.id} style={styles.collaborator}>
                    {collaborator.avatarUrl ? (
                      <Image
                        source={{ uri: collaborator.avatarUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {collaborator.displayName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.collaboratorInfo}>
                      <Text style={styles.collaboratorName}>
                        {collaborator.displayName}
                      </Text>
                      <Text style={styles.collaboratorRole}>
                        {collaborator.role}
                      </Text>
                    </View>
                    {collaborator.status === 'inactive' && (
                      <Ionicons
                        name="moon"
                        size={20}
                        color={themeColors.textSecondary}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Media Versions */}
            {mediaVersions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Content Versions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.versionsScroll}>
                  {mediaVersions.map((version) => (
                    <View key={version.id} style={styles.versionCard}>
                      {version.type === 'image' ? (
                        <Image 
                          source={{ uri: version.url }}
                          style={styles.versionThumbnail}
                        />
                      ) : (
                        <View style={styles.versionThumbnail}>
                          <Ionicons 
                            name={version.type === 'video' ? 'videocam' : 'musical-notes'}
                            size={24}
                            color={themeColors.primary}
                          />
                        </View>
                      )}
                      <Text style={styles.versionText}>Version {version.version}</Text>
                      <Text style={styles.versionDate}>
                        {new Date(version.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Updates</Text>
              {isLoading ? (
                <ActivityIndicator color={themeColors.primary} />
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Share an update..."
                      placeholderTextColor={themeColors.textSecondary}
                      multiline
                      value={update}
                      onChangeText={setUpdate}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        !update.trim() && { opacity: 0.6 },
                      ]}
                      onPress={handleUpdateSubmit}
                      disabled={!update.trim()}
                    >
                      <Text style={styles.sendButtonText}>Post Update</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.updatesList}>
                    {updates.map((update) => (
                      <View key={update.id} style={styles.update}>
                        <View style={styles.updateHeader}>
                          <Text style={styles.updateAuthor}>
                            {update.user.displayName}
                          </Text>
                          <Text style={styles.updateTime}>
                            {formatDate(update.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.updateContent}>{update.content}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
