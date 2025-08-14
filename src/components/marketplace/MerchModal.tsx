import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { Product } from '../../types/marketplace';
import { useAuthStore } from '../../store/authStore';
import { merchandiseService } from '../../services/merchandiseService';

interface MerchModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

const SIZES = ['OS', 'XS', 'S', 'M', 'L', 'XL', '2XL'];

export default function MerchModal({ 
  visible, 
  product, 
  onClose,
  onPurchaseComplete 
}: MerchModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useAuthStore();
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.profile?.display_name || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: ''
  });
  const [showShipping, setShowShipping] = useState(false);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const validateShipping = () => {
    if (!shippingInfo.fullName || !shippingInfo.address || 
        !shippingInfo.city || !shippingInfo.state || 
        !shippingInfo.zipCode || !shippingInfo.phone) {
      Alert.alert('Missing Information', 'Please fill in all shipping details.');
      return false;
    }
    return true;
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    if (!selectedSize) {
      Alert.alert('Select Size', 'Please select a size before purchasing.');
      return;
    }

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to make a purchase.');
      return;
    }

    // Show shipping form if not already filled
    if (!showShipping) {
      setShowShipping(true);
      return;
    }

    if (!validateShipping()) {
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${product.title} (Size: ${selectedSize}) for $${(product.price * quantity).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Create the order
              await merchandiseService.createMerchOrder({
                user_id: user.id,
                artist_id: product.artist_id || product.artists?.id,
                product_id: product.id,
                product_name: product.title,
                size: selectedSize,
                quantity: quantity,
                price: product.price,
                total: product.price * quantity,
                shipping_info: shippingInfo,
                status: 'pending'
              });

              Alert.alert(
                'Order Placed!', 
                'Your order has been successfully placed. You will receive a confirmation email shortly.',
                [{ text: 'OK', onPress: () => {
                  onPurchaseComplete?.();
                  handleClose();
                }}]
              );
            } catch (error) {
              console.error('Purchase error:', error);
              Alert.alert('Purchase Failed', 'There was an error processing your order. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleClose = () => {
    setSelectedSize('');
    setQuantity(1);
    setShowShipping(false);
    setShippingInfo({
      fullName: user?.profile?.display_name || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      phone: ''
    });
    onClose();
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      paddingBottom: 34,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      padding: 16,
    },
    productInfo: {
      flexDirection: 'row',
      marginBottom: 24,
    },
    productImage: {
      width: 100,
      height: 100,
      borderRadius: 12,
      marginRight: 16,
    },
    productDetails: {
      flex: 1,
      justifyContent: 'center',
    },
    productTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    productArtist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    productPrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
    },
    sizeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sizeButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: themeColors.border,
      marginRight: 8,
      marginBottom: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    sizeButtonSelected: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary + '20',
    },
    sizeText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    sizeTextSelected: {
      color: themeColors.primary,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    quantityText: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginHorizontal: 24,
    },
    shippingForm: {
      marginTop: 8,
    },
    input: {
      backgroundColor: themeColors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inputHalf: {
      flex: 1,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      backgroundColor: themeColors.surface,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    totalLabel: {
      fontSize: 16,
      color: themeColors.textSecondary,
    },
    totalAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    buyButton: {
      backgroundColor: themeColors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buyButtonDisabled: {
      opacity: 0.5,
    },
    buyButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {showShipping ? 'Shipping Information' : 'Select Size & Quantity'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {!showShipping ? (
              <>
                <View style={styles.productInfo}>
                  <Image
                    source={{ uri: product.cover_url || product.coverUrl }}
                    style={styles.productImage}
                  />
                  <View style={styles.productDetails}>
                    <Text style={styles.productTitle}>{product.title}</Text>
                    <Text style={styles.productArtist}>
                      {product.artists?.name || product.artist}
                    </Text>
                    <Text style={styles.productPrice}>
                      ${product.price.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Select Size</Text>
                  <View style={styles.sizeGrid}>
                    {SIZES.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.sizeButton,
                          selectedSize === size && styles.sizeButtonSelected
                        ]}
                        onPress={() => handleSizeSelect(size)}
                      >
                        <Text style={[
                          styles.sizeText,
                          selectedSize === size && styles.sizeTextSelected
                        ]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Ionicons name="remove" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(Math.min(10, quantity + 1))}
                    >
                      <Ionicons name="add" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.shippingForm}>
                <Text style={styles.sectionTitle}>Shipping Details</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={themeColors.textSecondary}
                  value={shippingInfo.fullName}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, fullName: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={themeColors.textSecondary}
                  value={shippingInfo.phone}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                  keyboardType="phone-pad"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Street Address"
                  placeholderTextColor={themeColors.textSecondary}
                  value={shippingInfo.address}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
                />
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="City"
                    placeholderTextColor={themeColors.textSecondary}
                    value={shippingInfo.city}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, city: text})}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="State"
                    placeholderTextColor={themeColors.textSecondary}
                    value={shippingInfo.state}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, state: text})}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="ZIP Code"
                    placeholderTextColor={themeColors.textSecondary}
                    value={shippingInfo.zipCode}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, zipCode: text})}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="Country"
                    placeholderTextColor={themeColors.textSecondary}
                    value={shippingInfo.country}
                    onChangeText={(text) => setShippingInfo({...shippingInfo, country: text})}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                ${(product.price * quantity).toFixed(2)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.buyButton,
                (!selectedSize || isProcessing) && styles.buyButtonDisabled
              ]}
              onPress={handleBuyNow}
              disabled={!selectedSize || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buyButtonText}>
                  {showShipping ? 'Complete Purchase' : 'Continue to Shipping'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
