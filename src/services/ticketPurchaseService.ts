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
    paymentMethod
  }: PurchaseTicketsParams & { paymentMethod: PaymentMethod }) {
    const { data: purchase, error: purchaseError } = await supabase
      .from('ticket_purchases')
      .insert({
        user_id: userId,
        show_id: showId,
        quantity,
        total_amount: quantity * unitPrice,
        status: 'pending',
        payment_method: paymentMethod
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;
    return purchase;
  }

  private async generateTickets(purchaseId: string, showId: string, userId: string, quantity: number) {
    const tickets: Partial<Ticket>[] = Array(quantity).fill(null).map(() => ({
      purchase_id: purchaseId,
      show_id: showId,
      user_id: userId,
      qr_code: generateQRCode(),
      status: 'valid'
    }));

    const { data: createdTickets, error: ticketsError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();

    if (ticketsError) throw ticketsError;
    return createdTickets;
  }

  private async completePurchase(purchaseId: string, paymentIntentId?: string) {
    const { data: updatedPurchase, error: updateError } = await supabase
      .from('ticket_purchases')
      .update({ 
        status: 'completed',
        payment_intent_id: paymentIntentId 
      })
      .eq('id', purchaseId)
      .select(`
        *,
        tickets (*)
      `)
      .single();

    if (updateError) throw updateError;
    return updatedPurchase;
  }

  async purchaseTicketsWithApplePay({
    showId,
    quantity,
    userId,
    unitPrice
  }: PurchaseTicketsParams): Promise<TicketPurchase> {
    try {
      // 1. Create pending purchase record
      const purchase = await this.createPurchaseRecord({
        showId,
        quantity,
        userId,
        unitPrice,
        paymentMethod: 'apple_pay'
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
        // Update purchase status to failed
        await supabase
          .from('ticket_purchases')
          .update({ status: 'failed' })
          .eq('id', purchase.id);

        throw new Error('Payment was cancelled or failed');
      }

      // 3. Process the payment with your payment processor
      // Here you would typically send the payment token to your server
      // and process it with your payment provider

      // 4. Generate tickets
      await this.generateTickets(purchase.id, showId, userId, quantity);

      // 5. Complete purchase
      return await this.completePurchase(purchase.id, paymentResult.transactionIdentifier);
    } catch (error) {
      console.error('Error processing ticket purchase:', error);
      throw error;
    }
  }

  async getPurchaseHistory(userId: string): Promise<TicketPurchase[]> {
    const { data, error } = await supabase
      .from('ticket_purchases')
      .select(`
        *,
        tickets (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async purchaseTicketsWithCard({
    showId,
    quantity,
    userId,
    unitPrice,
    cardDetails
  }: PurchaseTicketsParams & { cardDetails: CardDetails }): Promise<TicketPurchase> {
    try {
      // 1. Create pending purchase record
      const purchase = await this.createPurchaseRecord({
        showId,
        quantity,
        userId,
        unitPrice,
        paymentMethod: 'card'
      });

      // 2. Process card payment (implement your payment processor integration here)
      // This is a placeholder for your actual payment processing logic
      const paymentResult = await this.processCardPayment(cardDetails, quantity * unitPrice);

      // 3. Generate tickets
      await this.generateTickets(purchase.id, showId, userId, quantity);

      // 4. Complete purchase
      return await this.completePurchase(purchase.id, paymentResult.paymentIntentId);
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
    web3Provider
  }: PurchaseTicketsParams & { web3Provider: Web3Provider }): Promise<TicketPurchase> {
    try {
      if (!web3Provider.isConnected) {
        throw new Error('Web3 wallet not connected');
      }

      // 1. Create pending purchase record
      const purchase = await this.createPurchaseRecord({
        showId,
        quantity,
        userId,
        unitPrice,
        paymentMethod: 'web3_wallet'
      });

      // 2. Calculate ETH amount (you should implement proper price conversion)
      const ethAmount = (quantity * unitPrice * 0.0004).toFixed(6);

      // 3. Send transaction
      const transaction = await web3Provider.sendTransaction({
        to: '0xYourContractAddress', // Replace with your actual contract address
        value: ethAmount
      });

      // 4. Generate tickets
      await this.generateTickets(purchase.id, showId, userId, quantity);

      // 5. Complete purchase
      return await this.completePurchase(purchase.id, transaction.hash);
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
      .from('tickets')
      .select('*')
      .eq('show_id', showId)
      .eq('user_id', userId)
      .eq('status', 'valid');

    if (error) throw error;
    return data;
  }
}

// Helper function to generate a QR code
function generateQRCode(): string {
  // This is a simple implementation - you should use a more secure method
  return `TICKET-${Math.random().toString(36).substring(2)}-${Date.now()}`;
}

export const ticketPurchaseService = new TicketPurchaseService();
