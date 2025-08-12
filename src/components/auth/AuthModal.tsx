import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useBackHandler } from '../../hooks/useBackHandler';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { OnboardingFlow } from './OnboardingFlow';
import SimpleWalletService from '../../services/SimpleWalletService';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export default function AuthModal({ isVisible, onClose }: AuthModalProps) {
  const { profile, user } = useAuthStore();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  // Define styles at the beginning
  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'center',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      marginHorizontal: 16,
      borderRadius: 28,
      padding: 0,
      maxHeight: '85%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 15,
    },
    header: {
      alignItems: 'center',
      paddingTop: 32,
      paddingHorizontal: 24,
      paddingBottom: 24,
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    logo: {
      width: 48,
      height: 48,
      marginRight: 16,
    },
    brandName: {
      fontSize: 32,
      fontWeight: '700',
      color: themeColors.primary,
      letterSpacing: -0.5,
    },
    welcomeText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      fontWeight: '400',
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: 32,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 6,
      shadowColor: themeColors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: themeColors.primary,
      shadowColor: themeColors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '500',
      color: themeColors.textSecondary,
    },
    activeTabText: {
      color: 'white',
      fontWeight: '600',
    },
    form: {
      gap: 20,
    },
    inputContainer: {
      position: 'relative',
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    inputFocused: {
      borderColor: themeColors.primary,
      shadowColor: themeColors.primary,
      shadowOpacity: 0.15,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: 16,
      padding: 4,
    },
    button: {
      backgroundColor: themeColors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 12,
      shadowColor: themeColors.primary,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0.1,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    socialButton: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: themeColors.border,
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    socialButtonText: {
      color: themeColors.text,
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 12,
    },
    errorText: {
      color: themeColors.error,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 12,
      fontWeight: '500',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border,
      opacity: 0.5,
    },
    dividerText: {
      marginHorizontal: 20,
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
    },
  });

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  
  const { signIn, signUp, signInWithApple, loading, error } = useAuthStore();

  useBackHandler(() => {
    if (isVisible) {
      onClose();
      return true;
    }
    return false;
  });

  // Show onboarding flow if profile exists but onboarding not completed
  if (profile && !profile.onboarding_completed) {
    return (
      <Modal
        isVisible={isVisible}
        style={styles.modalContainer}
        avoidKeyboard
      >
        <OnboardingFlow onClose={onClose} />
      </Modal>
    );
  }

  useEffect(() => {
    checkAppleAuthAvailability();
  }, []);

  const checkAppleAuthAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    setIsAppleAuthAvailable(isAvailable);
  };


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 6 characters
    return password.length >= 6;
  };

  const handleEmailAuth = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      if (authMode === 'signup') {
        const { success } = await signUp(email, password);
        if (success) {
          try {
            // Create a local wallet for the user
            const walletService = SimpleWalletService.getInstance();
            const addr = await walletService.createWallet();

            Alert.alert(
              'Success!',
              'Account created and wallet generated successfully. You can view it in Account Settings.',
              [{ text: 'OK', onPress: onClose }]
            );
          } catch (error) {
            console.error('Error creating wallet:', error);
            Alert.alert(
              'Warning',
              'Account created but wallet creation failed. You can try again later from Account Settings.',
              [{ text: 'OK', onPress: onClose }]
            );
          }
        }
      } else {
        const { success } = await signIn(email, password);
        if (success) {
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      Alert.alert('Authentication Error', err.message || 'Please try again');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Call your auth store method with the credential
      const success = await signInWithApple(credential);
      if (success) {
        onClose();
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
      } else {
        Alert.alert('Sign In Error', 'Unable to sign in with Apple. Please try again.');
      }
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.brandName}>MLODI</Text>
          </View>
          
          <Text style={styles.welcomeText}>
            {authMode === 'signin' ? 'Welcome back!' : 'Join the music revolution'}
          </Text>
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
          </View>

          {/* Email Authentication */}
          <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                  placeholder="Email"
                  placeholderTextColor={themeColors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                  placeholder="Password"
                  placeholderTextColor={themeColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
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
                    style={[styles.input, focusedInput === 'confirmPassword' && styles.inputFocused]}
                    placeholder="Confirm Password"
                    placeholderTextColor={themeColors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
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

            </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign In */}
          {isAppleAuthAvailable && (
            <>
              {/* Native Apple Sign In Button */}
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={authMode === 'signin' ? 
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN :
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                }
                buttonStyle={activeTheme === 'dark' ?
                  AppleAuthentication.AppleAuthenticationButtonStyle.WHITE :
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={16}
                style={{
                  width: '100%',
                  height: 52,
                  marginTop: 16,
                }}
                onPress={handleAppleSignIn}
              />
              
              {/* Alternative custom button (commented out but available) */}
              {/* <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
                <Ionicons name="logo-apple" size={20} color={themeColors.text} />
                <Text style={styles.socialButtonText}>
                  {authMode === 'signin' ? 'Sign in' : 'Sign up'} with Apple
                </Text>
              </TouchableOpacity> */}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
