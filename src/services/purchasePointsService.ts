import { purchaseService } from './purchaseService';
import { awardArtistPoints } from './pointsService';
import { currentMusicService as musicService } from './serviceProvider';

class PurchasePointsService {
  // Wrapper for song purchase with points
  async purchaseSongWithPoints(
    songId: string, 
    artistId: string,
    price: number = 1.99, 
    paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'
  ): Promise<boolean> {
    try {
      // Process the purchase
      const success = await purchaseService.purchaseSong(songId, price, paymentMethod);
      
      if (success) {
        // Award points for the purchase
        await awardArtistPoints({
          artistId,
          points: 100,
          refType: 'song_purchase',
          refId: songId
        });
        console.log('✅ Song purchased and points awarded');
      }
      
      return success;
    } catch (error) {
      console.error('Error in purchaseSongWithPoints:', error);
      return false;
    }
  }

  // Wrapper for album purchase with points
  async purchaseAlbumWithPoints(
    albumId: string,
    artistId: string,
    price: number = 12.99,
    paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'
  ): Promise<boolean> {
    try {
      // Process the purchase
      const success = await purchaseService.purchaseAlbum(albumId, price, paymentMethod);
      
      if (success) {
        // Award points for the purchase
        await awardArtistPoints({
          artistId,
          points: 100,
          refType: 'song_purchase', // Using song_purchase type for albums
          refId: albumId
        });
        console.log('✅ Album purchased and points awarded');
      }
      
      return success;
    } catch (error) {
      console.error('Error in purchaseAlbumWithPoints:', error);
      return false;
    }
  }

  // Wrapper for video purchase with points
  async purchaseVideoWithPoints(
    videoId: string,
    artistId: string,
    price: number = 2.99,
    paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'
  ): Promise<boolean> {
    try {
      // Process the purchase
      const success = await purchaseService.purchaseVideo(videoId, price, paymentMethod);
      
      if (success) {
        // Award points for the purchase
        await awardArtistPoints({
          artistId,
          points: 100,
          refType: 'video_purchase',
          refId: videoId
        });
        console.log('✅ Video purchased and points awarded');
      }
      
      return success;
    } catch (error) {
      console.error('Error in purchaseVideoWithPoints:', error);
      return false;
    }
  }

  // Wrapper for merchandise purchase with points
  async purchaseMerchWithPoints(
    orderId: string,
    artistId: string,
    totalAmount: number
  ): Promise<boolean> {
    try {
      // Award points for the purchase
      await awardArtistPoints({
        artistId,
        points: 100,
        refType: 'merch_order',
        refId: orderId
      });
      console.log('✅ Merch order completed and points awarded');
      
      return true;
    } catch (error) {
      console.error('Error awarding points for merch purchase:', error);
      return false;
    }
  }

  // Wrapper for ticket purchase with points
  async purchaseTicketWithPoints(
    tourDateId: string,
    artistId: string,
    totalPrice: number,
    quantity: number = 1,
    paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'
  ): Promise<boolean> {
    try {
      // Process the purchase
      const success = await purchaseService.purchaseTicket(tourDateId, totalPrice, quantity, paymentMethod);
      
      if (success) {
        // Award points for the purchase (100 points per transaction, not per ticket)
        await awardArtistPoints({
          artistId,
          points: 100,
          refType: 'other',
          refId: tourDateId
        });
        console.log('✅ Tickets purchased and points awarded');
      }
      
      return success;
    } catch (error) {
      console.error('Error in purchaseTicketWithPoints:', error);
      return false;
    }
  }
}

export const purchasePointsService = new PurchasePointsService();
