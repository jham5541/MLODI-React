import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, colors } from '../context/ThemeContext';
import TransactionHistory, { Transaction } from '../components/finance/TransactionHistory';
import { purchaseService } from '../services/purchaseService';

export default function PurchaseHistoryScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadPurchaseHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all types of purchases
      const songs = await purchaseService.getPurchasedSongs();
      const albums = await purchaseService.getPurchasedAlbums();
      const videos = await purchaseService.getPurchasedVideos();
      const tickets = await purchaseService.getPurchasedTickets();

      // Convert purchases to transactions
      const allTransactions: Transaction[] = [
        ...Array.from(songs.values()).map(song => ({
          id: `song-${song.id}`,
          type: 'purchase' as const,
          amount: song.price,
          currency: song.paymentMethod === 'apple_pay' ? 'USD' : 'ETH',
          description: `Purchased song: ${song.song_title} by ${song.artist_name}`,
          timestamp: song.purchaseDate.getTime(),
          status: 'completed' as const,
          txHash: song.transaction_hash,
        })),
        ...Array.from(albums.values()).map(album => ({
          id: `album-${album.id}`,
          type: 'purchase' as const,
          amount: album.price,
          currency: album.paymentMethod === 'apple_pay' ? 'USD' : 'ETH',
          description: `Purchased album: ${album.album_title} by ${album.artist_name}`,
          timestamp: album.purchaseDate.getTime(),
          status: 'completed' as const,
          txHash: album.transaction_hash,
        })),
        ...Array.from(videos.values()).map(video => ({
          id: `video-${video.id}`,
          type: 'purchase' as const,
          amount: video.price,
          currency: video.paymentMethod === 'apple_pay' ? 'USD' : 'ETH',
          description: `Purchased video: ${video.video_title} by ${video.artist_name}`,
          timestamp: video.purchaseDate.getTime(),
          status: 'completed' as const,
          txHash: video.transaction_hash,
        })),
        ...Array.from(tickets.values()).map(ticket => ({
          id: ticket.id,
          type: 'purchase' as const,
          amount: ticket.totalPrice,
          currency: ticket.paymentMethod === 'apple_pay' ? 'USD' : 'ETH',
          description: `Purchased ${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''} for ${ticket.event_name} at ${ticket.venue}`,
          timestamp: ticket.purchaseDate.getTime(),
          status: 'completed' as const,
          txHash: ticket.transaction_hash,
          venue: ticket.venue,
          eventDate: ticket.event_date,
          tickets: ticket.tickets,
        })),
      ];

      // Sort by timestamp, most recent first
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Failed to load purchase history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseHistory();
  }, [loadPurchaseHistory]);

  const handleRefresh = () => {
    loadPurchaseHistory();
  };

  const handleTransactionPress = (transaction: Transaction) => {
    // TODO: Implement transaction details view
    console.log('Transaction pressed:', transaction);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
  });

  return (
    <View style={styles.container}>
      <TransactionHistory
        transactions={transactions}
        onRefresh={handleRefresh}
        onTransactionPress={handleTransactionPress}
        isRefreshing={isLoading}
        showFilter={true}
      />
    </View>
  );
}
