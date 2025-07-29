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
import { purchaseService } from '../../services/purchaseService';
import { useCartStore } from '../../store/cartStore';
import TicketPurchaseModal from '../purchase/TicketPurchaseModal';
import TicketViewModal from '../tickets/TicketViewModal';

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
  const { loadLibrary } = useCartStore();
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedTourDate, setSelectedTourDate] = useState<TourDate | null>(null);
  const [ticketViewModalVisible, setTicketViewModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    setSelectedTourDate(date);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseComplete = async (quantity: number) => {
    // Refresh the user's library to show the new ticket purchase
    await loadLibrary();
    setRefreshKey(prev => prev + 1); // Force re-render to show updated purchase status
  };

  const handleViewTickets = (date: TourDate) => {
    setSelectedTourDate(date);
    setTicketViewModalVisible(true);
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
    ticketCount: {
      fontSize: 12,
      color: themeColors.primary,
      fontWeight: '600',
      marginTop: 2,
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
        {tourDates.map((date) => {
          const isPurchased = purchaseService.isTicketPurchased(date.id);
          const ticketCount = purchaseService.getTicketPurchaseCount(date.id);

          return (
            <View key={`${date.id}-${refreshKey}`} style={styles.tourCard}>
              <View style={styles.tourInfo}>
                <Text style={styles.venue}>{date.venue}</Text>
                <Text style={styles.cityDate}>
                  {date.city}{' • '}{date.date} at {date.time}
                </Text>
                <Text style={styles.cityDate}>{`Tickets: $${date.price}`}</Text>
                {ticketCount > 0 && (
                  <Text style={styles.ticketCount}>
                    {ticketCount} ticket{ticketCount > 1 ? 's' : ''} purchased
                  </Text>
                )}
              </View>
              {isPurchased ? (
                <TouchableOpacity
                  style={styles.buyButtonPurchased}
                  onPress={() => handleViewTickets(date)}
                >
                  <Ionicons name="qr-code" size={16} color={themeColors.background} />
                  <Text style={styles.buyButtonText}>View Tickets</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleBuyTickets(date)}
                >
                  <Ionicons name="ticket" size={16} color={themeColors.background} />
                  <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Ticket Purchase Modal */}
      {selectedTourDate && (
        <TicketPurchaseModal
          visible={purchaseModalVisible}
          onClose={() => {
            setPurchaseModalVisible(false);
            setSelectedTourDate(null);
          }}
          tourDateId={selectedTourDate.id}
          venue={selectedTourDate.venue}
          city={selectedTourDate.city}
          date={selectedTourDate.date}
          time={selectedTourDate.time}
          price={selectedTourDate.price}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}

      {/* Ticket View Modal */}
      {selectedTourDate && (
        <TicketViewModal
          visible={ticketViewModalVisible}
          onClose={() => {
            setTicketViewModalVisible(false);
            setSelectedTourDate(null);
          }}
          venue={selectedTourDate.venue}
          city={selectedTourDate.city}
          date={selectedTourDate.date}
          time={selectedTourDate.time}
          tickets={purchaseService.getTickets(selectedTourDate.id)}
        />
      )}
    </View>
  );
}

