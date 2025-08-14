import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as ApplePay from 'expo-apple-authentication';

export type PaymentMethod = 'apple_pay' | 'card' | 'web3_wallet';

export interface CardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface TicketPurchase {
  id: string;
  user_id: string;
  show_id: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: PaymentMethod;
  payment_intent_id?: string;
  created_at: string;
  tickets: Ticket[];
}

export interface Ticket {
  id: string;
  purchase_id: string;
  show_id: string;
  user_id: string;
  qr_code: string;
  status: 'valid' | 'used' | 'cancelled';
  seat_info?: {
    section: string;
    row: string;
    seat: string;
  };
  used_at?: string;
  created_at: string;
}

interface PurchaseTicketsParams {
  showId: string;
  quantity: number;
  userId: string;
  unitPrice: number;
}

export interface Web3Provider {
  address: string;
  chainId: string;
  isConnected: boolean;
  sendTransaction: (params: { to: string; value: string }) => Promise<{ hash: string }>;
}

class TicketPurchaseService {
  async isApplePayAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    try {
      return await ApplePay.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Apple Pay availability:', error);
      return false;
    }
  }

  private async createPurchaseRecord({
    showId,
    quantity,
    userId,
    unitPrice,
    paymentMethod,
    venue = 'Concert Venue',
    city = 'City',
    date = new Date().toISOString(),
    artistName = 'Artist'
  }: PurchaseTicketsParams & { 
    paymentMethod: PaymentMethod,
    venue?: string,
    city?: string,
    date?: string,
    artistName?: string
  }) {
    // Generate tickets with QR codes
    const tickets = Array(quantity).fill(null).map(() => ({
      id: `TICKET-${Math.random().toString(36).substring(2)}-${Date.now()}`,
      qrCode: generateQRCode(),
      status: 'valid',
      seatInfo: 'General Admission'
    }));

    const { data: purchase, error: purchaseError } = await supabase
      .from('ticket_purchases')
      .insert({
        user_id: userId,
        event_id: showId,
        event_name: `${artistName} Live`,
        artist_name: artistName,
        venue: venue,
        event_date: date,
        quantity,
        total_price: quantity * unitPrice,
        purchase_date: new Date().toISOString(),
        payment_method: paymentMethod,
        tickets: tickets // Store tickets directly in JSONB field
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;
    return purchase;
  }

  private async generateTickets(purchaseId: string, showId: string, userId: string, quantity: number) {
    // This method is no longer needed since tickets are stored in JSONB field
    // Keeping for backward compatibility but returning empty array
    return [];
  }

  private async completePurchase(purchaseId: string, paymentIntentId?: string) {
    const { data: updatedPurchase, error: updateError } = await supabase
      .from('ticket_purchases')
      .update({ 
        transaction_hash: paymentIntentId 
      })
      .eq('id', purchaseId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedPurchase;
  }

  async purchaseTicketsWithApplePay({
    showId,
    quantity,
    userId,
    unitPrice,
    venue = 'Concert Venue',
    city = 'City',
    date = new Date().toISOString(),
    artistName = 'Artist'
  }: PurchaseTicketsParams & {
    venue?: string,
    city?: string,
    date?: string,
    artistName?: string
  }): Promise<TicketPurchase> {
    try {
      // 1. Create purchase record with tickets
      const purchase = await this.createPurchaseRecord({
        showId,
        quantity,
        userId,
        unitPrice,
        paymentMethod: 'apple_pay',
        venue,
        city,
        date,
        artistName
      });

      // 2. Request Apple Pay payment
      const paymentResult = await ApplePay.requestPaymentAsync({
        merchantIdentifier: 'merchant.com.mlodi.app',
        supportedNetworks: ['visa', 'mastercard', 'amex'],
        countryCode: 'US',
        currencyCode: 'USD',
        paymentSummaryItems: [
          {
            label: `${quantity} Concert Ticket${quantity > 1 ? 's' : ''}`,
            amount: unitPrice * quantity,
          }
        ],
      });

      if (!paymentResult) {
        throw new Error('Payment was cancelled or failed');
      }

      // 3. Complete purchase
      const completedPurchase = await this.completePurchase(purchase.id, paymentResult.transactionIdentifier);
      
      // Convert JSONB tickets to the expected format
      return {
        ...completedPurchase,
        status: 'completed',
        tickets: completedPurchase.tickets || []
      } as TicketPurchase;
    } catch (error) {
      console.error('Error processing ticket purchase:', error);
      throw error;
    }
  }

  async getPurchaseHistory(userId: string): Promise<TicketPurchase[]> {
    const { data, error } = await supabase
      .from('ticket_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert JSONB tickets to the expected format
    return data.map(purchase => ({
      ...purchase,
      id: purchase.id,
      user_id: purchase.user_id,
      show_id: purchase.event_id,
      quantity: purchase.quantity,
      total_amount: purchase.total_price,
      status: 'completed',
      payment_method: purchase.payment_method,
      payment_intent_id: purchase.transaction_hash,
      created_at: purchase.created_at,
      tickets: purchase.tickets || []
    })) as TicketPurchase[];
  }

  async purchaseTicketsWithCard({
    showId,
    quantity,
    userId,
    unitPrice,
    cardDetails,
    venue = 'Concert Venue',
    city = 'City',
    date = new Date().toISOString(),
    artistName = 'Artist'
  }: PurchaseTicketsParams & { 
    cardDetails: CardDetails,
    venue?: string,
    city?: string,
    date?: string,
    artistName?: string
  }): Promise<TicketPurchase> {
    try {
      // 1. Create purchase record with tickets
      const purchase = await this.createPurchaseRecord({
        showId,
        quantity,
        userId,
        unitPrice,
        paymentMethod: 'card',
        venue,
        city,
        date,
        artistName
      });

      // 2. Process card payment (implement your payment processor integration here)
      // This is a placeholder for your actual payment processing logic
      const paymentResult = await this.processCardPayment(cardDetails, quantity * unitPrice);

      // 3. Complete purchase
      const completedPurchase = await this.completePurchase(purchase.id, paymentResult.paymentIntentId);
      
      // Convert JSONB tickets to the expected format
      return {
        ...completedPurchase,
        status: 'completed',
        tickets: completedPurchase.tickets || []
      } as TicketPurchase;
    } catch (error) {
      console.error('Error processing card payment:', error);
      throw error;
    }
  }

  async purchaseTicketsWithWeb3({
    showId,
    quantity,
    userId,
    unitPrice,
    web3Provider,
    venue = 'Concert Venue',
    city = 'City',
    date = new Date().toISOString(),
    artistName = 'Artist'
  }: PurchaseTicketsParams & { 
    web3Provider: Web3Provider,
    venue?: string,
    city?: string,
    date?: string,
    artistName?: string
  }): Promise<TicketPurchase> {
    try {
      if (!web3Provider.isConnected) {
        throw new Error('Web3 wallet not connected');
      }

      // 1. Create purchase record with tickets
      const purchase = await this.createPurchaseRecord({
        showId,
        quantity,
        userId,
        unitPrice,
        paymentMethod: 'web3_wallet',
        venue,
        city,
        date,
        artistName
      });

      // 2. Calculate ETH amount (you should implement proper price conversion)
      const ethAmount = (quantity * unitPrice * 0.0004).toFixed(6);

      // 3. Send transaction
      const transaction = await web3Provider.sendTransaction({
        to: '0xYourContractAddress', // Replace with your actual contract address
        value: ethAmount
      });

      // 4. Complete purchase
      const completedPurchase = await this.completePurchase(purchase.id, transaction.hash);
      
      // Convert JSONB tickets to the expected format
      return {
        ...completedPurchase,
        status: 'completed',
        tickets: completedPurchase.tickets || []
      } as TicketPurchase;
    } catch (error) {
      console.error('Error processing Web3 payment:', error);
      throw error;
    }
  }

  // Placeholder for card payment processing
  private async processCardPayment(cardDetails: CardDetails, amount: number) {
    // Implement your payment processor integration here
    // This is just a placeholder
    return {
      success: true,
      paymentIntentId: `pi_${Date.now()}`
    };
  }

  async getTicketsForShow(showId: string, userId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('ticket_purchases')
      .select('*')
      .eq('event_id', showId)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Extract tickets from JSONB field
    const allTickets: Ticket[] = [];
    data?.forEach(purchase => {
      if (purchase.tickets && Array.isArray(purchase.tickets)) {
        purchase.tickets.forEach((ticket: any) => {
          allTickets.push({
            id: ticket.id || `TICKET-${Date.now()}`,
            purchase_id: purchase.id,
            show_id: showId,
            user_id: userId,
            qr_code: ticket.qrCode || ticket.qr_code || generateQRCode(),
            status: ticket.status || 'valid',
            seat_info: ticket.seatInfo ? {
              section: ticket.seatInfo,
              row: '',
              seat: ''
            } : undefined,
            created_at: purchase.created_at
          });
        });
      }
    });
    
    return allTickets;
  }
}

// Helper function to generate a QR code
function generateQRCode(): string {
  // This is a simple implementation - you should use a more secure method
  return `TICKET-${Math.random().toString(36).substring(2)}-${Date.now()}`;
}

export const ticketPurchaseService = new TicketPurchaseService();
