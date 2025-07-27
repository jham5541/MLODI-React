import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { PaymentMethod, Address } from '../../types/marketplace';

interface CheckoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ isVisible, onClose, onSuccess }: CheckoutModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { cart, createOrder, initializeLibrary } = useCartStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'apple_pay'>('credit_card');

  // Shipping form state
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  const [billingAddress, setBillingAddress] = useState<Partial<Address>>({
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validatePaymentForm = () => {
    if (paymentMethod === 'credit_card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid card number.');
        return false;
      }
      if (!expiryDate || expiryDate.length < 5) {
        Alert.alert('Invalid Expiry', 'Please enter a valid expiry date.');
        return false;
      }
      if (!cvv || cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid CVV.');
        return false;
      }
      if (!cardholderName.trim()) {
        Alert.alert('Invalid Name', 'Please enter the cardholder name.');
        return false;
      }
    }
    return true;
  };

  const validateShippingForm = () => {
    const hasPhysicalItems = cart?.items.some(item => item.product.type === 'merch');
    if (!hasPhysicalItems) return true;

    const required = ['firstName', 'lastName', 'address1', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingAddress[field as keyof Address]?.trim()) {
        Alert.alert('Incomplete Address', `Please fill in all required shipping fields.`);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validatePaymentForm()) return;
    if (currentStep === 2 && !validateShippingForm()) return;
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOrder();
    }
  };

  const handleCompleteOrder = async () => {
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const payment: PaymentMethod = {
        type: paymentMethod,
        ...(paymentMethod === 'credit_card' && {
          last4: cardNumber.slice(-4),
          brand: 'Visa', // In real app, detect card brand
          expiryMonth: parseInt(expiryDate.split('/')[0]),
          expiryYear: parseInt('20' + expiryDate.split('/')[1]),
        })
      };

      const shipping = cart?.items.some(item => item.product.type === 'merch') 
        ? shippingAddress as Address 
        : undefined;

      const billing = sameBillingAddress ? shipping : billingAddress as Address;

      const order = await createOrder(payment, shipping, billing);

      Alert.alert(
        'Order Successful!',
        `Your order #${order.id.slice(-6)} has been placed successfully. Digital items have been added to your library.`,
        [{ text: 'OK', onPress: onSuccess }]
      );

    } catch (error) {
      Alert.alert('Order Failed', 'There was an error processing your order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const styles = StyleSheet.create({
    modalContainer: {
      justifyContent: 'center',
      margin: 0,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      marginHorizontal: 20,
      borderRadius: 20,
      maxHeight: '90%',
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
    closeButton: {
      padding: 4,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: themeColors.surface,
    },
    progressStep: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 4,
    },
    activeProgressCircle: {
      backgroundColor: themeColors.primary,
    },
    completedProgressCircle: {
      backgroundColor: themeColors.success,
    },
    progressNumber: {
      fontSize: 14,
      fontWeight: 'bold',
      color: themeColors.textSecondary,
    },
    activeProgressNumber: {
      color: 'white',
    },
    progressLine: {
      width: 40,
      height: 2,
      backgroundColor: themeColors.border,
      marginHorizontal: 4,
    },
    activeProgressLine: {
      backgroundColor: themeColors.primary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 16,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
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
    paymentMethodContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    paymentMethodButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: themeColors.surface,
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    activePaymentMethod: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary + '20',
    },
    paymentMethodText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.text,
      marginLeft: 8,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: themeColors.border,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkedCheckbox: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    checkboxLabel: {
      fontSize: 16,
      color: themeColors.text,
      flex: 1,
    },
    orderSummary: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 12,
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
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    backButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    nextButton: {
      backgroundColor: themeColors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    backButtonText: {
      color: themeColors.text,
    },
    nextButtonText: {
      color: 'white',
    },
  });

  const renderPaymentStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      
      <View style={styles.paymentMethodContainer}>
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'credit_card' && styles.activePaymentMethod
          ]}
          onPress={() => setPaymentMethod('credit_card')}
        >
          <Ionicons name="card" size={20} color={themeColors.text} />
          <Text style={styles.paymentMethodText}>Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'paypal' && styles.activePaymentMethod
          ]}
          onPress={() => setPaymentMethod('paypal')}
        >
          <Ionicons name="logo-paypal" size={20} color={themeColors.text} />
          <Text style={styles.paymentMethodText}>PayPal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'apple_pay' && styles.activePaymentMethod
          ]}
          onPress={() => setPaymentMethod('apple_pay')}
        >
          <Ionicons name="logo-apple" size={20} color={themeColors.text} />
          <Text style={styles.paymentMethodText}>Apple Pay</Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'credit_card' && (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={themeColors.textSecondary}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor={themeColors.textSecondary}
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={themeColors.textSecondary}
                value={cvv}
                onChangeText={setCvv}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={themeColors.textSecondary}
              value={cardholderName}
              onChangeText={setCardholderName}
            />
          </View>
        </View>
      )}

      {paymentMethod === 'paypal' && (
        <View style={styles.inputGroup}>
          <Text style={styles.checkboxLabel}>
            You will be redirected to PayPal to complete your payment securely.
          </Text>
        </View>
      )}

      {paymentMethod === 'apple_pay' && (
        <View style={styles.inputGroup}>
          <Text style={styles.checkboxLabel}>
            Use Touch ID or Face ID to complete your payment with Apple Pay.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderShippingStep = () => {
    const hasPhysicalItems = cart?.items.some(item => item.product.type === 'merch');
    
    if (!hasPhysicalItems) {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.sectionTitle}>Shipping</Text>
          <Text style={styles.checkboxLabel}>
            Your order contains only digital items. No shipping address required.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.form}>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                placeholderTextColor={themeColors.textSecondary}
                value={shippingAddress.firstName}
                onChangeText={(text) => setShippingAddress({...shippingAddress, firstName: text})}
              />
            </View>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor={themeColors.textSecondary}
                value={shippingAddress.lastName}
                onChangeText={(text) => setShippingAddress({...shippingAddress, lastName: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main Street"
              placeholderTextColor={themeColors.textSecondary}
              value={shippingAddress.address1}
              onChangeText={(text) => setShippingAddress({...shippingAddress, address1: text})}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="New York"
                placeholderTextColor={themeColors.textSecondary}
                value={shippingAddress.city}
                onChangeText={(text) => setShippingAddress({...shippingAddress, city: text})}
              />
            </View>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="NY"
                placeholderTextColor={themeColors.textSecondary}
                value={shippingAddress.state}
                onChangeText={(text) => setShippingAddress({...shippingAddress, state: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="10001"
              placeholderTextColor={themeColors.textSecondary}
              value={shippingAddress.zipCode}
              onChangeText={(text) => setShippingAddress({...shippingAddress, zipCode: text})}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setSameBillingAddress(!sameBillingAddress)}
          >
            <View style={[styles.checkbox, sameBillingAddress && styles.checkedCheckbox]}>
              {sameBillingAddress && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Billing address is the same as shipping address
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderReviewStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Order Review</Text>
      
      <View style={styles.orderSummary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        {cart?.items.map((item) => (
          <View key={item.id} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {item.product.title} x{item.quantity}
            </Text>
            <Text style={styles.summaryValue}>
              {formatPrice((item.variant?.price || item.product.price) * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>
            {formatPrice(cart?.tax || 0)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>
            {(cart?.shipping || 0) > 0 ? formatPrice(cart.shipping) : 'Free'}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatPrice(cart?.total ?? 0)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Payment';
      case 2: return 'Shipping';
      case 3: return 'Review';
      default: return 'Checkout';
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 1: return 'Continue to Shipping';
      case 2: return 'Review Order';
      case 3: return processing ? 'Processing...' : 'Complete Order';
      default: return 'Next';
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalContainer}
      avoidKeyboard
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step, index) => (
            <View key={step} style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                step <= currentStep && styles.activeProgressCircle,
                step < currentStep && styles.completedProgressCircle,
              ]}>
                {step < currentStep ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text style={[
                    styles.progressNumber,
                    step <= currentStep && styles.activeProgressNumber,
                  ]}>
                    {step}
                  </Text>
                )}
              </View>
              {index < 2 && (
                <View style={[
                  styles.progressLine,
                  step < currentStep && styles.activeProgressLine,
                ]} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.content}>
          {currentStep === 1 && renderPaymentStep()}
          {currentStep === 2 && renderShippingStep()}
          {currentStep === 3 && renderReviewStep()}
        </View>

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={() => setCurrentStep(currentStep - 1)}
              disabled={processing}
            >
              <Text style={[styles.buttonText, styles.backButtonText]}>
                Back
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={handleNextStep}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, styles.nextButtonText]}>
                {getButtonText()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}