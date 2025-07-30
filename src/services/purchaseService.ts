export interface PurchasedSong {
  id: string;
  count: number;
  purchaseDate: Date;
  paymentMethod: 'apple_pay' | 'web3_wallet';
  price: number;
}

export interface PurchasedAlbum {
  id: string;
  count: number;
  purchaseDate: Date;
  paymentMethod: 'apple_pay' | 'web3_wallet';
  price: number;
}

export interface PurchasedVideo {
  id: string;
  count: number;
  purchaseDate: Date;
  paymentMethod: 'apple_pay' | 'web3_wallet';
  price: number;
}

export interface PurchasedTicket {
  id: string;
  tourDateId: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: Date;
  paymentMethod: 'apple_pay' | 'web3_wallet';
  tickets: {
    id: string;
    qrCode: string;
    seatInfo?: string;
  }[];
}

export interface PaymentMethod {
  type: 'apple_pay' | 'web3_wallet' | 'credit_card';
  label: string;
  icon: string;
  description?: string;
}

class PurchaseService {
  private purchasedSongs: Map<string, PurchasedSong> = new Map();
  private purchasedAlbums: Map<string, PurchasedAlbum> = new Map();
  private purchasedVideos: Map<string, PurchasedVideo> = new Map();
  private purchasedTickets: Map<string, PurchasedTicket> = new Map();

  // Get purchased songs from storage (in a real app, this would be from a database)
  async getPurchasedSongs(): Promise<Map<string, PurchasedSong>> {
    // Mock implementation - in a real app, load from AsyncStorage or API
    return this.purchasedSongs;
  }

  // Get purchase count for a specific song
  getPurchaseCount(songId: string): number {
    const purchased = this.purchasedSongs.get(songId);
    return purchased ? purchased.count : 0;
  }

  // Check if a song has been purchased
  isPurchased(songId: string): boolean {
    return this.purchasedSongs.has(songId);
  }

  // Purchase a song with Apple Pay
  async purchaseWithApplePay(songId: string, price: number = 1.99): Promise<boolean> {
    try {
      // Mock Apple Pay implementation
      // In a real app, you would use react-native-payments or similar
      console.log(`Processing Apple Pay for song ${songId} at $${price}`);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to purchased songs
      const existing = this.purchasedSongs.get(songId);
      const purchasedSong: PurchasedSong = {
        id: songId,
        count: existing ? existing.count + 1 : 1,
        purchaseDate: new Date(),
        paymentMethod: 'apple_pay',
        price: price
      };
      
      this.purchasedSongs.set(songId, purchasedSong);
      return true;
    } catch (error) {
      console.error('Apple Pay purchase failed:', error);
      return false;
    }
  }

  // Purchase a song with Web3 wallet
  async purchaseWithWeb3Wallet(songId: string, price: number = 0.001): Promise<boolean> {
    try {
      // Mock Web3 wallet implementation
      // In a real app, you would use WalletConnect or similar
      console.log(`Processing Web3 wallet payment for song ${songId} at ${price} ETH`);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to purchased songs
      const existing = this.purchasedSongs.get(songId);
      const purchasedSong: PurchasedSong = {
        id: songId,
        count: existing ? existing.count + 1 : 1,
        purchaseDate: new Date(),
        paymentMethod: 'web3_wallet',
        price: price
      };
      
      this.purchasedSongs.set(songId, purchasedSong);
      return true;
    } catch (error) {
      console.error('Web3 wallet purchase failed:', error);
      return false;
    }
  }

  // Album purchase methods
  async getPurchasedAlbums(): Promise<Map<string, PurchasedAlbum>> {
    return this.purchasedAlbums;
  }

  getAlbumPurchaseCount(albumId: string): number {
    const purchased = this.purchasedAlbums.get(albumId);
    return purchased ? purchased.count : 0;
  }

  isAlbumPurchased(albumId: string): boolean {
    return this.purchasedAlbums.has(albumId);
  }

  async purchaseAlbumWithApplePay(albumId: string, price: number = 12.99): Promise<boolean> {
    try {
      console.log(`Processing Apple Pay for album ${albumId} at $${price}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const existing = this.purchasedAlbums.get(albumId);
      const purchasedAlbum: PurchasedAlbum = {
        id: albumId,
        count: existing ? existing.count + 1 : 1,
        purchaseDate: new Date(),
        paymentMethod: 'apple_pay',
        price: price
      };
      
      this.purchasedAlbums.set(albumId, purchasedAlbum);
      return true;
    } catch (error) {
      console.error('Apple Pay album purchase failed:', error);
      return false;
    }
  }

  async purchaseAlbumWithWeb3Wallet(albumId: string, price: number = 0.01): Promise<boolean> {
    try {
      console.log(`Processing Web3 wallet payment for album ${albumId} at ${price} ETH`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const existing = this.purchasedAlbums.get(albumId);
      const purchasedAlbum: PurchasedAlbum = {
        id: albumId,
        count: existing ? existing.count + 1 : 1,
        purchaseDate: new Date(),
        paymentMethod: 'web3_wallet',
        price: price
      };
      
      this.purchasedAlbums.set(albumId, purchasedAlbum);
      return true;
    } catch (error) {
      console.error('Web3 wallet album purchase failed:', error);
      return false;
    }
  }

  // Generic purchase method for songs (defaults to Apple Pay)
  async purchaseSong(songId: string, price: number = 1.99, paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'): Promise<boolean> {
    if (paymentMethod === 'apple_pay') {
      return this.purchaseWithApplePay(songId, price);
    } else {
      return this.purchaseWithWeb3Wallet(songId, price);
    }
  }

  // Generic purchase method for albums (defaults to Apple Pay)
  async purchaseAlbum(albumId: string, price: number = 12.99, paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'): Promise<boolean> {
    if (paymentMethod === 'apple_pay') {
      return this.purchaseAlbumWithApplePay(albumId, price);
    } else {
      return this.purchaseAlbumWithWeb3Wallet(albumId, price);
    }
  }

  // Video purchase methods
  async getPurchasedVideos(): Promise<Map<string, PurchasedVideo>> {
    return this.purchasedVideos;
  }

  getVideoPurchaseCount(videoId: string): number {
    const purchased = this.purchasedVideos.get(videoId);
    return purchased ? purchased.count : 0;
  }

  isVideoPurchased(videoId: string): boolean {
    return this.purchasedVideos.has(videoId);
  }

  async purchaseVideoWithApplePay(videoId: string, price: number = 2.99): Promise<boolean> {
    try {
      console.log(`Processing Apple Pay for video ${videoId} at $${price}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const existing = this.purchasedVideos.get(videoId);
      const purchasedVideo: PurchasedVideo = {
        id: videoId,
        count: existing ? existing.count + 1 : 1,
        purchaseDate: new Date(),
        paymentMethod: 'apple_pay',
        price: price
      };
      
      this.purchasedVideos.set(videoId, purchasedVideo);
      return true;
    } catch (error) {
      console.error('Apple Pay video purchase failed:', error);
      return false;
    }
  }

  async purchaseVideoWithWeb3Wallet(videoId: string, price: number = 0.002): Promise<boolean> {
    try {
      console.log(`Processing Web3 wallet payment for video ${videoId} at ${price} ETH`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const existing = this.purchasedVideos.get(videoId);
      const purchasedVideo: PurchasedVideo = {
        id: videoId,
        count: existing ? existing.count + 1 : 1,
        purchaseDate: new Date(),
        paymentMethod: 'web3_wallet',
        price: price
      };
      
      this.purchasedVideos.set(videoId, purchasedVideo);
      return true;
    } catch (error) {
      console.error('Web3 wallet video purchase failed:', error);
      return false;
    }
  }

  // Generic purchase method for videos (defaults to Apple Pay)
  async purchaseVideo(videoId: string, price: number = 2.99, paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'): Promise<boolean> {
    if (paymentMethod === 'apple_pay') {
      return this.purchaseVideoWithApplePay(videoId, price);
    } else {
      return this.purchaseVideoWithWeb3Wallet(videoId, price);
    }
  }

  // Ticket purchase methods
  async getPurchasedTickets(): Promise<Map<string, PurchasedTicket>> {
    return this.purchasedTickets;
  }

  getTicketPurchaseCount(tourDateId: string): number {
    const purchased = this.purchasedTickets.get(tourDateId);
    return purchased ? purchased.quantity : 0;
  }

  isTicketPurchased(tourDateId: string): boolean {
    return this.purchasedTickets.has(tourDateId);
  }

  getTickets(tourDateId: string): { id: string; qrCode: string; seatInfo?: string }[] {
    const purchased = this.purchasedTickets.get(tourDateId);
    return purchased ? purchased.tickets : [];
  }

  private generateTickets(quantity: number, tourDateId: string): { id: string; qrCode: string; seatInfo?: string }[] {
    const tickets = [];
    for (let i = 1; i <= quantity; i++) {
      tickets.push({
        id: `TKT-${tourDateId}-${Date.now()}-${i}`,
        qrCode: `QR-${tourDateId}-${Date.now()}-${i}`,
        seatInfo: `General Admission - ${i}`,
      });
    }
    return tickets;
  }

  async purchaseTicketWithApplePay(tourDateId: string, totalPrice: number, quantity: number = 1): Promise<boolean> {
    try {
      console.log(`Processing Apple Pay for ${quantity} ticket(s) for tour date ${tourDateId} at $${totalPrice}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tickets = this.generateTickets(quantity, tourDateId);
      const purchasedTicket: PurchasedTicket = {
        id: `PURCHASE-${tourDateId}-${Date.now()}`,
        tourDateId,
        quantity,
        totalPrice,
        purchaseDate: new Date(),
        paymentMethod: 'apple_pay',
        tickets,
      };
      
      this.purchasedTickets.set(tourDateId, purchasedTicket);
      return true;
    } catch (error) {
      console.error('Apple Pay ticket purchase failed:', error);
      return false;
    }
  }

  async purchaseTicketWithWeb3Wallet(tourDateId: string, totalPrice: number, quantity: number = 1): Promise<boolean> {
    try {
      console.log(`Processing Web3 wallet payment for ${quantity} ticket(s) for tour date ${tourDateId} at ${totalPrice} ETH`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const tickets = this.generateTickets(quantity, tourDateId);
      const purchasedTicket: PurchasedTicket = {
        id: `PURCHASE-${tourDateId}-${Date.now()}`,
        tourDateId,
        quantity,
        totalPrice,
        purchaseDate: new Date(),
        paymentMethod: 'web3_wallet',
        tickets,
      };
      
      this.purchasedTickets.set(tourDateId, purchasedTicket);
      return true;
    } catch (error) {
      console.error('Web3 wallet ticket purchase failed:', error);
      return false;
    }
  }

  // Generic purchase method for tickets (defaults to Apple Pay)
  async purchaseTicket(tourDateId: string, totalPrice: number, quantity: number = 1, paymentMethod: 'apple_pay' | 'web3_wallet' = 'apple_pay'): Promise<boolean> {
    if (paymentMethod === 'apple_pay') {
      return this.purchaseTicketWithApplePay(tourDateId, totalPrice, quantity);
    } else {
      return this.purchaseTicketWithWeb3Wallet(tourDateId, totalPrice, quantity);
    }
  }

  // Get available payment methods
  getPaymentMethods(): PaymentMethod[] {
    return [
      {
        type: 'apple_pay',
        label: 'Apple Pay',
        icon: 'logo-apple',
        description: 'Fast and secure'
      },
      {
        type: 'credit_card',
        label: 'Credit/Debit Card',
        icon: 'card-outline',
        description: 'Visa, Mastercard, Amex'
      },
      {
        type: 'web3_wallet',
        label: 'Web3 Wallet',
        icon: 'wallet-outline',
        description: 'Connect your crypto wallet'
      }
    ];
  }
}

export const purchaseService = new PurchaseService();
