import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, colors } from '../context/ThemeContext';
import { SubscriptionStatusCard } from '../components/SubscriptionStatusCard';

export default function SettingsScreen() {
  const { activeTheme, theme, setTheme, toggleTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      padding: 16,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    settingLabel: {
      fontSize: 16,
      color: themeColors.text,
    },
    themeButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: themeColors.border,
      marginRight: 8,
    },
    themeButtonActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    themeButtonText: {
      color: themeColors.text,
      fontSize: 14,
    },
    themeButtonTextActive: {
      color: 'white',
    },
    themeOptions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
    },
    subscriptionSection: {
      marginBottom: 24,
    },
    settingItemWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.subscriptionSection}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <SubscriptionStatusCard 
          onPress={() => navigation.navigate('SubscriptionManagement' as never)}
        />
        <TouchableOpacity 
          style={styles.settingItemWithIcon}
          onPress={() => navigation.navigate('Subscription' as never)}
        >
          <Ionicons name="diamond-outline" size={20} color={themeColors.primary} style={styles.settingIcon} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Browse Plans</Text>
            <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeButton, theme === 'light' && styles.themeButtonActive]}
              onPress={() => setTheme('light')}
            >
              <Text style={[styles.themeButtonText, theme === 'light' && styles.themeButtonTextActive]}>
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeButton, theme === 'dark' && styles.themeButtonActive]}
              onPress={() => setTheme('dark')}
            >
              <Text style={[styles.themeButtonText, theme === 'dark' && styles.themeButtonTextActive]}>
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeButton, theme === 'auto' && styles.themeButtonActive]}
              onPress={() => setTheme('auto')}
            >
              <Text style={[styles.themeButtonText, theme === 'auto' && styles.themeButtonTextActive]}>
                Auto
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>High Quality Audio</Text>
          <Switch
            value={true}
            trackColor={{ false: themeColors.border, true: themeColors.primary }}
            thumbColor={themeColors.background}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Download over WiFi only</Text>
          <Switch
            value={false}
            trackColor={{ false: themeColors.border, true: themeColors.primary }}
            thumbColor={themeColors.background}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Web3</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-connect Wallet</Text>
          <Switch
            value={true}
            trackColor={{ false: themeColors.border, true: themeColors.primary }}
            thumbColor={themeColors.background}
          />
        </View>
      </View>
    </View>
  );
}