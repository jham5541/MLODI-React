import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Product } from '../../types/marketplace';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: (product: Product, variantId?: string) => void;
  onPlayPreview?: (product: Product) => void;
  showAddToCart?: boolean;
}

export default function ProductCard({ 
  product, 
  onPress, 
  onAddToCart, 
  onPlayPreview,
  showAddToCart = true 
}: ProductCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAddToCart = () => {
    if (product.type === 'merch') {
      if (product.product_variants && product.product_variants.length > 1) {
        // Show variant selector
        Alert.alert(
          'Select Variant',
          'This product has multiple options. Please select a variant.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Options', onPress: () => onPress?.() }
          ]
        );
        return;
      } else if (product.product_variants && product.product_variants.length === 1) {
        onAddToCart?.(product, product.product_variants[0].id);
      }
    } else {
      onAddToCart?.(product);
    }
  };

  const handlePlayPreview = async () => {
    if (product.type === 'song') {
      setIsPlaying(true);
      await onPlayPreview?.(product);
      setTimeout(() => setIsPlaying(false), 30000); // Stop after 30 seconds
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProductIcon = () => {
    switch (product.type) {
      case 'song': return 'musical-note';
      case 'album': return 'albums';
      case 'video': return 'videocam';
      case 'merch': return 'storefront';
      default: return 'pricetag';
    }
  };

  const getProductTypeLabel = () => {
    switch (product.type) {
      case 'song': return 'Single';
      case 'album': return 'Album';
      case 'video': return 'Video';
      case 'merch': 
        return product.product_categories?.name || 'Merchandise';
      default: return 'Product';
    }
  };

  const getSubtitle = () => {
    switch (product.type) {
      case 'song':
        const duration = product.duration_ms ? Math.floor(product.duration_ms / 1000) : 0;
        return `${formatDuration(duration)} • ${product.genre || 'Music'}`;
      case 'album':
        const trackCount = product.albums?.total_tracks || 0;
        return `${trackCount} tracks • ${product.genre || 'Music'}`;
      case 'video':
        const videoDuration = product.duration_ms ? Math.floor(product.duration_ms / 1000) : 0;
        return `${formatDuration(videoDuration)} • ${product.quality || 'HD'}`;
      case 'merch':
        const inStock = product.product_variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || product.stock_quantity || 0;
        return `${inStock} in stock • ${product.product_categories?.name || 'Merchandise'}`;
      default:
        return '';
    }
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
    imageContainer: {
      position: 'relative',
    },
    image: {
      width: '100%',
      height: 200,
    },
    typeLabel: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    typeLabelText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    saleLabel: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: themeColors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    saleLabelText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    playButton: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 16,
    },
    header: {
      marginBottom: 8,
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
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    description: {
      fontSize: 14,
      color: themeColors.text,
      lineHeight: 20,
      marginVertical: 8,
    },
    priceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    priceInfo: {
      flex: 1,
    },
    price: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    originalPrice: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textDecorationLine: 'line-through',
      marginLeft: 8,
    },
    addToCartButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    addToCartButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      gap: 6,
    },
    tag: {
      backgroundColor: themeColors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 11,
      color: themeColors.textSecondary,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.cover_url }}
          style={styles.image}
          defaultSource={{ uri: 'https://via.placeholder.com/300x200?text=♪' }}
        />
        
        <View style={styles.typeLabel}>
          <Ionicons name={getProductIcon()} size={12} color="white" />
          <Text style={styles.typeLabelText}>{getProductTypeLabel()}</Text>
        </View>

        {product.is_on_sale && (
          <View style={styles.saleLabel}>
            <Text style={styles.saleLabelText}>SALE</Text>
          </View>
        )}

        {product.type === 'song' && (
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={handlePlayPreview}
          >
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {product.artists?.name || 'Unknown Artist'}
          </Text>
          <Text style={styles.subtitle}>
            {getSubtitle()}
          </Text>
        </View>

        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.tagsContainer}>
          {product.tags?.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.price}>
                ${product.price.toFixed(2)}
              </Text>
              {product.is_on_sale && product.original_price && (
                <Text style={styles.originalPrice}>
                  ${product.original_price.toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          {showAddToCart && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart" size={16} color="white" />
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}