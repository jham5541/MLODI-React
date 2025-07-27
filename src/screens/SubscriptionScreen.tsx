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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore, SubscriptionPlan } from '../store/subscriptionStore';
import { colors } from '../context/ThemeContext';

interface SubscriptionScreenProps {
  navigation: any;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
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
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isCurrent && styles.currentPlan,
        ]}
      >
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>CURRENT</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ${plan.price.usd}
            {plan.tier !== 'free' && <Text style={styles.period}>/month</Text>}
          </Text>
          {plan.tier !== 'free' && (
            <Text style={styles.ethPrice}>{plan.price.eth} ETH</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPaymentMethods = () => {
    if (!selectedPlan || selectedPlan.tier === 'free') return null;

    return (
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <View style={styles.paymentMethods}>
          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'card' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <Ionicons name="card" size={24} color={colors.text} />
            <Text style={styles.paymentText}>Credit Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'apple' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('apple')}
          >
            <Ionicons name="logo-apple" size={24} color={colors.text} />
            <Text style={styles.paymentText}>Apple Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'eth' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('eth')}
          >
            <Ionicons name="logo-bitcoin" size={24} color={colors.text} />
            <Text style={styles.paymentText}>Ethereum</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentSubscriptionInfo: {
    marginVertical: 20,
  },
  currentSubscriptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  currentSubscriptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  plansContainer: {
    gap: 16,
    marginVertical: 20,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: colors.primary,
  },
  currentPlan: {
    borderColor: colors.secondary,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  currentBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  period: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  ethPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  paymentSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  selectedPayment: {
    borderColor: colors.primary,
  },
  paymentText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  subscribeSection: {
    marginVertical: 20,
    paddingBottom: 40,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
