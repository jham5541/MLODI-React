import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

export interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'purchase' | 'sale' | 'royalty' | 'fee';
  amount: number;
  currency: 'USD' | 'ETH' | 'MATIC';
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
  from?: string;
  to?: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  onRefresh?: () => void;
  onTransactionPress?: (transaction: Transaction) => void;
  isRefreshing?: boolean;
  showFilter?: boolean;
}

export default function TransactionHistory({
  transactions = [],
  onRefresh,
  onTransactionPress,
  isRefreshing = false,
  showFilter = true,
}: TransactionHistoryProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [filter, setFilter] = useState<'all' | 'earning' | 'withdrawal' | 'purchase' | 'sale'>('all');

  // Sample transactions if none provided
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      type: 'earning',
      amount: 15.50,
      currency: 'USD',
      description: 'Stream revenue from "Midnight Vibes"',
      timestamp: Date.now() - 3600000,
      status: 'completed',
    },
    {
      id: '2',
      type: 'sale',
      amount: 0.25,
      currency: 'ETH',
      description: 'NFT sale: "Digital Dreams #42"',
      timestamp: Date.now() - 7200000,
      status: 'completed',
      txHash: '0x1234...5678',
    },
    {
      id: '3',
      type: 'withdrawal',
      amount: 100.00,
      currency: 'USD',
      description: 'Withdrawal to bank account',
      timestamp: Date.now() - 86400000,
      status: 'pending',
    },
    {
      id: '4',
      type: 'royalty',
      amount: 5.75,
      currency: 'USD',
      description: 'Royalty from playlist featuring',
      timestamp: Date.now() - 172800000,
      status: 'completed',
    },
    {
      id: '5',
      type: 'purchase',
      amount: 0.1,
      currency: 'ETH',
      description: 'Bought "Electric Dreams" by SynthMaster',
      timestamp: Date.now() - 259200000,
      status: 'completed',
      txHash: '0xabcd...efgh',
    },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : sampleTransactions;

  const filteredTransactions = displayTransactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'earning':
        return { name: 'trending-up', color: themeColors.success };
      case 'withdrawal':
        return { name: 'wallet-outline', color: themeColors.warning };
      case 'purchase':
        return { name: 'bag-outline', color: themeColors.error };
      case 'sale':
        return { name: 'cash-outline', color: themeColors.success };
      case 'royalty':
        return { name: 'diamond-outline', color: themeColors.primary };
      case 'fee':
        return { name: 'remove-circle-outline', color: themeColors.textSecondary };
      default:
        return { name: 'swap-horizontal', color: themeColors.textSecondary };
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return themeColors.success;
      case 'pending':
        return themeColors.warning;
      case 'failed':
        return themeColors.error;
      default:
        return themeColors.textSecondary;
    }
  };

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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type);
    const statusColor = getStatusColor(item.status);
    const isPositive = item.type === 'earning' || item.type === 'sale' || item.type === 'royalty';

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => onTransactionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {item.description}
            </Text>
            <View style={styles.transactionMeta}>
              <Text style={styles.transactionTime}>
                {formatTimestamp(item.timestamp)}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            {item.txHash && (
              <Text style={styles.txHash} numberOfLines={1}>
                {item.txHash}
              </Text>
            )}
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amount,
              { color: isPositive ? themeColors.success : themeColors.error }
            ]}>
              {isPositive ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={themeColors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Transactions</Text>
      <Text style={styles.emptyStateMessage}>
        Your transaction history will appear here
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 16,
      backgroundColor: themeColors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    activeFilterButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.text,
    },
    activeFilterButtonText: {
      color: 'white',
    },
    list: {
      flex: 1,
    },
    transactionItem: {
      backgroundColor: themeColors.surface,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      padding: 16,
    },
    transactionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
      marginRight: 12,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.text,
      marginBottom: 4,
    },
    transactionMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    transactionTime: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    txHash: {
      fontSize: 11,
      color: themeColors.textSecondary,
      fontFamily: 'monospace',
    },
    amountContainer: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
  });

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'earning', label: 'Earnings' },
    { key: 'withdrawal', label: 'Withdrawals' },
    { key: 'purchase', label: 'Purchases' },
    { key: 'sale', label: 'Sales' },
  ];

  return (
    <View style={styles.container}>
      {showFilter && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={styles.filterContainer}>
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterButton,
                  filter === option.key && styles.activeFilterButton,
                ]}
                onPress={() => setFilter(option.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === option.key && styles.activeFilterButtonText,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {filteredTransactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          style={styles.list}
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={themeColors.primary}
              />
            ) : undefined
          }
        />
      )}
    </View>
  );
}