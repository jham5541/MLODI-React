import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  pendingEarnings: number;
  currency: 'USD' | 'ETH' | 'MATIC';
  trend: {
    percentage: number;
    period: string;
  };
}

interface EarningsCardProps {
  earnings: EarningsData;
  onViewDetails?: () => void;
  onWithdraw?: () => void;
  showActions?: boolean;
}

export default function EarningsCard({
  earnings,
  onViewDetails,
  onWithdraw,
  showActions = true,
}: EarningsCardProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const formatCurrency = (amount: number, currency: string) => {
    switch (currency) {
      case 'ETH':
        return `${amount.toFixed(4)} ETH`;
      case 'MATIC':
        return `${amount.toFixed(2)} MATIC`;
      default:
        return `$${amount.toFixed(2)}`;
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'ETH':
        return 'logo-ethereum';
      case 'MATIC':
        return 'diamond-outline';
      default:
        return 'card';
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    currencyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${themeColors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainEarnings: {
      alignItems: 'center',
      marginBottom: 24,
    },
    mainAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 4,
    },
    mainLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      gap: 4,
    },
    trendText: {
      fontSize: 14,
      fontWeight: '600',
    },
    trendPositive: {
      color: themeColors.success,
    },
    trendNegative: {
      color: themeColors.error,
    },
    breakdownContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: showActions ? 20 : 0,
    },
    breakdownItem: {
      alignItems: 'center',
      flex: 1,
    },
    breakdownAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 4,
    },
    breakdownLabel: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    separator: {
      width: 1,
      height: 40,
      backgroundColor: themeColors.border,
      alignSelf: 'center',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButton: {
      backgroundColor: themeColors.primary,
    },
    secondaryButton: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    primaryButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    secondaryButtonText: {
      color: themeColors.text,
      fontWeight: '600',
      fontSize: 14,
    },
    pendingContainer: {
      backgroundColor: `${themeColors.warning}20`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: themeColors.warning,
    },
    pendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pendingText: {
      fontSize: 14,
      color: themeColors.text,
      flex: 1,
    },
    pendingAmount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: themeColors.warning,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Total Earnings</Text>
          <Text style={styles.subtitle}>All-time revenue</Text>
        </View>
        <View style={styles.currencyIcon}>
          <Ionicons
            name={getCurrencyIcon(earnings.currency) as any}
            size={20}
            color={themeColors.primary}
          />
        </View>
      </View>

      <View style={styles.mainEarnings}>
        <Text style={styles.mainAmount}>
          {formatCurrency(earnings.totalEarnings, earnings.currency)}
        </Text>
        <Text style={styles.mainLabel}>Total Earnings</Text>
        
        <View style={styles.trendContainer}>
          <Ionicons
            name={earnings.trend.percentage >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={earnings.trend.percentage >= 0 ? themeColors.success : themeColors.error}
          />
          <Text style={[
            styles.trendText,
            earnings.trend.percentage >= 0 ? styles.trendPositive : styles.trendNegative
          ]}>
            {earnings.trend.percentage >= 0 ? '+' : ''}{earnings.trend.percentage.toFixed(1)}% {earnings.trend.period}
          </Text>
        </View>
      </View>

      {earnings.pendingEarnings > 0 && (
        <View style={styles.pendingContainer}>
          <View style={styles.pendingRow}>
            <Ionicons name="time" size={16} color={themeColors.warning} />
            <Text style={styles.pendingText}>Pending earnings (processing)</Text>
            <Text style={styles.pendingAmount}>
              {formatCurrency(earnings.pendingEarnings, earnings.currency)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.breakdownContainer}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(earnings.monthlyEarnings, earnings.currency)}
          </Text>
          <Text style={styles.breakdownLabel}>This Month</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownAmount}>
            {formatCurrency(earnings.weeklyEarnings, earnings.currency)}
          </Text>
          <Text style={styles.breakdownLabel}>This Week</Text>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownAmount}>
            {((earnings.totalEarnings / 365) * 30).toFixed(2)}
          </Text>
          <Text style={styles.breakdownLabel}>Avg/Month</Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onViewDetails}
          >
            <Ionicons name="analytics" size={16} color={themeColors.text} />
            <Text style={styles.secondaryButtonText}>Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onWithdraw}
          >
            <Ionicons name="wallet" size={16} color="white" />
            <Text style={styles.primaryButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}