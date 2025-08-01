import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import CheckoutModal from './CheckoutModal';

interface CartModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function CartModal({ isVisible, onClose }: CartModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartTotal 
  } = useCartStore();
  
  const [showCheckout, setShowCheckout] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(itemId) }
        ]
      );
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      minHeight: '50%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: themeColors.surface,
    },
    content: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    itemsList: {
      padding: 16,
    },
    cartItem: {
      flexDirection: 'row',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    itemDetails: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 4,
    },
    itemArtist: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    itemVariant: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    itemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginHorizontal: 12,
      minWidth: 20,
      textAlign: 'center',
    },
    removeButton: {
      padding: 8,
      marginLeft: 8,
    },
    summary: {
      backgroundColor: themeColors.surface,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 16,
      color: themeColors.text,
    },
    summaryValue: {
      fontSize: 16,
      color: themeColors.text,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    checkoutButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    checkoutButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
  });

  const renderCartItem = (item: any) => {
    const price = item.variant?.price || item.product.price;
    const totalPrice = price * item.quantity;

    return (
      <View key={item.id} style={styles.cartItem}>
        <Image
          source={{ uri: item.product.coverUrl }}
          style={styles.itemImage}
          defaultSource={{ uri: 'https://via.placeholder.com/60x60?text=♪' }}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.product.title}
          </Text>
          <Text style={styles.itemArtist} numberOfLines={1}>
            {item.product.artist}
          </Text>
          {item.variant && (
            <Text style={styles.itemVariant}>
              {Object.entries(item.variant.attributes)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </Text>
          )}
          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>
              {formatPrice(totalPrice)}
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={themeColors.text} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={themeColors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCart(item.id)}
              >
                <Ionicons name="trash" size={16} color={themeColors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal
        isVisible={isVisible}
        onBackdropPress={onClose}
        onSwipeComplete={onClose}
        swipeDirection="down"
        style={styles.modalContainer}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Shopping Cart ({cart?.items.length || 0})
            </Text>
            <View style={styles.headerActions}>
              {cart && cart.items.length > 0 && (
                <TouchableOpacity style={styles.headerButton} onPress={handleClearCart}>
                  <Ionicons name="trash" size={20} color={themeColors.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            {!cart || cart.items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="cart-outline"
                  size={64}
                  color={themeColors.textSecondary}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Browse the marketplace to find music, videos, and merch to add to your cart.
                </Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
                  {cart.items.map(renderCartItem)}
                </ScrollView>

                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(cart.subtotal)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(cart.tax)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={styles.summaryValue}>
                      {cart.shipping > 0 ? formatPrice(cart.shipping) : 'Free'}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      {formatPrice(cart.total)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                  >
                    <Text style={styles.checkoutButtonText}>
                      Proceed to Checkout
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <CheckoutModal
        isVisible={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={() => {
          setShowCheckout(false);
          onClose();
        }}
      />
    </>
  );
}