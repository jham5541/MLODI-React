import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';
import { subscriptionService, SubscriptionPlan } from '../../services/subscriptionService';

interface ArtistSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  artist: {
    id: string;
    name: string;
    coverUrl: string;
  };
  isSubscribed: boolean;
  onSubscriptionChange: (isSubscribed: boolean) => void;
}

export default function ArtistSubscriptionModal({
  visible,
  onClose,
  artist,
  isSubscribed,
  onSubscriptionChange,
}: ArtistSubscriptionModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get subscription plan with error handling
  const subscriptionPlan = React.useMemo(() => {
    try {
      return subscriptionService.getSubscriptionPlan(artist.id);
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      // Return default plan if there's an error
      return {
        artistId: artist.id,
        price: 9.99,
        currency: 'USD',
        description: 'Access all exclusive content and features',
        benefits: [
          'Unlimited access to all content',
          'Early access to new releases',
          'Exclusive behind-the-scenes content',
          'Direct messaging with artist',
          'No gamification limitations',
          'Priority comment responses',
          'Exclusive live streams',
        ],
      };
    }
  }, [artist.id]);

  const paymentMethods = [
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: 'card-outline',
      description: 'Quick and secure payment',
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      icon: 'card',
      description: 'Visa, MasterCard, Amex',
    },
    {
      id: 'web3_wallet',
      name: 'Web3 Wallet',
      icon: 'wallet-outline',
      description: 'Pay with cryptocurrency',
    },
  ];

  const handleSubscribe = async (paymentMethod: string) => {
    setIsProcessing(true);
    setProcessingMethod(paymentMethod);

    try {
      console.log(`Starting subscription for artist ${artist.id} (${artist.name}) with method ${paymentMethod}`);
      
      if (!user) {
        // Prompt sign-in instead of throwing
        setShowAuthModal(true);
        return;
      }
      
      const success = await subscriptionService.subscribeToArtist(
        artist.id,
        artist.name,
        subscriptionPlan.price,
        paymentMethod as 'apple_pay' | 'web3_wallet' | 'credit_card',
        user.id
      );

      if (success) {
        console.log('Subscription successful!');
        Alert.alert(
          'Subscription Successful!',
          `You are now subscribed to ${artist.name}! You have access to all exclusive content and features.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSubscriptionChange(true);
                onClose();
              },
            },
          ]
        );
      } else {
        console.log('Subscription failed - returned false');
        Alert.alert(
          'Subscription Failed',
          'There was an error processing your subscription. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Subscription Failed',
        `Error: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleUnsubscribe = async () => {
    Alert.alert(
      'Unsubscribe',
      `Are you sure you want to unsubscribe from ${artist.name}? You will lose access to exclusive content.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            const success = await subscriptionService.unsubscribeFromArtist(artist.id);
            if (success) {
              onSubscriptionChange(false);
              onClose();
              Alert.alert('Unsubscribed', `You have unsubscribed from ${artist.name}.`);
            } else {
              Alert.alert('Error', 'Failed to unsubscribe. Please try again.');
            }
            setIsProcessing(false);
          },
        },
      ]
    );
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
      maxHeight: '80%',
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
    artistInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    artistName: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    priceContainer: {
      backgroundColor: themeColors.primary + '15',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 8,
    },
    price: {
      fontSize: 32,
      fontWeight: '800',
      color: themeColors.primary,
    },
    priceSubtext: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    description: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    benefitsSection: {
      marginVertical: 20,
    },
    benefitsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    benefitIcon: {
      marginRight: 12,
      width: 20,
    },
    benefitText: {
      fontSize: 14,
      color: themeColors.text,
      flex: 1,
    },
    paymentSection: {
      marginTop: 16,
    },
    paymentTitle: {
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
    paymentMethodName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 2,
    },
    paymentMethodDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    processingIndicator: {
      marginLeft: 12,
    },
    subscribedContainer: {
      backgroundColor: themeColors.success + '15',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
    },
    subscribedIcon: {
      marginBottom: 8,
    },
    subscribedText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.success,
      textAlign: 'center',
    },
    subscribedSubtext: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    unsubscribeButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#FF3B30',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    unsubscribeButtonText: {
      color: '#FF3B30',
      fontSize: 16,
      fontWeight: '600',
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
            <Text style={styles.title}>
              {isSubscribed ? 'Subscription' : 'Subscribe to Artist'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.artistInfo}>
              <Text style={styles.artistName}>{artist.name}</Text>
              
              {isSubscribed ? (
                <View style={styles.subscribedContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={32}
                    color={themeColors.success}
                    style={styles.subscribedIcon}
                  />
                  <Text style={styles.subscribedText}>
                    You're subscribed!
                  </Text>
                  <Text style={styles.subscribedSubtext}>
                    Enjoy unlimited access to all exclusive content
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      ${subscriptionPlan.price.toFixed(2)}
                    </Text>
                    <Text style={styles.priceSubtext}>per month</Text>
                  </View>
                  <Text style={styles.description}>
                    {subscriptionPlan.description}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>What you get:</Text>
              {subscriptionPlan.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={themeColors.primary}
                    style={styles.benefitIcon}
                  />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {!isSubscribed && (
              <View style={styles.paymentSection}>
                <Text style={styles.paymentTitle}>Choose Payment Method</Text>
                {paymentMethods.map((method) => {
                  const isProcessingThis = processingMethod === method.id;
                  
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethod,
                        isProcessingThis && styles.paymentMethodProcessing,
                      ]}
                      onPress={() => handleSubscribe(method.id)}
                      disabled={isProcessing}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={24}
                        color={themeColors.primary}
                        style={styles.paymentIcon}
                      />
                      <View style={styles.paymentMethodContent}>
                        <Text style={styles.paymentMethodName}>
                          {method.name}
                        </Text>
                        <Text style={styles.paymentMethodDescription}>
                          {method.description}
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
            )}

            {isSubscribed && (
              <TouchableOpacity
                style={styles.unsubscribeButton}
                onPress={handleUnsubscribe}
                disabled={isProcessing}
              >
                <Text style={styles.unsubscribeButtonText}>
                  {isProcessing ? 'Processing...' : 'Unsubscribe'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Auth Modal for sign-in prompt */}
            <AuthModal
              isVisible={showAuthModal}
              onClose={() => setShowAuthModal(false)}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
