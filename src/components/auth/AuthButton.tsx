import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import AuthModal from './AuthModal';

export default function AuthButton() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuthStore();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    signedInButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    buttonText: {
      color: themeColors.text,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    signedInText: {
      color: 'white',
    },
    menuButton: {
      marginLeft: 8,
      padding: 8,
      borderRadius: 16,
      backgroundColor: themeColors.surface,
    },
    addressText: {
      fontSize: 12,
      fontFamily: 'monospace',
    },
  });

  const handleSignOut = async () => {
    await signOut();
  };

  if (user) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, styles.signedInButton]}
          onPress={() => setShowAuthModal(true)}
        >
          <Ionicons 
            name="person" 
            size={16} 
            color="white" 
          />
          <Text style={[styles.buttonText, styles.signedInText]}>
            {user?.email?.split('@')[0] || 'User'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={16} color={themeColors.text} />
        </TouchableOpacity>
        
        <AuthModal
          isVisible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowAuthModal(true)}
      >
        <Ionicons name="person-outline" size={16} color={themeColors.text} />
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      
      <AuthModal
        isVisible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}