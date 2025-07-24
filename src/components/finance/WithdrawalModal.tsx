import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface WithdrawalModalProps {
  isVisible: boolean;
  onClose: () => void;
  availableBalance: number;
  currency: 'USD' | 'ETH' | 'MATIC';
  onWithdraw: (data: {
    amount: number;
    method: string;
    address?: string;
    accountInfo?: string;
  }) => void;
}

export default function WithdrawalModal({
  isVisible,
  onClose,
  availableBalance,
  currency,
  onWithdraw,
}: WithdrawalModalProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'crypto' | 'paypal'>('bank');
  const [walletAddress, setWalletAddress] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const minWithdrawal = currency === 'USD' ? 10 : currency === 'ETH' ? 0.01 : 1;
  const maxWithdrawal = availableBalance;
  const fee = calculateFee();

  function calculateFee() {
    const withdrawAmount = parseFloat(amount) || 0;
    switch (method) {
      case 'bank':
        return Math.max(2.5, withdrawAmount * 0.01); // $2.50 or 1%, whichever is higher
      case 'crypto':
        return currency === 'ETH' ? 0.001 : currency === 'MATIC' ? 0.1 : 1;
      case 'paypal':
        return withdrawAmount * 0.025; // 2.5%
      default:
        return 0;
    }
  }

  const formatCurrency = (amount: number) => {
    switch (currency) {
      case 'ETH':
        return `${amount.toFixed(4)} ETH`;
      case 'MATIC':
        return `${amount.toFixed(2)} MATIC`;
      default:
        return `$${amount.toFixed(2)}`;
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount < minWithdrawal) {
      Alert.alert('Error', `Minimum withdrawal is ${formatCurrency(minWithdrawal)}`);
      return;
    }

    if (withdrawAmount + fee > maxWithdrawal) {
      Alert.alert('Error', 'Insufficient balance for this withdrawal amount including fees');
      return;
    }

    if (method === 'crypto' && !walletAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid wallet address');
      return;
    }

    if ((method === 'bank' || method === 'paypal') && !accountInfo.trim()) {
      Alert.alert('Error', 'Please enter your account information');
      return;
    }

    setIsLoading(true);
    try {
      await onWithdraw({
        amount: withdrawAmount,
        method,
        address: method === 'crypto' ? walletAddress : undefined,
        accountInfo: method !== 'crypto' ? accountInfo : undefined,
      });
      
      // Reset form
      setAmount('');
      setWalletAddress('');
      setAccountInfo('');
      onClose();
      
      Alert.alert('Success', 'Withdrawal request submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    const maxAmount = maxWithdrawal - fee;
    setAmount(maxAmount > 0 ? maxAmount.toString() : '0');
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
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    balanceCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      alignItems: 'center',
    },
    balanceLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 4,
    },
    balanceAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
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
    methodContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    methodButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: themeColors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    activeMethodButton: {
      borderColor: themeColors.primary,
      backgroundColor: `${themeColors.primary}10`,
    },
    methodText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    amountContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: themeColors.text,
    },
    maxButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      backgroundColor: themeColors.primary,
      borderRadius: 8,
    },
    maxButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    currencyText: {
      paddingHorizontal: 16,
      fontSize: 16,
      color: themeColors.textSecondary,
    },
    accountInput: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: themeColors.text,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    summaryContainer: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    warningContainer: {
      backgroundColor: `${themeColors.warning}20`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    warningText: {
      fontSize: 14,
      color: themeColors.warning,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    withdrawButton: {
      backgroundColor: themeColors.primary,
    },
    withdrawButtonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: themeColors.text,
    },
    withdrawButtonText: {
      color: 'white',
    },
  });

  const withdrawAmount = parseFloat(amount) || 0;
  const totalWithFees = withdrawAmount + fee;
  const isValidAmount = withdrawAmount >= minWithdrawal && totalWithFees <= maxWithdrawal;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalContainer}
      avoidKeyboard
    >
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal Method</Text>
            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={[styles.methodButton, method === 'bank' && styles.activeMethodButton]}
                onPress={() => setMethod('bank')}
              >
                <Ionicons
                  name="card"
                  size={20}
                  color={method === 'bank' ? themeColors.primary : themeColors.textSecondary}
                />
                <Text style={styles.methodText}>Bank</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.methodButton, method === 'crypto' && styles.activeMethodButton]}
                onPress={() => setMethod('crypto')}
              >
                <Ionicons
                  name="wallet"
                  size={20}
                  color={method === 'crypto' ? themeColors.primary : themeColors.textSecondary}
                />
                <Text style={styles.methodText}>Crypto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.methodButton, method === 'paypal' && styles.activeMethodButton]}
                onPress={() => setMethod('paypal')}
              >
                <Ionicons
                  name="logo-paypal"
                  size={20}
                  color={method === 'paypal' ? themeColors.primary : themeColors.textSecondary}
                />
                <Text style={styles.methodText}>PayPal</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.label}>Withdrawal Amount</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.maxButton} onPress={setMaxAmount}>
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
                <Text style={styles.currencyText}>{currency}</Text>
              </View>
            </View>

            {method === 'crypto' && (
              <View style={styles.amountContainer}>
                <Text style={styles.label}>Wallet Address</Text>
                <TextInput
                  style={styles.accountInput}
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  placeholder="Enter your wallet address"
                  placeholderTextColor={themeColors.textSecondary}
                  autoCapitalize="none"
                />
              </View>
            )}

            {(method === 'bank' || method === 'paypal') && (
              <View style={styles.amountContainer}>
                <Text style={styles.label}>
                  {method === 'bank' ? 'Account Information' : 'PayPal Email'}
                </Text>
                <TextInput
                  style={styles.accountInput}
                  value={accountInfo}
                  onChangeText={setAccountInfo}
                  placeholder={
                    method === 'bank' 
                      ? 'Enter your bank account details' 
                      : 'Enter your PayPal email'
                  }
                  placeholderTextColor={themeColors.textSecondary}
                  autoCapitalize="none"
                  keyboardType={method === 'paypal' ? 'email-address' : 'default'}
                />
              </View>
            )}
          </View>

          {withdrawAmount > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
                <Text style={styles.summaryValue}>{formatCurrency(withdrawAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Processing Fee</Text>
                <Text style={styles.summaryValue}>{formatCurrency(fee)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Deducted</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalWithFees)}</Text>
              </View>
            </View>
          )}

          <View style={styles.warningContainer}>
            <Ionicons name="information-circle" size={20} color={themeColors.warning} />
            <Text style={styles.warningText}>
              Withdrawals typically take 3-5 business days to process. Cryptocurrency withdrawals may take up to 24 hours.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.withdrawButton,
                (!isValidAmount || isLoading) && styles.withdrawButtonDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={!isValidAmount || isLoading}
            >
              <Text style={[styles.buttonText, styles.withdrawButtonText]}>
                {isLoading ? 'Processing...' : 'Withdraw'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}