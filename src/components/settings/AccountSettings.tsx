import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';

interface AccountSettingsProps {
  onSave?: (data: any) => void;
  onDeleteAccount?: () => void;
}

export default function AccountSettings({
  onSave,
  onDeleteAccount,
}: AccountSettingsProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user, updateProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    profileImage: user?.profileImage || null,
    isPublicProfile: user?.isPublicProfile ?? true,
    allowMessages: user?.allowMessages ?? true,
    showActivity: user?.showActivity ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      onSave?.(formData);
      Alert.alert('Success', 'Account settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save account settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Type "DELETE" to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: onDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    profileImageSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    profileImageContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 3,
      borderColor: themeColors.border,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    profileImagePlaceholder: {
      alignItems: 'center',
    },
    changePhotoButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
    },
    changePhotoText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: themeColors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    switchRowLast: {
      borderBottomWidth: 0,
    },
    switchLabel: {
      flex: 1,
      marginRight: 16,
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
      gap: 12,
      marginTop: 24,
    },
    saveButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: themeColors.error,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    deleteButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    walletSection: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    walletAddress: {
      backgroundColor: themeColors.background,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    walletAddressText: {
      fontSize: 14,
      color: themeColors.text,
      fontFamily: 'monospace',
      flex: 1,
    },
    copyButton: {
      marginLeft: 12,
      padding: 4,
    },
    connectedWallet: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    connectedText: {
      fontSize: 14,
      color: themeColors.success,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Picture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profileImageSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
              {formData.profileImage ? (
                <Image source={{ uri: formData.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={40} color={themeColors.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={formData.displayName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
              placeholder="Enter your display name"
              placeholderTextColor={themeColors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Your location"
              placeholderTextColor={themeColors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
              placeholder="https://your-website.com"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Connected Wallet */}
        <View style={styles.walletSection}>
          <Text style={styles.sectionTitle}>Connected Wallet</Text>
          {user?.address ? (
            <>
              <View style={styles.connectedWallet}>
                <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
                <Text style={styles.connectedText}>Wallet Connected</Text>
              </View>
              <View style={styles.walletAddress}>
                <Text style={styles.walletAddressText}>
                  {user.address.slice(0, 6)}...{user.address.slice(-4)}
                </Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.switchDescription}>No wallet connected</Text>
          )}
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchTitle}>Public Profile</Text>
              <Text style={styles.switchDescription}>
                Allow others to find and view your profile
              </Text>
            </View>
            <Switch
              value={formData.isPublicProfile}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isPublicProfile: value }))}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchTitle}>Allow Direct Messages</Text>
              <Text style={styles.switchDescription}>
                Let other users send you direct messages
              </Text>
            </View>
            <Switch
              value={formData.allowMessages}
              onValueChange={(value) => setFormData(prev => ({ ...prev, allowMessages: value }))}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.switchRow, styles.switchRowLast]}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchTitle}>Show Activity Status</Text>
              <Text style={styles.switchDescription}>
                Show when you're online and recently active
              </Text>
            </View>
            <Switch
              value={formData.showActivity}
              onValueChange={(value) => setFormData(prev => ({ ...prev, showActivity: value }))}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}