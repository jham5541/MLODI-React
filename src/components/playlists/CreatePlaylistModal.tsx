import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, colors } from '../../context/ThemeContext';

interface CreatePlaylistModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreatePlaylist: (playlist: {
    name: string;
    description: string;
    isPrivate: boolean;
    coverImage: string | null;
    isCollaborative: boolean;
  }) => void;
}

export default function CreatePlaylistModal({
  isVisible,
  onClose,
  onCreatePlaylist,
}: CreatePlaylistModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    setIsLoading(true);
    try {
      await onCreatePlaylist({
        name: name.trim(),
        description: description.trim(),
        isPrivate,
        coverImage,
        isCollaborative,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(false);
      setIsCollaborative(false);
      setCoverImage(null);
      onClose();
      
      Alert.alert('Success', 'Playlist created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'center',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      marginHorizontal: 20,
      borderRadius: 20,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    coverSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    coverImageContainer: {
      width: 120,
      height: 120,
      borderRadius: 12,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: themeColors.border,
      borderStyle: 'dashed',
    },
    coverImage: {
      width: 120,
      height: 120,
      borderRadius: 12,
    },
    coverPlaceholder: {
      alignItems: 'center',
    },
    coverText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 8,
    },
    inputSection: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    switchSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      marginBottom: 12,
    },
    switchLabel: {
      flex: 1,
    },
    switchTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      marginBottom: 2,
    },
    switchDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
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
    createButton: {
      backgroundColor: themeColors.primary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: themeColors.text,
    },
    createButtonText: {
      color: 'white',
    },
  });

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalContainer}
      avoidKeyboard
    >
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Playlist</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          <View style={styles.coverSection}>
            <TouchableOpacity
              style={styles.coverImageContainer}
              onPress={pickImage}
            >
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="camera" size={32} color={themeColors.textSecondary} />
                  <Text style={styles.coverText}>Add Cover</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.coverText}>Tap to add a cover image</Text>
          </View>

          {/* Playlist Name */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Playlist Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter playlist name"
              placeholderTextColor={themeColors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your playlist..."
              placeholderTextColor={themeColors.textSecondary}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              multiline
            />
          </View>

          {/* Privacy Settings */}
          <View style={styles.switchSection}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchTitle}>Private Playlist</Text>
              <Text style={styles.switchDescription}>
                Only you can see and edit this playlist
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          {/* Collaborative Settings */}
          <View style={styles.switchSection}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchTitle}>Collaborative</Text>
              <Text style={styles.switchDescription}>
                Allow others to add songs to this playlist
              </Text>
            </View>
            <Switch
              value={isCollaborative}
              onValueChange={setIsCollaborative}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                (isLoading || !name.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleCreate}
              disabled={isLoading || !name.trim()}
            >
              <Text style={[styles.buttonText, styles.createButtonText]}>
                {isLoading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}