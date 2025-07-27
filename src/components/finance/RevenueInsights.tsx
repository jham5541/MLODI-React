import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface RevenueData {
  totalRevenue: number;
  monthlyGrowth: number;
  streamingRevenue: number;
  merchandiseRevenue: number;
  ticketSales: number;
  subscriptions: number;
}

interface RevenueInsightsProps {
  artistId: string;
  artistName?: string;
}

export default function RevenueInsights({
  artistId,
  artistName = 'Artist',
}: RevenueInsightsProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockRevenueData: RevenueData = {
      totalRevenue: 45320,
      monthlyGrowth: 12.5,
      streamingRevenue: 28500,
      merchandiseRevenue: 8900,
      ticketSales: 5700,
      subscriptions: 2220,
    };

    setRevenueData(mockRevenueData);
  }, [artistId]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
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
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
    },
    totalRevenueSection: {
      alignItems: 'center',
      marginBottom: 24,
      padding: 16,
      backgroundColor: themeColors.background,
      borderRadius: 12,
    },
    totalRevenueLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 8,
    },
    totalRevenueAmount: {
      fontSize: 32,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 8,
    },
    growthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    growthText: {
      fontSize: 14,
      fontWeight: '600',
    },
    revenueBreakdown: {
      gap: 12,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: themeColors.background,
      borderRadius: 8,
    },
    breakdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    breakdownIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    breakdownLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
    },
    breakdownAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  if (!revenueData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Revenue Insights</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No revenue data available</Text>
        </View>
      </View>
    );
  }

  const growthColor = revenueData.monthlyGrowth >= 0 ? '#10B981' : '#EF4444';
  const growthIcon = revenueData.monthlyGrowth >= 0 ? 'trending-up' : 'trending-down';

  const breakdownItems = [
    {
      label: 'Streaming',
      amount: revenueData.streamingRevenue,
      icon: 'musical-notes',
      color: '#6366F1',
    },
    {
      label: 'Merchandise',
      amount: revenueData.merchandiseRevenue,
      icon: 'shirt',
      color: '#EC4899',
    },
    {
      label: 'Ticket Sales',
      amount: revenueData.ticketSales,
      icon: 'ticket',
      color: '#F59E0B',
    },
    {
      label: 'Subscriptions',
      amount: revenueData.subscriptions,
      icon: 'person-add',
      color: '#10B981',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Revenue Insights</Text>
      </View>

      {/* Total Revenue */}
      <View style={styles.totalRevenueSection}>
        <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
        <Text style={styles.totalRevenueAmount}>
          {formatCurrency(revenueData.totalRevenue)}
        </Text>
        
        <View style={styles.growthContainer}>
          <Ionicons 
            name={growthIcon} 
            size={16} 
            color={growthColor} 
          />
          <Text style={[styles.growthText, { color: growthColor }]}>
            {formatPercentage(revenueData.monthlyGrowth)} this month
          </Text>
        </View>
      </View>

      {/* Revenue Breakdown */}
      <View style={styles.revenueBreakdown}>
        {breakdownItems.map((item) => (
          <View key={item.label} style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons 
                  name={item.icon as any} 
                  size={16} 
                  color={item.color} 
                />
              </View>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
