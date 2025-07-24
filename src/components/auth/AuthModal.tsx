import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useWeb3 } from '../../context/Web3Context';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'web3';

export default function AuthModal({ isVisible, onClose }: AuthModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading, error } = useAuthStore();
  const { connectWallet, isConnecting, isConnected } = useWeb3();

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'center',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 0,
      maxHeight: '80%',
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
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 30,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: themeColors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    activeTabText: {
      color: 'white',
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      position: 'relative',
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
    inputFocused: {
      borderColor: themeColors.primary,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: 16,
    },
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    socialButton: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
      marginTop: 12,
    },
    socialButtonText: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    web3Container: {
      alignItems: 'center',
      gap: 20,
    },
    web3Title: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      textAlign: 'center',
    },
    web3Subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    connectedContainer: {
      alignItems: 'center',
      gap: 12,
      padding: 20,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
    },
    connectedText: {
      fontSize: 16,
      color: themeColors.text,
      fontWeight: '500',
    },
    addressText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      fontFamily: 'monospace',
    },
    errorText: {
      color: themeColors.error,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: themeColors.textSecondary,
    },
  });

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      let result;
      if (authMode === 'signup') {
        result = await signUpWithEmail(email, password);
      } else {
        result = await signInWithEmail(email, password);
      }

      if (result) {
        onClose();
      }
    } catch (err) {
      Alert.alert('Authentication Error', 'Please try again');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      Alert.alert('Authentication Error', 'Google sign-in failed');
    }
  };

  const handleWeb3Connect = async () => {
    try {
      await connectWallet();
      if (isConnected) {
        onClose();
      }
    } catch (err) {
      Alert.alert('Wallet Connection Error', 'Failed to connect wallet');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modalContainer}
      avoidKeyboard
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {authMode === 'web3' ? 'Connect Wallet' : 'Welcome to M3lodi'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, authMode === 'signin' && styles.activeTab]}
              onPress={() => switchAuthMode('signin')}
            >
              <Text style={[styles.tabText, authMode === 'signin' && styles.activeTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, authMode === 'signup' && styles.activeTab]}
              onPress={() => switchAuthMode('signup')}
            >
              <Text style={[styles.tabText, authMode === 'signup' && styles.activeTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, authMode === 'web3' && styles.activeTab]}
              onPress={() => switchAuthMode('web3')}
            >
              <Text style={[styles.tabText, authMode === 'web3' && styles.activeTabText]}>
                Web3
              </Text>
            </TouchableOpacity>
          </View>

          {/* Web3 Authentication */}
          {authMode === 'web3' ? (
            <View style={styles.web3Container}>
              <Text style={styles.web3Title}>Connect Your Wallet</Text>
              <Text style={styles.web3Subtitle}>
                Connect your Web3 wallet to access exclusive features, own music NFTs, and participate in the decentralized music economy.
              </Text>

              {isConnected ? (
                <View style={styles.connectedContainer}>
                  <Ionicons name="checkmark-circle" size={48} color={themeColors.success} />
                  <Text style={styles.connectedText}>Wallet Connected!</Text>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={onClose}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.button, isConnecting && styles.buttonDisabled]}
                  onPress={handleWeb3Connect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Connect Wallet</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Email Authentication */
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={themeColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={themeColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {authMode === 'signup' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={themeColors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Social Authentication */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.socialButton} onPress={handleGoogleAuth}>
                <Ionicons name="logo-google" size={20} color={themeColors.text} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}