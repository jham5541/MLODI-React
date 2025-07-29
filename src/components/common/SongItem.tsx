import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { usePlay } from '../../context/PlayContext';
import { Song } from '../../types/music';
import { formatDuration } from '../../utils/uiHelpers';
import { purchaseService } from '../../services/purchaseService';
import PurchaseModal from '../purchase/PurchaseModal';

interface SongItemProps {
  song: Song;
  onPress?: (song: Song) => void;
  showArtist?: boolean;
  onPurchaseComplete?: () => void;
  showRank?: boolean;
  rank?: number;
}

export default function SongItem({ 
  song, 
  onPress, 
  showArtist = false, 
  onPurchaseComplete,
  showRank = false,
  rank
}: SongItemProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { currentSong, isPlaying } = usePlay();
  
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  
  const isCurrentSong = currentSong?.id === song.id;
  const isPurchased = purchaseService.isPurchased(song.id);

  const handlePress = () => {
    onPress?.(song);
  };

  const handlePurchasePress = (e: any) => {
    e.stopPropagation();
    setPurchaseModalVisible(true);
  };

  const handlePurchaseModalComplete = () => {
    setPurchaseModalVisible(false);
    onPurchaseComplete?.();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isCurrentSong ? `${themeColors.primary}15` : (isPurchased ? `${themeColors.primary}10` : themeColors.surface),
      borderRadius: 12,
      marginBottom: 8,
    },
    rankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rankText: {
      fontSize: 12,
      color: 'white',
      fontWeight: 'bold',
    },
    artwork: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 12,
    },
    content: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isCurrentSong ? themeColors.primary : themeColors.text,
      marginBottom: 2,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    duration: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    nftBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    nftText: {
      fontSize: 10,
      color: 'white',
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    purchaseButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isPurchased ? themeColors.success : themeColors.primary,
      marginRight: 8,
    },
    purchaseButtonText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
    },
    menuButton: {
      padding: 8,
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        {showRank && rank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        )}
        
        <Image
          source={{ uri: song.coverUrl }}
          style={styles.artwork}
          defaultSource={{ uri: 'https://via.placeholder.com/50x50?text=♪' }}
        />
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          {showArtist && (
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist}
            </Text>
          )}
          <View style={styles.metadata}>
            <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton} onPress={handlePress}>
            <Ionicons
              name={isCurrentSong && isPlaying ? 'pause' : 'play'}
              size={18}
              color="white"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.purchaseButton} 
            onPress={handlePurchasePress}
          >
            <Text style={styles.purchaseButtonText}>
              {isPurchased ? 'Owned' : 'Buy'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <PurchaseModal
        visible={purchaseModalVisible}
        song={song}
        onClose={() => setPurchaseModalVisible(false)}
        onPurchaseComplete={handlePurchaseModalComplete}
      />
    </>
  );
}
