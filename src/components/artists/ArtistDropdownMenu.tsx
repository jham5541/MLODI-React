import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { followService } from '../../services/followService';

interface ArtistDropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  artist: {
    id: string;
    name: string;
    coverUrl: string;
  };
  isFollowing: boolean;
  onFollowToggle: (isFollowing: boolean) => void;
}

export default function ArtistDropdownMenu({
  visible,
  onClose,
  artist,
  isFollowing,
  onFollowToggle,
}: ArtistDropdownMenuProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFollowToggle = async () => {
    setIsProcessing(true);
    try {
      const success = await followService.toggleFollow(artist);
      if (success) {
        onFollowToggle(!isFollowing);
        onClose();
        
        // Show success message
        Alert.alert(
          isFollowing ? 'Unfollowed' : 'Following',
          isFollowing 
            ? `You have unfollowed ${artist.name}` 
            : `You are now following ${artist.name}! You'll receive notifications about their latest releases and updates.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to update follow status. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    // Share artist profile
    Alert.alert('Share', `Share ${artist.name}'s profile`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => console.log('Sharing artist profile') },
    ]);
    onClose();
  };

  const handleReport = () => {
    Alert.alert(
      'Report Artist',
      'Why are you reporting this artist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => console.log('Reported for inappropriate content') },
        { text: 'Spam', onPress: () => console.log('Reported for spam') },
        { text: 'Other', onPress: () => console.log('Reported for other reasons') },
      ]
    );
    onClose();
  };

  const handleBlock = () => {
    Alert.alert(
      'Block Artist',
      `Are you sure you want to block ${artist.name}? You won't see their content anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            console.log('Blocked artist');
            onClose();
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'follow',
      title: isFollowing ? 'Unfollow' : 'Follow',
      icon: isFollowing ? 'person-remove' : 'person-add',
      onPress: handleFollowToggle,
      disabled: isProcessing,
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: 'notifications-outline',
      onPress: () => {
        console.log('Opening notification settings');
        onClose();
      },
      disabled: !isFollowing,
    },
    {
      id: 'share',
      title: 'Share Artist',
      icon: 'share-outline',
      onPress: handleShare,
    },
    {
      id: 'report',
      title: 'Report',
      icon: 'flag-outline',
      onPress: handleReport,
      isDestructive: false,
    },
    {
      id: 'block',
      title: 'Block',
      icon: 'ban-outline',
      onPress: handleBlock,
      isDestructive: true,
    },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    menuContainer: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: 34, // Safe area padding
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: themeColors.textSecondary,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
      opacity: 0.3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuItemDisabled: {
      opacity: 0.5,
    },
    menuIcon: {
      marginRight: 16,
      width: 24,
    },
    menuText: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      flex: 1,
    },
    menuTextDestructive: {
      color: '#FF3B30',
    },
    menuTextDisabled: {
      color: themeColors.textSecondary,
    },
    separator: {
      height: 1,
      backgroundColor: themeColors.border,
      marginLeft: 60,
    },
    processingText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginLeft: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.handle} />
          
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  item.disabled && styles.menuItemDisabled,
                ]}
                onPress={item.onPress}
                disabled={item.disabled}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={
                    item.disabled
                      ? themeColors.textSecondary
                      : item.isDestructive
                      ? '#FF3B30'
                      : themeColors.text
                  }
                  style={styles.menuIcon}
                />
                <Text
                  style={[
                    styles.menuText,
                    item.isDestructive && styles.menuTextDestructive,
                    item.disabled && styles.menuTextDisabled,
                  ]}
                >
                  {item.title}
                </Text>
                {item.id === 'follow' && isProcessing && (
                  <Text style={styles.processingText}>...</Text>
                )}
              </TouchableOpacity>
              
              {index < menuItems.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
