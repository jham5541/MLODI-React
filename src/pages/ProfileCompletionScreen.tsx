import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';

export default function ProfileCompletionScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user, completeProfileSetup } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const { completeProfile } = require('../services/userService');
  
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);

  const handleProfileCompletion = async () => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    setLoading(true);
    try {
      // Use privileged RPC path to avoid RLS errors
      const { userService } = await import('../services/userService');
      await userService.completeProfile({
        username: formData.username,
        display_name: formData.display_name,
        bio: formData.bio,
      });
      await completeProfileSetup();
      Alert.alert('Success', 'Profile completed successfully!');
    } catch (error) {
      console.error('Profile completion error:', error);
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can complete your profile later in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => completeProfileSetup(),
          style: 'destructive' 
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      gap: 20,
      marginBottom: 40,
    },
    inputContainer: {
      position: 'relative',
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    bioInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    inputFocused: {
      borderColor: themeColors.primary,
    },
    buttonContainer: {
      gap: 12,
    },
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    skipButton: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    skipButtonText: {
      color: themeColors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    required: {
      color: themeColors.error,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={40} color="white" />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help others discover you by adding some basic information about yourself.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholderTextColor={themeColors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="How should we display your name?"
              value={formData.display_name}
              onChangeText={(text) => setFormData({ ...formData, display_name: text })}
              placeholderTextColor={themeColors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us a bit about yourself..."
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholderTextColor={themeColors.textSecondary}
              multiline
              maxLength={200}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleProfileCompletion}
            disabled={loading || !formData.username.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.buttonText}>Complete Profile</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
