import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { purchaseService, PaymentMethod } from '../../services/purchaseService';

interface AlbumPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  albumId: string;
  albumTitle: string;
  artist: string;
  price: string;
  onPurchaseComplete: () => void;
}

export default function AlbumPurchaseModal({
  visible,
  onClose,
  albumId,
  albumTitle,
  artist,
  price,
  onPurchaseComplete,
}: AlbumPurchaseModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);

  const paymentMethods = purchaseService.getPaymentMethods();

  const handlePurchase = async (method: PaymentMethod) => {
    setIsProcessing(true);
    setProcessingMethod(method.type);

    try {
      let success = false;
      
      if (method.type === 'apple_pay') {
        success = await purchaseService.purchaseAlbumWithApplePay(albumId);
      } else if (method.type === 'web3_wallet') {
        success = await purchaseService.purchaseAlbumWithWeb3Wallet(albumId);
      }

      if (success) {
        Alert.alert(
          'Purchase Successful!',
          `You have successfully purchased "${albumTitle}" by ${artist}`,
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
        Alert.alert(
          'Purchase Failed',
          'There was an error processing your payment. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    albumInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    albumTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    artistName: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    albumPrice: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.primary,
      textAlign: 'center',
    },
    paymentMethodsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
    },
    paymentMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: themeColors.background,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    paymentMethodProcessing: {
      backgroundColor: themeColors.primary + '20',
      borderColor: themeColors.primary,
    },
    paymentIcon: {
      marginRight: 12,
    },
    paymentMethodContent: {
      flex: 1,
    },
    paymentMethodLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    paymentMethodPrice: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    processingIndicator: {
      marginLeft: 12,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Purchase Album</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.albumInfo}>
            <Text style={styles.albumTitle} numberOfLines={2}>
              {albumTitle}
            </Text>
            <Text style={styles.artistName}>by {artist}</Text>
            <Text style={styles.albumPrice}>{price}</Text>
          </View>

          <Text style={styles.paymentMethodsTitle}>Choose Payment Method</Text>

          {paymentMethods.map((method) => {
            const isProcessingThis = processingMethod === method.type;
            const methodPrice = method.type === 'apple_pay' ? price : '0.01 ETH';

            return (
              <TouchableOpacity
                key={method.type}
                style={[
                  styles.paymentMethod,
                  isProcessingThis && styles.paymentMethodProcessing,
                ]}
                onPress={() => handlePurchase(method)}
                disabled={isProcessing}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={themeColors.primary}
                  style={styles.paymentIcon}
                />
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodLabel}>
                    {method.label}
                  </Text>
                  <Text style={styles.paymentMethodPrice}>
                    {methodPrice}
                  </Text>
                </View>
                {isProcessingThis && (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.primary}
                    style={styles.processingIndicator}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
