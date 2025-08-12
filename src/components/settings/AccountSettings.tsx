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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import Web3AuthService from '../../services/web3auth';
import { userService } from '../../services/userService';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';

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
  const { user, profile, updateProfile, checkSession } = useAuthStore();
  const [address, setAddress] = useState<string | null>(profile?.wallet_address ?? null);
  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  // Wallet holdings (sample data for now)
  const [holdings, setHoldings] = useState({ albums: 0, songs: 0, tickets: 0 });

  // Simulate fetching holdings when wallet address is available
  React.useEffect(() => {
    const fetchHoldings = async () => {
      // TODO: Replace with real fetch from Supabase or on-chain indexer
      // Sample data for now
      setHoldings({ albums: 3, songs: 27, tickets: 2 });
    };
    if (address) fetchHoldings();
  }, [address]);
  const navigation = useNavigation();
  
  // Hydrate form from profile when available
  React.useEffect(() => {
    if (!profile) return;
    setFormData(prev => ({
      ...prev,
      displayName: profile.display_name || '',
      email: profile.email || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website_url || '',
    }));
    setAddress(profile.wallet_address || null);
  }, [profile]);

  // Mock data for demonstration
  const [walletBalance] = useState(1250); // Wallet points
  const [activeSubscription] = useState({
    plan: 'Premium',
    nextBillingDate: '2024-02-01',
    price: '$9.99/month'
  });

  // Level system data
  const levels = [
    { level: 1, minPoints: 0, maxPoints: 1000, name: 'Bronze', benefits: ['Access to 10 exclusive songs', 'Basic profile badges'] },
    { level: 2, minPoints: 1000, maxPoints: 2500, name: 'Silver', benefits: ['Access to 25 exclusive songs', '5 music videos', 'Silver profile badge'] },
    { level: 3, minPoints: 2500, maxPoints: 5000, name: 'Gold', benefits: ['Access to 50 exclusive songs', '15 music videos', '10% merch discount', 'Gold profile badge'] },
    { level: 4, minPoints: 5000, maxPoints: 10000, name: 'Platinum', benefits: ['Access to all exclusive content', 'Unlimited videos', '20% merch discount', 'Platinum badge', 'Early access to new releases'] },
    { level: 5, minPoints: 10000, maxPoints: Infinity, name: 'Diamond', benefits: ['VIP access to all content', 'Free merch items monthly', 'Meet & greet opportunities', 'Diamond badge', 'Exclusive artist interactions'] }
  ];

  // Calculate current level and progress
  const getCurrentLevel = () => {
    return levels.find(level => walletBalance >= level.minPoints && walletBalance < level.maxPoints) || levels[0];
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - walletBalance : 0;
  const progressPercentage = nextLevel 
    ? ((walletBalance - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

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
    country: user?.country || 'United States',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        display_name: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        website_url: formData.website,
      });
      await checkSession();
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
    walletBalance: {
      marginTop: 12,
      backgroundColor: themeColors.background,
      padding: 12,
      borderRadius: 8,
    },
    walletBalanceText: {
      fontSize: 14,
      color: themeColors.text,
      fontWeight: '500',
    },
    holdingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 12,
      backgroundColor: themeColors.background,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    holdingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    holdingsNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    createWalletButton: {
      marginTop: 16,
      backgroundColor: themeColors.primary,
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
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    menuItemText: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      marginBottom: 2,
    },
    menuItemSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    menuItemValue: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginRight: 8,
    },
walletBalanceSection: {
      backgroundColor: themeColors.primary,
      borderRadius: 15,
      padding: 10,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      shadowColor: 'black',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 3,
    },
walletBalanceContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
walletBalanceLabel: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: '600',
      marginBottom: 10,
    },
walletBalanceAmount: {
      fontSize: 32,
      fontWeight: '700',
      color: 'white',
    },
walletBalancePoints: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.75)',
      marginLeft: 4,
    },
addPointsButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 25,
    },
addPointsText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    subscriptionBadge: {
      backgroundColor: themeColors.success + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    subscriptionBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.success,
    },
    countryPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    countryText: {
      fontSize: 16,
      color: themeColors.text,
    },
    levelText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '600',
      marginTop: 4,
    },
    levelProgressSection: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      marginTop: -8,
    },
    progressBar: {
      height: 8,
      backgroundColor: themeColors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: themeColors.primary,
      borderRadius: 4,
    },
    levelBenefitsPreview: {
      marginTop: 8,
    },
    levelBenefitsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 6,
    },
    levelBenefit: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginBottom: 4,
      marginLeft: 8,
    },
    levelInfo: {
      alignItems: 'flex-end',
    },
    nextLevelText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: 2,
    },
    miniProgressBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
      overflow: 'hidden',
    },
    miniProgressFill: {
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    levelBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    levelBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    levelProgressBar: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 2,
      marginTop: 12,
      overflow: 'hidden',
    },
    levelProgressFill: {
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 2,
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

        {/* Wallet Points */}
        <View style={styles.walletBalanceSection}>
          <View style={styles.walletBalanceContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletBalanceAmount}>{walletBalance.toLocaleString()}</Text>
                <Text style={styles.walletBalanceLabel}>points</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{currentLevel.name}</Text>
                </View>
                {nextLevel && (
                  <Text style={styles.nextLevelText}>
                    {pointsToNextLevel} to next
                  </Text>
                )}
              </View>
            </View>
            {/* Progress Bar */}
            {nextLevel && (
              <View style={styles.levelProgressBar}>
                <View 
                  style={[
                    styles.levelProgressFill,
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            )}
          </View>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
{/* Subscription */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('SubscriptionManagement')}>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemIcon}>
                <Ionicons name="star" size={20} color={themeColors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Subscription</Text>
                <Text style={styles.menuItemSubtitle}>
                  {activeSubscription.plan} • {activeSubscription.price}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.subscriptionBadge}>
                <Text style={styles.subscriptionBadgeText}>Active</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>

          {/* Payment Methods */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PaymentMethods')}>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemIcon}>
                <Ionicons name="card" size={20} color={themeColors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Payment Methods</Text>
                <Text style={styles.menuItemSubtitle}>Manage your payment methods</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Purchase History */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemIcon}>
                <Ionicons name="receipt" size={20} color={themeColors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Purchase History</Text>
                <Text style={styles.menuItemSubtitle}>View your past purchases</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Country/Region */}
          <View style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemIcon}>
                <Ionicons name="globe" size={20} color={themeColors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Country/Region</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.countryPicker}>
              <Text style={styles.countryText}>{formData.country}</Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connected Wallet */}
        <View style={styles.walletSection}>
          <Text style={styles.sectionTitle}>Connected Wallet</Text>
          {user ? (
            address ? (
              <>
                <View style={styles.connectedWallet}>
                  <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
                  <Text style={styles.connectedText}>Wallet Connected</Text>
                </View>
                <View style={styles.walletAddress}>
                  <Text style={styles.walletAddressText}>
                    {formattedAddress}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      if (address) {
                        Clipboard.setStringAsync(address);
                        Alert.alert('Success', 'Wallet address copied to clipboard');
                      }
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {/* Holdings summary */}
                <View style={styles.holdingsRow}>
                  <View style={styles.holdingsItem}>
                    <Ionicons name="albums-outline" size={18} color={themeColors.primary} />
                    <Text style={styles.holdingsNumber}>{holdings.albums}</Text>
                  </View>
                  <View style={styles.holdingsItem}>
                    <Ionicons name="musical-notes-outline" size={18} color={themeColors.primary} />
                    <Text style={styles.holdingsNumber}>{holdings.songs}</Text>
                  </View>
                  <View style={styles.holdingsItem}>
                    <Ionicons name="pricetag-outline" size={18} color={themeColors.primary} />
                    <Text style={styles.holdingsNumber}>{holdings.tickets}</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.switchDescription}>No wallet connected</Text>
                <TouchableOpacity 
                  style={[styles.saveButton, styles.createWalletButton, { opacity: 0.5 }]}
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Wallet connection is temporarily disabled.');
                  }}
                >
                  <Text style={styles.saveButtonText}>Create Wallet</Text>
                </TouchableOpacity>
              </>
            )
          ) : (
            <Text style={styles.switchDescription}>Sign in to create a wallet</Text>
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