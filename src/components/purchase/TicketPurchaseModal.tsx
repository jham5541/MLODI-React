import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { purchaseService, PaymentMethod } from '../../services/purchaseService';

interface TicketPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  tourDateId: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  price: number;
  onPurchaseComplete: (quantity: number) => void;
}

export default function TicketPurchaseModal({
  visible,
  onClose,
  tourDateId,
  venue,
  city,
  date,
  time,
  price,
  onPurchaseComplete,
}: TicketPurchaseModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const paymentMethods = purchaseService.getPaymentMethods();

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const getTotalPrice = () => {
    return (price * quantity).toFixed(2);
  };

  const handlePurchase = async (method: PaymentMethod) => {
    setIsProcessing(true);
    setProcessingMethod(method.type);

    try {
      let success = false;
      const totalPrice = price * quantity;
      
      if (method.type === 'apple_pay') {
        success = await purchaseService.purchaseTicketWithApplePay(tourDateId, totalPrice, quantity);
      } else if (method.type === 'web3_wallet') {
        success = await purchaseService.purchaseTicketWithWeb3Wallet(tourDateId, totalPrice * 0.0004, quantity); // Mock ETH conversion
      }

      if (success) {
        Alert.alert(
          'Purchase Successful!',
          `You have successfully purchased ${quantity} ticket${quantity > 1 ? 's' : ''} for ${venue}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPurchaseComplete(quantity);
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
    eventInfo: {
      alignItems: 'center',
      marginBottom: 24,
      padding: 16,
      backgroundColor: themeColors.background,
      borderRadius: 12,
    },
    venue: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    eventDetails: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    pricePerTicket: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primary,
      textAlign: 'center',
    },
    quantitySection: {
      marginBottom: 24,
    },
    quantityLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 8,
    },
    quantityButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityButtonDisabled: {
      backgroundColor: themeColors.textSecondary + '40',
    },
    quantityButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
    quantityDisplay: {
      marginHorizontal: 24,
      alignItems: 'center',
    },
    quantityNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 4,
    },
    quantityText: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    totalSection: {
      backgroundColor: themeColors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    totalPrice: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.primary,
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
            <Text style={styles.title}>Purchase Tickets</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.venue} numberOfLines={2}>
              {venue}
            </Text>
            <Text style={styles.eventDetails}>
              {city} • {date} at {time}
            </Text>
            <Text style={styles.pricePerTicket}>
              ${price.toFixed(2)} per ticket
            </Text>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Select Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || isProcessing}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityNumber}>{quantity}</Text>
                <Text style={styles.quantityText}>
                  ticket{quantity > 1 ? 's' : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity >= 10 && styles.quantityButtonDisabled,
                ]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= 10 || isProcessing}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${getTotalPrice()}</Text>
          </View>

          <Text style={styles.paymentMethodsTitle}>Choose Payment Method</Text>

          {paymentMethods.map((method) => {
            const isProcessingThis = processingMethod === method.type;
            const displayPrice = method.type === 'apple_pay' 
              ? `$${getTotalPrice()}` 
              : `${(parseFloat(getTotalPrice()) * 0.0004).toFixed(6)} ETH`;

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
                    {displayPrice}
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
