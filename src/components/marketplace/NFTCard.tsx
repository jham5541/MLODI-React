import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useWeb3 } from '../../context/Web3Context';
import { Song } from '../../types/music';

interface NFTCardProps {
  song: Song;
  onPress?: () => void;
  onPurchase?: (song: Song) => void;
}

export default function NFTCard({ song, onPress, onPurchase }: NFTCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { isConnected } = useWeb3();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!isConnected) {
      Alert.alert('Wallet Required', 'Please connect your wallet to purchase NFTs');
      return;
    }

    if (!song.supply?.available || song.supply.available <= 0) {
      Alert.alert('Sold Out', 'This NFT is no longer available');
      return;
    }

    setIsPurchasing(true);

    try {
      // Simulate purchase transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Purchase Successful!',
        `You now own ${song.title} NFT with royalty sharing benefits.`,
        [{ text: 'OK', onPress: () => onPurchase?.(song) }]
      );
    } catch (error) {
      Alert.alert('Purchase Failed', 'Please try again later');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatPrice = (song: Song) => {
    // Simulate dynamic pricing based on popularity and supply
    const basePrice = 0.01;
    const popularityMultiplier = (song.popularity || 50) / 50;
    const scarcityMultiplier = song.supply 
      ? (song.supply.total - song.supply.available) / song.supply.total + 1
      : 1;
    
    return (basePrice * popularityMultiplier * scarcityMultiplier).toFixed(3);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    image: {
      width: '100%',
      height: 200,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 4,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    nftBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    nftText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: themeColors.border,
    },
    metadataItem: {
      flex: 1,
      alignItems: 'center',
    },
    metadataLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    metadataValue: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    priceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceInfo: {
      flex: 1,
    },
    priceLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    price: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    currency: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    purchaseButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    purchaseButtonDisabled: {
      opacity: 0.6,
    },
    soldOutButton: {
      backgroundColor: themeColors.textSecondary,
    },
    purchaseButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    royaltyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 8,
      backgroundColor: themeColors.background,
      borderRadius: 6,
    },
    royaltyText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
  });

  const isSoldOut = !song.supply?.available || song.supply.available <= 0;
  const royaltyPercentage = song.tokenMetadata?.attributes.find(
    attr => attr.trait_type === 'Royalty'
  )?.value;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: song.coverUrl }}
        style={styles.image}
        defaultSource={{ uri: 'https://via.placeholder.com/300x200?text=♪' }}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
          <View style={styles.nftBadge}>
            <Text style={styles.nftText}>NFT</Text>
          </View>
        </View>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Total Supply</Text>
            <Text style={styles.metadataValue}>{song.supply?.total || 'N/A'}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Available</Text>
            <Text style={styles.metadataValue}>{song.supply?.available || 0}</Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Popularity</Text>
            <Text style={styles.metadataValue}>{song.popularity || 0}%</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Current Price</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.price}>{formatPrice(song)}</Text>
              <Text style={styles.currency}>ETH</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (isPurchasing || isSoldOut) && styles.purchaseButtonDisabled,
              isSoldOut && styles.soldOutButton,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || isSoldOut}
          >
            <Ionicons
              name={isSoldOut ? 'close-circle' : isPurchasing ? 'hourglass' : 'card'}
              size={16}
              color="white"
            />
            <Text style={styles.purchaseButtonText}>
              {isSoldOut ? 'Sold Out' : isPurchasing ? 'Purchasing...' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {royaltyPercentage && (
          <View style={styles.royaltyInfo}>
            <Ionicons name="trending-up" size={14} color={themeColors.primary} />
            <Text style={styles.royaltyText}>
              Earn {royaltyPercentage} royalties from future sales
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}