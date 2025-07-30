import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import AuthModal from './AuthModal';

export default function AuthButton() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, signOut } = useAuthStore();
  const buttonRef = useRef<View>(null);

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
    dropdownOverlay: {
      flex: 1,
    },
    dropdown: {
      position: 'absolute',
      top: 60,
      right: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      minWidth: 200,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '20',
    },
    dropdownItemLast: {
      borderBottomWidth: 0,
    },
    dropdownItemText: {
      fontSize: 15,
      color: themeColors.text,
      marginLeft: 12,
      flex: 1,
    },
    userIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInfo: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
  });

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
  };

  const handleAccountSettings = () => {
    setShowDropdown(false);
    navigation.navigate('AccountSettings' as never);
  };

  if (user) {
    return (
      <>
        <TouchableOpacity
          ref={buttonRef}
          style={styles.userIconButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>

        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <Pressable 
            style={styles.dropdownOverlay} 
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdown}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={handleAccountSettings}
              >
                <Ionicons name="settings-outline" size={20} color={themeColors.text} />
                <Text style={styles.dropdownItemText}>Account Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dropdownItem, styles.dropdownItemLast]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
                <Text style={[styles.dropdownItemText, { color: themeColors.error }]}>
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
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