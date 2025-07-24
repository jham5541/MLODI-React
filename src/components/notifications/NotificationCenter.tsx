import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import NotificationCard, { Notification } from './NotificationCard';

interface NotificationCenterProps {
  notifications?: Notification[];
  onRefresh?: () => void;
  onNotificationPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  onClearAll?: () => void;
  isRefreshing?: boolean;
}

export default function NotificationCenter({
  notifications = [],
  onRefresh,
  onNotificationPress,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  isRefreshing = false,
}: NotificationCenterProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Sample notifications if none provided
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      type: 'follow',
      title: 'New Follower',
      message: 'CryptoBeats started following you',
      timestamp: Date.now() - 30000,
      isRead: false,
      avatarUrl: 'https://via.placeholder.com/40x40?text=CB',
    },
    {
      id: '2',
      type: 'like',
      title: 'New Like',
      message: 'Someone liked your track "Midnight Vibes"',
      timestamp: Date.now() - 300000,
      isRead: false,
      avatarUrl: 'https://via.placeholder.com/40x40?text=MV',
    },
    {
      id: '3',
      type: 'comment',
      title: 'New Comment',
      message: 'DigitalDJ commented on your playlist "Chill Beats"',
      timestamp: Date.now() - 600000,
      isRead: true,
      avatarUrl: 'https://via.placeholder.com/40x40?text=DD',
    },
    {
      id: '4',
      type: 'release',
      title: 'New Release',
      message: 'ElectroWave released a new album "Future Sounds"',
      timestamp: Date.now() - 3600000,
      isRead: false,
      imageUrl: 'https://via.placeholder.com/300x120?text=Album+Cover',
    },
    {
      id: '5',
      type: 'nft',
      title: 'NFT Sold',
      message: 'Your NFT "Digital Dreams #42" has been sold for 0.5 ETH',
      timestamp: Date.now() - 7200000,
      isRead: true,
      imageUrl: 'https://via.placeholder.com/300x120?text=NFT+Image',
    },
    {
      id: '6',
      type: 'collaboration',
      title: 'Collaboration Invite',
      message: 'SynthMaster invited you to collaborate on "Neon Nights"',
      timestamp: Date.now() - 86400000,
      isRead: false,
      avatarUrl: 'https://via.placeholder.com/40x40?text=SM',
    },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications;

  const filteredNotifications = displayNotifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      default:
        return true;
    }
  });

  const unreadCount = displayNotifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    
    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: onMarkAllAsRead },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all notifications. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearAll },
      ]
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onPress={onNotificationPress}
      onMarkAsRead={onMarkAsRead}
      onDelete={onDeleteNotification}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={themeColors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateMessage}>
        {filter === 'unread' 
          ? "You're all caught up! No unread notifications."
          : filter === 'read'
          ? "No read notifications found."
          : "You'll see your notifications here when you have some."}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    headerButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: themeColors.surface,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    activeFilterButtonText: {
      color: 'white',
    },
    content: {
      flex: 1,
    },
    notificationsList: {
      padding: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  const filterOptions = [
    { key: 'all', label: 'All', count: displayNotifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read', label: 'Read', count: displayNotifications.length - unreadCount },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllAsRead}>
              <Ionicons name="checkmark-done" size={16} color={themeColors.text} />
              <Text style={styles.headerButtonText}>Mark All</Text>
            </TouchableOpacity>
          )}
          
          {displayNotifications.length > 0 && (
            <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color={themeColors.text} />
              <Text style={styles.headerButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              filter === option.key && styles.activeFilterButton,
            ]}
            onPress={() => setFilter(option.key as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === option.key && styles.activeFilterButtonText,
            ]}>
              {option.label} ({option.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {filteredNotifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notificationsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={themeColors.primary}
                />
              ) : undefined
            }
          />
        )}
      </View>
    </View>
  );
}