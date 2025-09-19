import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Playlist } from '../../types/music';

interface PlaylistCardCompactProps {
  playlist: Playlist;
  onPress?: () => void;
  onPlay?: () => void;
  width?: number;
}

export default function PlaylistCardCompact({ 
  playlist, 
  onPress, 
  onPlay,
  width = 200
}: PlaylistCardCompactProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const handlePlayPress = () => {
    if (onPlay) {
      onPlay();
    }
  };

  const styles = StyleSheet.create({
    container: {
      width: width,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: width - 20, // Square aspect ratio with padding
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    playButton: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    content: {
      padding: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metadataText: {
      fontSize: 11,
      color: themeColors.textSecondary,
    },
    privateIndicator: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 12,
      padding: 4,
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    privateText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
    },
  });

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: playlist.coverUrl }}
          style={styles.coverImage}
          defaultSource={{ uri: 'https://via.placeholder.com/200x200?text=♪' }}
        />
        
        {playlist.isPrivate && (
          <View style={styles.privateIndicator}>
            <Ionicons name="lock-closed" size={10} color="white" />
            <Text style={styles.privateText}>Private</Text>
          </View>
        )}
        
        <Pressable
          style={styles.playButton}
          onPress={(e) => { 
            e.stopPropagation(); 
            handlePlayPress(); 
          }}
          hitSlop={8}
        >
          <Ionicons name="play" size={18} color="white" />
        </Pressable>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {playlist.name}
        </Text>
        
        {playlist.description && (
          <Text style={styles.description} numberOfLines={2}>
            {playlist.description}
          </Text>
        )}
        
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="musical-notes" size={10} color={themeColors.textSecondary} />
            <Text style={styles.metadataText}>
              {playlist.total_tracks || 0} tracks
            </Text>
          </View>
          
          {playlist.duration && (
            <View style={styles.metadataItem}>
              <Ionicons name="time" size={10} color={themeColors.textSecondary} />
              <Text style={styles.metadataText}>
                {Math.floor((playlist.duration || 0) / 60)}m
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}