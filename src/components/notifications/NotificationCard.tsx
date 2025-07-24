import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'release' | 'playlist' | 'nft' | 'token' | 'collaboration';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  avatarUrl?: string;
  imageUrl?: string;
  actionData?: {
    userId?: string;
    songId?: string;
    playlistId?: string;
    nftId?: string;
    collaborationId?: string;
  };
}

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  showActions?: boolean;
}

export default function NotificationCard({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  showActions = true,
}: NotificationCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'follow':
        return { name: 'person-add', color: themeColors.primary };
      case 'like':
        return { name: 'heart', color: themeColors.error };
      case 'comment':
        return { name: 'chatbubble', color: themeColors.success };
      case 'release':
        return { name: 'musical-notes', color: themeColors.warning };
      case 'playlist':
        return { name: 'list', color: themeColors.info };
      case 'nft':
        return { name: 'diamond', color: '#8B5CF6' };
      case 'token':
        return { name: 'logo-bitcoin', color: '#F59E0B' };
      case 'collaboration':
        return { name: 'people', color: themeColors.primary };
      default:
        return { name: 'notifications', color: themeColors.textSecondary };
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const icon = getNotificationIcon();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: notification.isRead ? themeColors.surface : `${themeColors.primary}10`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: notification.isRead ? 'transparent' : themeColors.primary,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${icon.color}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      position: 'relative',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    typeIcon: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: icon.color,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContent: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    message: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 18,
      marginBottom: 4,
    },
    timestamp: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    imageContainer: {
      marginTop: 8,
    },
    notificationImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 16,
    },
    readButton: {
      backgroundColor: themeColors.primary,
    },
    deleteButton: {
      backgroundColor: themeColors.error,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: themeColors.primary,
      alignSelf: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {notification.avatarUrl ? (
          <View style={styles.avatarContainer}>
            <Image source={{ uri: notification.avatarUrl }} style={styles.avatar} />
            <View style={styles.typeIcon}>
              <Ionicons name={icon.name as any} size={10} color="white" />
            </View>
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
        )}

        <View style={styles.textContent}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(notification.timestamp)}</Text>
          
          {notification.imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: notification.imageUrl }} style={styles.notificationImage} />
            </View>
          )}
        </View>

        {showActions && (
          <View style={styles.actions}>
            {!notification.isRead && (
              <View style={styles.unreadIndicator} />
            )}
            
            {!notification.isRead && onMarkAsRead && (
              <TouchableOpacity
                style={[styles.actionButton, styles.readButton]}
                onPress={() => onMarkAsRead(notification.id)}
              >
                <Ionicons name="checkmark" size={16} color="white" />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(notification.id)}
              >
                <Ionicons name="trash-outline" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}