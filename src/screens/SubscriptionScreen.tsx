import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSubscriptionStore, SubscriptionPlan } from '../store/subscriptionStore';
import { useTheme, colors } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface SubscriptionScreenProps {
  navigation: any;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  // Create dynamic styles based on current theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: themeColors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      letterSpacing: 0.5,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    currentSubscriptionInfo: {
      marginTop: 24,
      marginBottom: 16,
    },
    currentSubscriptionGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    currentSubscriptionText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'capitalize',
      marginLeft: 12,
    },
    plansContainer: {
      marginVertical: 24,
    },
    planCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    selectedPlan: {
      borderColor: themeColors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    currentPlan: {
      borderColor: themeColors.secondary,
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      left: 24,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    popularText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    planName: {
      fontSize: 26,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 4,
    },
    planDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    currentBadge: {
      backgroundColor: themeColors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    currentText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    priceContainer: {
      marginBottom: 20,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 4,
    },
    price: {
      fontSize: 36,
      fontWeight: '900',
      color: themeColors.text,
    },
    period: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginLeft: 4,
    },
    ethPrice: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    featuresContainer: {
      marginTop: 8,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    checkmarkContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    featureText: {
      fontSize: 16,
      color: themeColors.text,
      fontWeight: '500',
      flex: 1,
    },
    selectedIndicator: {
      position: 'absolute',
      top: 24,
      right: 24,
    },
    selectedCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentSection: {
      marginVertical: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    paymentMethods: {
      gap: 12,
    },
    paymentMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    selectedPayment: {
      borderColor: themeColors.primary,
      shadowOpacity: 0.15,
    },
    paymentIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: themeColors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentText: {
      fontSize: 17,
      color: themeColors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    paymentDesc: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    paymentSelected: {
      marginLeft: 12,
    },
    subscribeSection: {
      marginVertical: 32,
      paddingBottom: 40,
    },
    subscribeButton: {
      backgroundColor: themeColors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 32,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    disabledButton: {
      opacity: 0.6,
      shadowOpacity: 0.1,
    },
    subscribeText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '700',
      marginRight: 8,
      letterSpacing: 0.5,
    },
    disclaimer: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '500',
      paddingHorizontal: 20,
    },
  });
  
  const {
    subscription,
    selectedPlan,
    isLoading,
    error,
    fetchSubscription,
    selectSubscription,
    confirmSubscription,
    getSubscriptionPlans,
    hasActiveSubscription,
  } = useSubscriptionStore();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'eth'>('card');
  const plans = getSubscriptionPlans();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    selectSubscription(plan);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    const success = await confirmSubscription(paymentMethod);
    if (success) {
      Alert.alert(
        'Success!',
        `You've successfully subscribed to ${selectedPlan.name}!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', error || 'Failed to process subscription');
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const isCurrent = subscription?.tier === plan.tier;

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handlePlanSelect(plan)}
        activeOpacity={0.8}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isCurrent && styles.currentPlan,
        ]}
      >
        {plan.isPopular && (
          <LinearGradient
            colors={[themeColors.primary, '#FF6B9D']}
            style={styles.popularBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="star" size={12} color="white" />
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </LinearGradient>
        )}

        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>
              {plan.tier === 'free' ? 'Perfect for trying out' : 
               plan.tier === 'basic' ? 'For casual listeners' :
               plan.tier === 'premium' ? 'For music enthusiasts' : 'Everything you need'}
            </Text>
          </View>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Ionicons name="checkmark-circle" size={12} color="white" />
              <Text style={styles.currentText}>ACTIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {plan.tier === 'free' ? 'Free' : `$${plan.price.usd}`}
            </Text>
            {plan.tier !== 'free' && (
              <Text style={styles.period}>/month</Text>  
            )}
          </View>
          {plan.tier !== 'free' && (
            <Text style={styles.ethPrice}>or {plan.price.eth} ETH</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <LinearGradient
              colors={[themeColors.primary, '#FF6B9D']}
              style={styles.selectedCircle}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPaymentMethods = () => {
    if (!selectedPlan || selectedPlan.tier === 'free') return null;

    const paymentOptions = [
      { id: 'card', name: 'Credit Card', icon: 'card', desc: 'Visa, Mastercard, Amex' },
      { id: 'apple', name: 'Apple Pay', icon: 'logo-apple', desc: 'Touch ID or Face ID' },
      { id: 'eth', name: 'Ethereum', icon: 'logo-bitcoin', desc: 'Crypto payment' },
    ];

    return (
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Choose Payment Method</Text>
        
        <View style={styles.paymentMethods}>
          {paymentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.paymentMethod,
                paymentMethod === option.id && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMethod(option.id as any)}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name={option.icon as any} size={24} color={themeColors.text} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentText}>{option.name}</Text>
                <Text style={styles.paymentDesc}>{option.desc}</Text>
              </View>
              {paymentMethod === option.id && (
                <View style={styles.paymentSelected}>
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {hasActiveSubscription() && (
          <View style={styles.currentSubscriptionInfo}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.currentSubscriptionGradient}
            >
              <Ionicons name="diamond" size={24} color="white" />
              <Text style={styles.currentSubscriptionText}>
                You have an active {subscription?.tier} subscription
              </Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        {renderPaymentMethods()}

        {selectedPlan && (
          <View style={styles.subscribeSection}>
            <TouchableOpacity
              style={[styles.subscribeButton, isLoading && styles.disabledButton]}
              onPress={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.subscribeText}>
                    {selectedPlan.tier === 'free' ? 'Continue with Free' : 'Subscribe Now'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            {selectedPlan.tier !== 'free' && (
              <Text style={styles.disclaimer}>
                You can cancel anytime. Auto-renewal can be turned off in settings.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

