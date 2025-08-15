import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

interface MarketplaceItem {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  artistAvatar?: string;
  price: number;
  image: string;
  verified?: boolean;
  likes: number;
  views: number;
  timeLeft?: string;
  lastSale?: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity_percentage?: number;
  }>;
  royalties: number;
  totalSupply: number;
  blockchain: string;
  collection: string;
  owner: string;
  isAuction?: boolean;
  priceHistory: Array<{ date: string; price: number }>;
  description?: string;
}

interface MarketplaceCardProps {
  item: MarketplaceItem;
  onPress: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  viewMode?: 'grid' | 'list';
}

export default function MarketplaceCard({ 
  item, 
  onPress, 
  onLike, 
  isLiked = false, 
  viewMode = 'grid' 
}: MarketplaceCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleArtistPress = () => {
    const id = item.artistId || item.id;
    if (id) {
      navigation.navigate('ArtistProfile', { artistId: id });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return '#94A3B8';
      case 'Rare': return '#3B82F6';
      case 'Epic': return '#8B5CF6';
      case 'Legendary': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPriceChange = () => {
    if (!item.priceHistory || item.priceHistory.length < 2) return null;
    const current = item.price;
    const previous = item.priceHistory[item.priceHistory.length - 2].price;
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: change.toFixed(1),
      isPositive: change >= 0,
    };
  };

  const priceChange = getPriceChange();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: viewMode === 'list' ? 12 : 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: viewMode === 'list' ? 'row' : 'column',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    imageContainer: {
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
      width: viewMode === 'list' ? 100 : '100%',
      height: viewMode === 'list' ? 100 : 200,
      backgroundColor: colors.background,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: colors.background,
    },
    overlay: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    rarityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    rarityText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    likeButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 16,
      padding: 6,
    },
    timeLeftBadge: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      backgroundColor: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    timeLeftText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.background,
    },
    auctionBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.warning,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    auctionText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.background,
    },
    content: {
      marginTop: viewMode === 'list' ? 0 : 12,
      marginLeft: viewMode === 'list' ? 12 : 0,
      flex: viewMode === 'list' ? 1 : 0,
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
      fontSize: viewMode === 'list' ? 14 : 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    artistContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    artistAvatar: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 6,
      backgroundColor: colors.background,
    },
    artist: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    collection: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 16,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    priceSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    priceInfo: {
      flex: 1,
    },
    price: {
      fontSize: viewMode === 'list' ? 16 : 20,
      fontWeight: '800',
      color: colors.primary,
    },
    priceChangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    priceChange: {
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    priceChangePositive: {
      color: colors.success,
    },
    priceChangeNegative: {
      color: colors.error,
    },
    lastSale: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    buyButton: {
      backgroundColor: colors.primary,
      flex: 1,
    },
    detailsButton: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    buttonText: {
      fontWeight: '600',
      fontSize: 13,
    },
    buyButtonText: {
      color: colors.background,
    },
    detailsButtonText: {
      color: colors.text,
    },
    supplyIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.background,
      borderRadius: 6,
    },
    supplyText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '92%',
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    modalImage: {
      width: '100%',
      height: 220,
      borderRadius: 16,
      marginBottom: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    attributeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    attributeChip: {
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 80,
    },
    attributeType: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    attributeValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: 2,
    },
    attributeRarity: {
      fontSize: 10,
      color: colors.primary,
      marginTop: 4,
      fontWeight: '500',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    priceHistoryContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    priceHistoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    priceHistoryDate: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    priceHistoryPrice: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.imageContainer}>
          {imageLoaded ? (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="musical-notes" size={32} color={colors.textSecondary} />
            </View>
          )}
          
          <View style={styles.overlay}>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
              <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
            </View>
            
            <TouchableOpacity style={styles.likeButton} onPress={onLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={isLiked ? colors.error : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {item.isAuction && (
            <View style={styles.auctionBadge}>
              <Text style={styles.auctionText}>AUCTION</Text>
            </View>
          )}

          {item.timeLeft && (
            <View style={styles.timeLeftBadge}>
              <Text style={styles.timeLeftText}>{item.timeLeft}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              
              <TouchableOpacity style={styles.artistContainer} onPress={handleArtistPress}>
                {item.artistAvatar && (
                  <Image source={{ uri: item.artistAvatar }} style={styles.artistAvatar} />
                )}
                <Text style={styles.artist}>{item.artist}</Text>
                {item.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.primary}
                    style={styles.verifiedIcon}
                  />
                )}
              </TouchableOpacity>
              
              <Text style={styles.collection} numberOfLines={1}>
                {item.collection}
              </Text>
            </View>
          </View>

          {viewMode === 'grid' && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="heart" size={12} color={colors.textSecondary} />
                <Text style={styles.statText}>{formatNumber(item.likes)}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="eye" size={12} color={colors.textSecondary} />
                <Text style={styles.statText}>{formatNumber(item.views)}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="layers" size={12} color={colors.textSecondary} />
                <Text style={styles.statText}>{item.totalSupply}</Text>
              </View>
            </View>
          )}

          <View style={styles.priceSection}>
            <View style={styles.priceInfo}>
              <Text style={styles.price}>
                {item.price} ETH
              </Text>
              
              {priceChange && (
                <View style={styles.priceChangeContainer}>
                  <Ionicons
                    name={priceChange.isPositive ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={priceChange.isPositive ? colors.success : colors.error}
                  />
                  <Text style={[
                    styles.priceChange,
                    priceChange.isPositive ? styles.priceChangePositive : styles.priceChangeNegative,
                  ]}>
                    {priceChange.isPositive ? '+' : ''}{priceChange.percentage}%
                  </Text>
                </View>
              )}
              
              {item.lastSale && (
                <Text style={styles.lastSale}>
                  Last: {item.lastSale} ETH
                </Text>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => setShowDetails(true)}
            >
              <Ionicons name="information-circle-outline" size={14} color={colors.text} />
              <Text style={[styles.buttonText, styles.detailsButtonText]}>Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.buyButton]}>
              <Ionicons name="card-outline" size={14} color={colors.background} />
              <Text style={[styles.buttonText, styles.buyButtonText]}>
                {item.isAuction ? 'Place Bid' : 'Buy Now'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.supplyIndicator}>
            <Ionicons name="cube" size={12} color={colors.textSecondary} />
            <Text style={styles.supplyText}>
              {Math.floor(item.totalSupply * 0.3)} of {item.totalSupply} available
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{item.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: item.image }} style={styles.modalImage} />

              {item.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attributes</Text>
                <View style={styles.attributeGrid}>
                  {item.attributes.map((attr, index) => (
                    <View key={index} style={styles.attributeChip}>
                      <Text style={styles.attributeType}>{attr.trait_type}</Text>
                      <Text style={styles.attributeValue}>{attr.value}</Text>
                      {attr.rarity_percentage && (
                        <Text style={styles.attributeRarity}>
                          {attr.rarity_percentage}% have this
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Owner</Text>
                  <Text style={styles.infoValue}>{item.owner.slice(0, 6)}...{item.owner.slice(-4)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Blockchain</Text>
                  <Text style={styles.infoValue}>{item.blockchain}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Supply</Text>
                  <Text style={styles.infoValue}>{item.totalSupply}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Royalties</Text>
                  <Text style={styles.infoValue}>{item.royalties}%</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Collection</Text>
                  <Text style={styles.infoValue}>{item.collection}</Text>
                </View>
              </View>

              {item.priceHistory.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Price History</Text>
                  <View style={styles.priceHistoryContainer}>
                    {item.priceHistory.slice(-5).map((history, index) => (
                      <View key={index} style={styles.priceHistoryItem}>
                        <Text style={styles.priceHistoryDate}>{history.date}</Text>
                        <Text style={styles.priceHistoryPrice}>{history.price} ETH</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}