import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import AuthModal from './AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requireProfile?: boolean;
  message?: string;
}

export default function AuthGuard({
  children,
  fallback,
  requireAuth = true,
  requireProfile = false,
  message = 'Sign in to access this feature',
}: AuthGuardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user, profile } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if user meets requirements
  const isAuthenticated = !!user;
  const hasProfile = !!profile?.username;
  
  const meetsRequirements = () => {
    if (!requireAuth) return true;
    if (requireAuth && !isAuthenticated) return false;
    if (requireProfile && !hasProfile) return false;
    return true;
  };

  const getAuthMessage = () => {
    if (!isAuthenticated) {
      return message;
    }
    if (requireProfile && !hasProfile) {
      return 'Complete your profile to access this feature';
    }
    return message;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: themeColors.background,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  // If requirements are met, render children
  if (meetsRequirements()) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default auth prompt UI
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={!isAuthenticated ? "lock-closed" : "person"} 
          size={32} 
          color={themeColors.textSecondary} 
        />
      </View>
      
      <Text style={styles.title}>
        {!isAuthenticated ? 'Authentication Required' : 'Profile Setup Required'}
      </Text>
      
      <Text style={styles.message}>
        {getAuthMessage()}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowAuthModal(true)}
      >
        <Ionicons name="person" size={20} color="white" />
        <Text style={styles.buttonText}>
          {!isAuthenticated ? 'Sign In' : 'Complete Profile'}
        </Text>
      </TouchableOpacity>

      <AuthModal
        isVisible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </View>
  );
}
