import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { purchaseService } from '../../services/purchaseService';

interface VideoPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  artist: string;
  price: string;
  thumbnailUrl?: string;
  onPurchaseComplete: () => void;
}

export default function VideoPurchaseModal({
  visible,
  onClose,
  videoId,
  videoTitle,
  artist,
  price,
  thumbnailUrl,
  onPurchaseComplete,
}: VideoPurchaseModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isProcessing, setIsProcessing] = useState(false);
  
  const numericPrice = parseFloat(price.replace('$', ''));

  const handlePurchase = async (paymentMethod: 'apple_pay' | 'web3_wallet') => {
    setIsProcessing(true);
    
    try {
      const success = await purchaseService.purchaseVideo(videoId, numericPrice, paymentMethod);
      
      if (success) {
        Alert.alert(
          'Purchase Successful!',
          `You have successfully purchased "${videoTitle}" by ${artist}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPurchaseComplete();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', 'Something went wrong with your purchase. Please try again.');
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Something went wrong with your purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderRadius: 20,
      width: '90%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: themeColors.surface,
      padding: 20,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnail: {
      width: 80,
      height: 45,
      borderRadius: 8,
      marginBottom: 12,
    },
    videoTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    artist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    content: {
      padding: 20,
    },
    priceContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    price: {
      fontSize: 24,
      fontWeight: '800',
      color: themeColors.primary,
    },
    paymentMethodsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    paymentMethods: {
      gap: 12,
    },
    paymentMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    paymentMethodPressed: {
      backgroundColor: themeColors.primary + '20',
      borderColor: themeColors.primary,
    },
    paymentMethodDisabled: {
      opacity: 0.5,
    },
    paymentMethodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    paymentMethodText: {
      flex: 1,
    },
    paymentMethodTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    paymentMethodSubtitle: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    processingText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontStyle: 'italic',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={themeColors.text} />
            </TouchableOpacity>
            
            {thumbnailUrl && (
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
            )}
            
            <Text style={styles.videoTitle} numberOfLines={2}>
              {videoTitle}
            </Text>
            <Text style={styles.artist}>{artist}</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Purchase Price</Text>
              <Text style={styles.price}>{price}</Text>
            </View>

            <Text style={styles.paymentMethodsTitle}>
              Choose Payment Method
            </Text>

            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  isProcessing && styles.paymentMethodDisabled,
                ]}
                onPress={() => handlePurchase('apple_pay')}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={themeColors.primary}
                  />
                </View>
                <View style={styles.paymentMethodText}>
                  <Text style={styles.paymentMethodTitle}>Apple Pay</Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    {isProcessing ? 'Processing...' : 'Quick and secure payment'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  isProcessing && styles.paymentMethodDisabled,
                ]}
                onPress={() => handlePurchase('web3_wallet')}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={themeColors.primary}
                  />
                </View>
                <View style={styles.paymentMethodText}>
                  <Text style={styles.paymentMethodTitle}>Web3 Wallet</Text>
                  <Text style={styles.paymentMethodSubtitle}>
                    {isProcessing ? 'Processing...' : 'Pay with cryptocurrency'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
