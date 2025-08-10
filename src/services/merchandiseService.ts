import { supabase } from '../lib/supabase';

export interface Merchandise {
  id: string;
  artist_id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  category: 'clothing' | 'accessories' | 'music' | 'collectibles' | 'other';
  inventory_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchandiseVariant {
  id: string;
  merchandise_id: string;
  name: string;
  sku: string;
  price: number;
  inventory_count: number;
  attributes: Record<string, any>;
}

export interface MerchandiseOrder {
  id: string;
  user_id: string;
  merchandise_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: {
    full_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_method: 'apple_pay' | 'credit_card' | 'crypto';
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export const merchandiseService = {
  async getArtistMerchandise(artistId: string): Promise<Merchandise[]> {
    const { data, error } = await supabase
      .from('merchandise')
      .select(`
        *,
        variants:merchandise_variants(*)
      `)
      .eq('artist_id', artistId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMerchandiseById(merchandiseId: string): Promise<Merchandise> {
    const { data, error } = await supabase
      .from('merchandise')
      .select(`
        *,
        variants:merchandise_variants(*)
      `)
      .eq('id', merchandiseId)
      .single();

    if (error) throw error;
    return data;
  },

  async getMerchandiseVariants(merchandiseId: string): Promise<MerchandiseVariant[]> {
    const { data, error } = await supabase
      .from('merchandise_variants')
      .select('*')
      .eq('merchandise_id', merchandiseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createOrder(order: Omit<MerchandiseOrder, 'id' | 'created_at' | 'updated_at'>): Promise<MerchandiseOrder> {
    const { data, error } = await supabase
      .from('merchandise_orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(orderId: string, status: MerchandiseOrder['status'], trackingNumber?: string): Promise<void> {
    const updates: Partial<MerchandiseOrder> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
    }

    const { error } = await supabase
      .from('merchandise_orders')
      .update(updates)
      .eq('id', orderId);

    if (error) throw error;
  },

  async getUserOrders(userId: string): Promise<MerchandiseOrder[]> {
    const { data, error } = await supabase
      .from('merchandise_orders')
      .select(`
        *,
        merchandise:merchandise(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  subscribeMerchandiseUpdates(merchandiseId: string, callback: () => void) {
    return supabase
      .channel(`merchandise:${merchandiseId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'merchandise',
        filter: `id=eq.${merchandiseId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'merchandise_variants',
        filter: `merchandise_id=eq.${merchandiseId}`
      }, callback)
      .subscribe();
  },

  subscribeOrderUpdates(orderId: string, callback: () => void) {
    return supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'merchandise_orders',
        filter: `id=eq.${orderId}`
      }, callback)
      .subscribe();
  }
};

export default merchandiseService;
