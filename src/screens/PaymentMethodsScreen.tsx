import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';

// A sleek, modern Payment Methods screen with support for multiple providers and default method management.
// This is UI and state scaffolding; you can wire actual payment SDKs (Apple Pay, Stripe, etc.) later.
export default function PaymentMethodsScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [defaultMethodId, setDefaultMethodId] = useState<string>('apple-pay');
  const [methods, setMethods] = useState<Array<{
    id: string;
    label: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    enabled: boolean;
  }>>([
    { id: 'apple-pay', label: 'Apple Pay', subtitle: 'Recommended on iOS', icon: 'logo-apple', enabled: true },
    { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard', icon: 'card-outline', enabled: true },
    { id: 'crypto', label: 'Crypto Wallet', subtitle: 'USDC, ETH', icon: 'wallet-outline', enabled: false },
  ]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    content: { padding: 16 },
    section: { backgroundColor: themeColors.surface, borderRadius: 12, marginBottom: 16 },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: themeColors.text },
    methodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    methodItemLast: { borderBottomWidth: 0 },
    methodLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    methodIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    methodTexts: { flex: 1 },
    methodTitleRow: { flexDirection: 'row', alignItems: 'center' },
    methodTitle: { fontSize: 16, fontWeight: '600', color: themeColors.text },
    defaultBadge: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: themeColors.primary + '30',
    },
    defaultBadgeText: { fontSize: 12, fontWeight: '700', color: themeColors.primary },
    methodSubtitle: { marginTop: 2, fontSize: 13, color: themeColors.textSecondary },
    methodRight: { flexDirection: 'row', alignItems: 'center' },
    primaryButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
      marginHorizontal: 16,
    },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    inlineAction: { flexDirection: 'row', alignItems: 'center' },
    inlineActionText: { color: themeColors.primary, fontSize: 14, fontWeight: '600', marginRight: 6 },
    footer: { padding: 16 },
    help: { fontSize: 13, color: themeColors.textSecondary },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    rowText: { fontSize: 15, color: themeColors.text },
  }), [themeColors]);

  const setAsDefault = (id: string) => setDefaultMethodId(id);
  const toggleMethod = (id: string, value: boolean) => setMethods(prev => prev.map(m => (m.id === id ? { ...m, enabled: value } : m)));

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.content}>
        {/* Default method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Default payment method</Text>
          </View>
          {methods.map((m, idx) => (
            <View key={m.id} style={[styles.methodItem, idx === methods.length - 1 && styles.methodItemLast]}>
              <View style={styles.methodLeft}>
                <View style={styles.methodIconWrap}>
                  <Ionicons name={m.icon} size={20} color={themeColors.primary} />
                </View>
                <View style={styles.methodTexts}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>{m.label}</Text>
                    {defaultMethodId === m.id && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  {!!m.subtitle && <Text style={styles.methodSubtitle}>{m.subtitle}</Text>}
                </View>
              </View>
              <View style={styles.methodRight}>
                {defaultMethodId === m.id ? (
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                ) : (
                  <TouchableOpacity style={styles.inlineAction} onPress={() => setAsDefault(m.id)}>
                    <Text style={styles.inlineActionText}>Set default</Text>
                    <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Manage availability */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available methods</Text>
          </View>
          {methods.map((m, idx) => (
            <View key={m.id} style={[styles.row, idx === methods.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.rowText}>{m.label}</Text>
              <Switch
                value={m.enabled}
                onValueChange={(v) => toggleMethod(m.id, v)}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>
          ))}
        </View>

        {/* Add new card CTA */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => { /* TODO: open add-card flow */ }}>
            <Text style={styles.primaryButtonText}>Add new payment method</Text>
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={styles.help}>Your payment details are encrypted and securely stored. You can remove them at any time.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

