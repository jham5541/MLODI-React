import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';

interface TourDate {
  id: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  price: number;
  availableTickets: number;
}

interface TourDatesProps {
  artistId: string;
  artistName?: string;
}

export default function TourDates({
  artistId,
  artistName = 'Artist',
}: TourDatesProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [purchasedTickets, setPurchasedTickets] = useState<string[]>([]);
  const [qrCodeVisible, setQrCodeVisible] = useState<null | string>(null);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockTourDates: TourDate[] = [
      {
        id: '1',
        venue: 'Madison Square Garden',
        city: 'New York, NY',
        date: '2023-10-15',
        time: '8:00 PM',
        price: 89.99,
        availableTickets: 120,
      },
      {
        id: '2',
        venue: 'Hollywood Bowl',
        city: 'Los Angeles, CA',
        date: '2023-10-20',
        time: '7:30 PM',
        price: 79.99,
        availableTickets: 200,
      },
      {
        id: '3',
        venue: 'The Fillmore',
        city: 'San Francisco, CA',
        date: '2023-11-05',
        time: '9:00 PM',
        price: 69.99,
        availableTickets: 150,
      },
    ];

    setTourDates(mockTourDates);
  }, [artistId]);

  const handleBuyTickets = (date: TourDate) => {
    Alert.alert(
      'Buy Tickets',
      `Purchase tickets for ${date.venue} on ${date.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Now', onPress: () => {
          console.log('Buying tickets for:', date.id);
          setPurchasedTickets((prev) => [...prev, date.id]); // Mark as purchased
        }},
      ]
    );
  };

  const showQrCode = (dateId: string) => {
    setQrCodeVisible(dateId);
  };

  const closeModal = () => {
    setQrCodeVisible(null);
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
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
    },
    tourCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    tourInfo: {
      flex: 1,
    },
    venue: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    cityDate: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    buyButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    buyButtonText: {
      color: themeColors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    buyButtonPurchased: {
      backgroundColor: themeColors.success,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 350,
      alignItems: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
    },
    closeIconButton: {
      padding: 4,
    },
    ticketInfo: {
      alignItems: 'center',
      marginBottom: 24,
    },
    ticketVenue: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    ticketDetails: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    qrCodeContainer: {
      marginBottom: 24,
    },
    qrCodePlaceholder: {
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 40,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: themeColors.border,
      borderStyle: 'dashed',
    },
    qrCodeText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    closeButton: {
      backgroundColor: themeColors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 32,
      minWidth: 120,
    },
    closeButtonText: {
      color: themeColors.background,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  if (tourDates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tour Dates</Text>
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 16, color: themeColors.textSecondary, textAlign: 'center' }}>
            No tour dates available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tour Dates</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {tourDates.map((date) => (
          <View key={date.id} style={styles.tourCard}>
            <View style={styles.tourInfo}>
              <Text style={styles.venue}>{date.venue}</Text>
              <Text style={styles.cityDate}>
                {date.city}{' \u2022 '}{date.date} at {date.time}
              </Text>
              <Text style={styles.cityDate}>{`Tickets: $${date.price}`}</Text>
            </View>
            {purchasedTickets.includes(date.id) ? (
              <TouchableOpacity
                style={styles.buyButtonPurchased}
                onPress={() => showQrCode(date.id)}
              >
                <Ionicons name="qr-code" size={16} color={themeColors.background} />
                <Text style={styles.buyButtonText}>View Ticket</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => handleBuyTickets(date)}
              >
                <Ionicons name="ticket" size={16} color={themeColors.background} />
                <Text style={styles.buyButtonText}>Buy</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={qrCodeVisible !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Ticket</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeIconButton}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ticketInfo}>
              {qrCodeVisible && (
                <>
                  {(() => {
                    const selectedDate = tourDates.find(d => d.id === qrCodeVisible);
                    return selectedDate ? (
                      <>
                        <Text style={styles.ticketVenue}>{selectedDate.venue}</Text>
                        <Text style={styles.ticketDetails}>
                          {selectedDate.city} • {selectedDate.date} at {selectedDate.time}
                        </Text>
                      </>
                    ) : null;
                  })()} 
                </>
              )}
            </View>
            
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodePlaceholder}>
                <Ionicons name="qr-code" size={80} color={themeColors.textSecondary} />
                <Text style={styles.qrCodeText}>Scan at venue entrance</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

