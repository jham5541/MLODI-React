import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme, colors } from '../../context/ThemeContext';

interface NotificationSettingsProps {
  onSave?: (settings: any) => void;
}

export default function NotificationSettings({ onSave }: NotificationSettingsProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [settings, setSettings] = useState({
    // Push Notifications
    pushEnabled: true,
    newFollowers: true,
    newComments: true,
    newLikes: true,
    newReleases: true,
    playlistUpdates: true,
    
    // Email Notifications
    emailEnabled: true,
    weeklyDigest: true,
    monthlyReport: true,
    marketingEmails: false,
    securityAlerts: true,
    
    // In-App Notifications
    inAppEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreviews: true,
    
    // Web3 Notifications
    nftUpdates: true,
    tokenTransfers: true,
    smartContractEvents: true,
    walletActivity: true,
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'To receive notifications, please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Notifications.openSettingsAsync() },
        ]
      );
    }
  };

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave?.(settings);
    Alert.alert('Success', 'Notification settings saved successfully');
  };

  const testNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Error', 'Please enable notifications first');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from M3lodi',
        data: { test: true },
      },
      trigger: { seconds: 1 },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: 16,
    },
    permissionSection: {
      backgroundColor: permissionStatus === 'granted' ? themeColors.success + '20' : themeColors.warning + '20',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: permissionStatus === 'granted' ? themeColors.success : themeColors.warning,
    },
    permissionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    permissionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
      marginLeft: 8,
    },
    permissionDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 12,
    },
    permissionActions: {
      flexDirection: 'row',
      gap: 12,
    },
    permissionButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    permissionButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    testButton: {
      backgroundColor: themeColors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    testButtonText: {
      color: themeColors.text,
      fontWeight: '600',
      fontSize: 14,
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
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    settingRowLast: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    masterSwitch: {
      backgroundColor: themeColors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    masterSwitchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    masterSwitchTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    saveButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    disabledSection: {
      opacity: 0.5,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Permission Status */}
        <View style={styles.permissionSection}>
          <View style={styles.permissionHeader}>
            <Ionicons
              name={permissionStatus === 'granted' ? 'checkmark-circle' : 'warning'}
              size={20}
              color={permissionStatus === 'granted' ? themeColors.success : themeColors.warning}
            />
            <Text style={styles.permissionTitle}>
              Notification Permissions
            </Text>
          </View>
          <Text style={styles.permissionDescription}>
            {permissionStatus === 'granted'
              ? 'Notifications are enabled. You can customize your preferences below.'
              : 'Enable notifications to receive updates about your music and activity.'}
          </Text>
          <View style={styles.permissionActions}>
            {permissionStatus !== 'granted' && (
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
                <Text style={styles.permissionButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            )}
            {permissionStatus === 'granted' && (
              <TouchableOpacity style={styles.testButton} onPress={testNotification}>
                <Text style={styles.testButtonText}>Send Test</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Push Notifications */}
        <View style={[styles.section, !settings.pushEnabled && styles.disabledSection]}>
          <View style={styles.masterSwitch}>
            <View style={styles.masterSwitchRow}>
              <Text style={styles.masterSwitchTitle}>Push Notifications</Text>
              <Switch
                value={settings.pushEnabled}
                onValueChange={(value) => updateSetting('pushEnabled', value)}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>
          </View>

          <View style={[styles.settingRow, !settings.pushEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>New Followers</Text>
              <Text style={styles.settingDescription}>When someone follows you</Text>
            </View>
            <Switch
              value={settings.newFollowers && settings.pushEnabled}
              onValueChange={(value) => updateSetting('newFollowers', value)}
              disabled={!settings.pushEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, !settings.pushEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Comments & Replies</Text>
              <Text style={styles.settingDescription}>When someone comments on your content</Text>
            </View>
            <Switch
              value={settings.newComments && settings.pushEnabled}
              onValueChange={(value) => updateSetting('newComments', value)}
              disabled={!settings.pushEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, !settings.pushEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Likes & Reactions</Text>
              <Text style={styles.settingDescription}>When someone likes your content</Text>
            </View>
            <Switch
              value={settings.newLikes && settings.pushEnabled}
              onValueChange={(value) => updateSetting('newLikes', value)}
              disabled={!settings.pushEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, !settings.pushEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>New Releases</Text>
              <Text style={styles.settingDescription}>When artists you follow release new music</Text>
            </View>
            <Switch
              value={settings.newReleases && settings.pushEnabled}
              onValueChange={(value) => updateSetting('newReleases', value)}
              disabled={!settings.pushEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast, !settings.pushEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Playlist Updates</Text>
              <Text style={styles.settingDescription}>When collaborative playlists are updated</Text>
            </View>
            <Switch
              value={settings.playlistUpdates && settings.pushEnabled}
              onValueChange={(value) => updateSetting('playlistUpdates', value)}
              disabled={!settings.pushEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>
        </View>

        {/* Email Notifications */}
        <View style={[styles.section, !settings.emailEnabled && styles.disabledSection]}>
          <View style={styles.masterSwitch}>
            <View style={styles.masterSwitchRow}>
              <Text style={styles.masterSwitchTitle}>Email Notifications</Text>
              <Switch
                value={settings.emailEnabled}
                onValueChange={(value) => updateSetting('emailEnabled', value)}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>
          </View>

          <View style={[styles.settingRow, !settings.emailEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Weekly Digest</Text>
              <Text style={styles.settingDescription}>Summary of your weekly activity</Text>
            </View>
            <Switch
              value={settings.weeklyDigest && settings.emailEnabled}
              onValueChange={(value) => updateSetting('weeklyDigest', value)}
              disabled={!settings.emailEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, !settings.emailEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Monthly Report</Text>
              <Text style={styles.settingDescription}>Detailed analytics and insights</Text>
            </View>
            <Switch
              value={settings.monthlyReport && settings.emailEnabled}
              onValueChange={(value) => updateSetting('monthlyReport', value)}
              disabled={!settings.emailEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, !settings.emailEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Security Alerts</Text>
              <Text style={styles.settingDescription}>Important account security updates</Text>
            </View>
            <Switch
              value={settings.securityAlerts && settings.emailEnabled}
              onValueChange={(value) => updateSetting('securityAlerts', value)}
              disabled={!settings.emailEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast, !settings.emailEnabled && styles.disabledSection]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Marketing Emails</Text>
              <Text style={styles.settingDescription}>Promotional content and updates</Text>
            </View>
            <Switch
              value={settings.marketingEmails && settings.emailEnabled}
              onValueChange={(value) => updateSetting('marketingEmails', value)}
              disabled={!settings.emailEnabled}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>
        </View>

        {/* Web3 Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Web3 & Blockchain</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>NFT Updates</Text>
              <Text style={styles.settingDescription}>When your NFTs are sold or transferred</Text>
            </View>
            <Switch
              value={settings.nftUpdates}
              onValueChange={(value) => updateSetting('nftUpdates', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Token Transfers</Text>
              <Text style={styles.settingDescription}>When you receive or send tokens</Text>
            </View>
            <Switch
              value={settings.tokenTransfers}
              onValueChange={(value) => updateSetting('tokenTransfers', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Smart Contract Events</Text>
              <Text style={styles.settingDescription}>Updates from music-related smart contracts</Text>
            </View>
            <Switch
              value={settings.smartContractEvents}
              onValueChange={(value) => updateSetting('smartContractEvents', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Wallet Activity</Text>
              <Text style={styles.settingDescription}>General wallet transaction notifications</Text>
            </View>
            <Switch
              value={settings.walletActivity}
              onValueChange={(value) => updateSetting('walletActivity', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>
        </View>

        {/* App Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Behavior</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Sound</Text>
              <Text style={styles.settingDescription}>Play sound with notifications</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Vibration</Text>
              <Text style={styles.settingDescription}>Vibrate device for notifications</Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingTitle}>Show Previews</Text>
              <Text style={styles.settingDescription}>Display notification content on lock screen</Text>
            </View>
            <Switch
              value={settings.showPreviews}
              onValueChange={(value) => updateSetting('showPreviews', value)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Notification Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}