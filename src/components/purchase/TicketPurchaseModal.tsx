import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { ticketPurchaseService } from '../../services/ticketPurchaseService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

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
  onTicketsReady: (tickets: { id: string; qrCode: string; seatInfo?: string }[]) => void;
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
  onTicketsReady,
}: TicketPurchaseModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isWeb3Connected, setIsWeb3Connected] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);

  // Check Apple Pay availability and Web3 connection on mount
  useEffect(() => {
    async function checkPaymentMethods() {
      const available = await ticketPurchaseService.isApplePayAvailable();
      setIsApplePayAvailable(available);
      // Add your Web3 connection check here
      // setIsWeb3Connected(await checkWeb3Connection());
    }
    checkPaymentMethods();
  }, []);

  const paymentMethods = [
    ...(isApplePayAvailable ? [{
      type: 'apple_pay',
      label: 'Apple Pay',
      icon: 'logo-apple'
    }] : []),
    {
      type: 'card',
      label: 'Credit/Debit Card',
      icon: 'card'
    },
    ...(isWeb3Connected ? [{
      type: 'web3_wallet',
      label: 'Crypto Wallet',
      icon: 'wallet'
    }] : [])
  ];

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const getTotalPrice = () => {
    return (price * quantity).toFixed(2);
  };

  const getCurrentUserId = async (): Promise<string | null> => {
    if (user?.id) return user.id;
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      return u?.id ?? null;
    } catch {
      return null;
    }
  };

  const handleCardSubmit = async () => {
    if (!cardNumber || !cardExpiry || !cardCvc) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    const [expMonth, expYear] = cardExpiry.split('/');
    if (!expMonth || !expYear) {
      Alert.alert('Error', 'Invalid expiry date format');
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('Error', 'Please sign in to purchase tickets');
        return;
      }

      const result = await ticketPurchaseService.purchaseTicketsWithCard({
        showId: tourDateId,
        quantity,
        userId: userId,
        unitPrice: price,
        cardDetails: {
          number: cardNumber.replace(/\s/g, ''),
          expMonth: parseInt(expMonth, 10),
          expYear: parseInt('20' + expYear, 10),
          cvc: cardCvc
        },
        venue: venue,
        city: city,
        date: date,
        artistName: venue.split(' ')[0] // Extract artist name from venue or pass it separately
      });

      // Fetch newly created tickets and notify parent to display them
      try {
        const created = await ticketPurchaseService.getTicketsForShow(tourDateId, userId);
        const mapped = created.map(t => ({ id: t.id, qrCode: t.qr_code, seatInfo: t.seat_info ? `${t.seat_info.section || ''} ${t.seat_info.row || ''} ${t.seat_info.seat || ''}`.trim() : undefined }));
        onTicketsReady(mapped);
      } catch (e) {
        console.warn('Could not fetch tickets after purchase:', e);
      }

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
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your card. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handlePurchase = async (method: { type: string; label: string; icon: string }) => {
    // Resolve user at runtime to avoid context timing or multi-client issues
    const userId = await getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'Please sign in to purchase tickets');
      setIsProcessing(false);
      setProcessingMethod(null);
      return;
    }

    setIsProcessing(true);
    setProcessingMethod(method.type);

    try {
      if (method.type === 'card') {
        setShowCardForm(true);
        return;
      }

      if (method.type === 'web3_wallet') {
        // Implement Web3 wallet connection and payment
        // This is a placeholder - you should implement proper Web3 integration
        const web3Provider = {
          address: '0x...',
          chainId: '1',
          isConnected: true,
          sendTransaction: async (params) => {
            // Implement actual Web3 transaction
            return { hash: 'mock_hash_' + Date.now() };
          }
        };

        const result = await ticketPurchaseService.purchaseTicketsWithWeb3({
          showId: tourDateId,
          quantity,
          userId: userId,
          unitPrice: price,
          web3Provider,
          venue: venue,
          city: city,
          date: date,
          artistName: venue.split(' ')[0] // Extract artist name from venue or pass it separately
        });

        // Fetch newly created tickets and notify parent to display them
        try {
          const created = await ticketPurchaseService.getTicketsForShow(tourDateId, userId);
          const mapped = created.map(t => ({ id: t.id, qrCode: t.qr_code, seatInfo: t.seat_info ? `${t.seat_info.section || ''} ${t.seat_info.row || ''} ${t.seat_info.seat || ''}`.trim() : undefined }));
          onTicketsReady(mapped);
        } catch (e) {
          console.warn('Could not fetch tickets after web3 purchase:', e);
        }

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
        return;
      }

      const result = await ticketPurchaseService.purchaseTicketsWithApplePay({
        showId: tourDateId,
        quantity,
        userId: userId,
        unitPrice: price,
        venue: venue,
        city: city,
        date: date,
        artistName: venue.split(' ')[0] // Extract artist name from venue or pass it separately
      });

      // Fetch newly created tickets and notify parent to display them
      try {
        const created = await ticketPurchaseService.getTicketsForShow(tourDateId, userId);
        const mapped = created.map(t => ({ id: t.id, qrCode: t.qr_code, seatInfo: t.seat_info ? `${t.seat_info.section || ''} ${t.seat_info.row || ''} ${t.seat_info.seat || ''}`.trim() : undefined }));
        onTicketsReady(mapped);
      } catch (e) {
        console.warn('Could not fetch tickets after Apple Pay purchase:', e);
      }

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
    cardForm: {
      width: '100%',
      marginTop: 16,
    },
    cardFormTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    cardInput: {
      backgroundColor: themeColors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardFormRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    cardInputHalf: {
      width: '48%',
    },
    payButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    payButtonDisabled: {
      opacity: 0.7,
    },
    payButtonText: {
      color: themeColors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    cardFormCancel: {
      marginTop: 12,
      padding: 12,
      alignItems: 'center',
    },
    cardFormCancelText: {
      color: themeColors.textSecondary,
      fontSize: 16,
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

          {showCardForm ? (
            <View style={styles.cardForm}>
              <Text style={styles.cardFormTitle}>Enter Card Details</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="Card Number"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                maxLength={19}
              />
              <View style={styles.cardFormRow}>
                <TextInput
                  style={[styles.cardInput, styles.cardInputHalf]}
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.cardInput, styles.cardInputHalf]}
                  placeholder="CVC"
                  value={cardCvc}
                  onChangeText={setCardCvc}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <TouchableOpacity
                style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                onPress={handleCardSubmit}
                disabled={isProcessing}
              >
                <Text style={styles.payButtonText}>Pay ${getTotalPrice()}</Text>
                {isProcessing && (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.background}
                    style={styles.processingIndicator}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardFormCancel}
                onPress={() => setShowCardForm(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cardFormCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            paymentMethods.map((method) => {
            const isProcessingThis = processingMethod === method.type;
            const displayPrice = `$${getTotalPrice()}`;

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
          }))
          }
        </View>
      </View>
    </Modal>
  );
}
