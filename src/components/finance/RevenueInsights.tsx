import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase/client';

interface RevenueData {
  totalRevenue: number;
  monthlyGrowth: number;
  streamingRevenue: number;
  merchandiseRevenue: {
    available: number;
    total: number;
  };
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        
        // Using mock data to demonstrate UI changes
        const mockData = {
          totalRevenue: 25.5, // 25.5% increase in artist interest
          monthlyGrowth: 25.5,
          streamingRevenue: 1000, // 1000 total streams
          merchandiseRevenue: {
            available: 100, // 100 items available
            total: 380, // out of 380 total items
          },
          ticketSales: 220, // 220 tickets sold
          subscriptions: 25, // 25 active subscribers
        };

        setRevenueData(mockData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchRevenueData();
    }
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Revenue Insights</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading data...</Text>
        </View>
      </View>
    );
  }

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

  const formatValue = (value: number | { available: number; total: number }, type: 'streams' | 'inventory' | 'count'): string => {
    switch (type) {
      case 'streams':
        return `${value.toLocaleString()} plays`;
      case 'inventory':
        const { available, total } = value as { available: number; total: number };
        return `${available.toLocaleString()}/${total.toLocaleString()}`;
      case 'count':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  type BreakdownItem = 
    | { label: string; amount: number; type: 'streams' | 'count'; icon: string; color: string }
    | { label: string; amount: { available: number; total: number }; type: 'inventory'; icon: string; color: string };

  const breakdownItems: BreakdownItem[] = [
    {
      label: 'Streaming',
      amount: revenueData.streamingRevenue,
      type: 'streams',
      icon: 'musical-notes',
      color: '#6366F1',
    },
    {
      label: 'Merchandise',
      amount: revenueData.merchandiseRevenue,
      type: 'inventory',
      icon: 'shirt',
      color: '#EC4899',
    },
    {
      label: 'Ticket Sales',
      amount: revenueData.ticketSales,
      type: 'count',
      icon: 'ticket',
      color: '#F59E0B',
    },
    {
      label: 'Subscriptions',
      amount: revenueData.subscriptions,
      type: 'count',
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
        <Text style={styles.totalRevenueLabel}>Artist Interest Change</Text>
        <Text style={styles.totalRevenueAmount}>
          {formatPercentage(revenueData.totalRevenue)}
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
              {formatValue(item.amount, item.type)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
