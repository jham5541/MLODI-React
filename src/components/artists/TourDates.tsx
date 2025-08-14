import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../../context/ThemeContext';
import { purchaseService } from '../../services/purchaseService';
import { useCartStore } from '../../store/cartStore';
import { tourService, Tour, Show } from '../../services/tourService';
import { ticketPurchaseService } from '../../services/ticketPurchaseService';
import { supabase } from '../../lib/supabase';
import TicketPurchaseModal from '../purchase/TicketPurchaseModal';
import TicketViewModal from '../tickets/TicketViewModal';

interface TourDateDisplay {
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
  const [tours, setTours] = useState<Tour[]>([]);
  const [tourDates, setTourDates] = useState<TourDateDisplay[]>([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedTourDate, setSelectedTourDate] = useState<TourDateDisplay | null>(null);
  const [ticketViewModalVisible, setTicketViewModalVisible] = useState(false);
  const [viewTickets, setViewTickets] = useState<{ id: string; qrCode: string; seatInfo?: string }[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasedEvents, setPurchasedEvents] = useState<Set<string>>(new Set());
  const [ticketCounts, setTicketCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Using sample data for development
    const sampleTourDates: TourDateDisplay[] = [
      {
        id: '1',
        venue: 'Madison Square Garden',
        city: 'New York, NY',
        date: '2025-09-15',
        time: '8:00 PM',
        price: 89.99,
        availableTickets: 120,
      },
      {
        id: '2',
        venue: 'The Forum',
        city: 'Los Angeles, CA',
        date: '2025-09-20',
        time: '7:30 PM',
        price: 79.99,
        availableTickets: 200,
      },
      {
        id: '3',
        venue: 'United Center',
        city: 'Chicago, IL',
        date: '2025-09-25',
        time: '8:30 PM',
        price: 74.99,
        availableTickets: 150,
      },
      {
        id: '4',
        venue: 'State Farm Arena',
        city: 'Atlanta, GA',
        date: '2025-09-28',
        time: '7:00 PM',
        price: 69.99,
        availableTickets: 180,
      },
      {
        id: '5',
        venue: 'TD Garden',
        city: 'Boston, MA',
        date: '2025-10-02',
        time: '8:00 PM',
        price: 84.99,
        availableTickets: 140,
      }
    ];

    setLoading(true);
    // Simulate API call
    setTimeout(async () => {
      setTourDates(sampleTourDates);
      
      // Check purchase status for each tour date
      const purchased = new Set<string>();
      const counts = new Map<string, number>();
      
      for (const date of sampleTourDates) {
        const isPurchased = await purchaseService.isTicketPurchased(date.id);
        if (isPurchased) {
          purchased.add(date.id);
          const count = await purchaseService.getTicketPurchaseCount(date.id);
          counts.set(date.id, count);
        }
      }
      
      setPurchasedEvents(purchased);
      setTicketCounts(counts);
      setLoading(false);
    }, 1000);
  }, [artistId, refreshKey]);

  const handleBuyTickets = (date: TourDateDisplay) => {
    setSelectedTourDate(date);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseComplete = async (quantity: number) => {
    // Immediately update the local state to reflect the purchase
    if (selectedTourDate) {
      setPurchasedEvents(prev => new Set([...prev, selectedTourDate.id]));
      setTicketCounts(prev => {
        const newCounts = new Map(prev);
        const currentCount = newCounts.get(selectedTourDate.id) || 0;
        newCounts.set(selectedTourDate.id, currentCount + quantity);
        return newCounts;
      });
    }
    
    // Refresh the user's library to show the new ticket purchase
    await loadLibrary();
    // Note: We're not triggering a full reload anymore since we've updated the state
  };

  const handleTicketsReady = (tickets: { id: string; qrCode: string; seatInfo?: string }[]) => {
    console.log('[TourDates] handleTicketsReady called with tickets:', tickets);
    console.log('[TourDates] Setting viewTickets and opening modal');
    setViewTickets(tickets);
    setTicketViewModalVisible(true);
    console.log('[TourDates] ticketViewModalVisible should now be true');
  };

  const handleViewTickets = async (date: TourDateDisplay) => {
    setSelectedTourDate(date);
    
    // Fetch tickets from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to view tickets');
        return;
      }
      
      const tickets = await ticketPurchaseService.getTicketsForShow(date.id, user.id);
      console.log('Fetched tickets for viewing:', tickets);
      
      if (tickets && tickets.length > 0) {
        // Convert to the format expected by TicketViewModal
        const formattedTickets = tickets.map(ticket => ({
          id: ticket.id,
          qrCode: ticket.qr_code,
          seatInfo: ticket.seat_info?.section || 'General Admission'
        }));
        setViewTickets(formattedTickets);
        setTicketViewModalVisible(true);
      } else {
        Alert.alert('No Tickets Found', 'No tickets found for this event.');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      Alert.alert('Error', 'Failed to load tickets. Please try again.');
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
    emptyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: themeColors.text,
      textAlign: 'center',
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
          <Text style={styles.title}>Tour Dates</Text>
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tour Dates</Text>
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: 16, color: themeColors.error, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              tourService.getTours(artistId)
                .then(toursData => {
                  setTours(toursData);
                  const tourDates = toursData.flatMap(tour => 
                    tour.shows.map(show => ({
                      id: show.id,
                      venue: show.venue.name,
                      city: `${show.venue.city}, ${show.venue.state || show.venue.country}`,
                      date: show.date,
                      time: show.start_time,
                      price: show.ticket_price,
                      availableTickets: show.venue.capacity - show.tickets_sold
                    }))
                  );
                  setTourDates(tourDates);
                })
                .catch(err => {
                  console.error('Error retrying tour load:', err);
                  setError('Failed to load tour dates');
                })
                .finally(() => setLoading(false));
            }}
          >
            <Ionicons name="refresh" size={16} color={themeColors.background} />
            <Text style={styles.buyButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (tourDates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tour Dates</Text>
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons 
            name="musical-notes" 
            size={48} 
            color={themeColors.primary} 
            style={{ marginBottom: 16 }} 
          />
          <Text style={[styles.emptyTitle, { marginBottom: 8 }]}>
            Stay Tuned!
          </Text>
          <Text style={[styles.emptyText, { marginBottom: 4 }]}>
            {artistName}'s tour dates are coming soon
          </Text>
          <Text style={styles.emptyText}>
            🎵 The stage is being set 🎸
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
          const isPurchased = purchasedEvents.has(date.id);
          const ticketCount = ticketCounts.get(date.id) || 0;

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
          onTicketsReady={handleTicketsReady}
        />
      )}

      {/* Ticket View Modal */}
      {selectedTourDate && (
        <TicketViewModal
          visible={ticketViewModalVisible}
          onClose={() => {
            setTicketViewModalVisible(false);
            setSelectedTourDate(null);
            setViewTickets(null);
          }}
          venue={selectedTourDate.venue}
          city={selectedTourDate.city}
          date={selectedTourDate.date}
          time={selectedTourDate.time}
          tickets={viewTickets ?? purchaseService.getTickets(selectedTourDate.id)}
        />
      )}
    </View>
  );
}

