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

export interface MerchOrderInput {
  user_id: string;
  artist_id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
  shipping_info: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export const merchandiseService = {
  async getArtistMerchandise(artistId: string): Promise<Merchandise[]> {
    try {
      // Use the public view for listeners
      const { data, error } = await supabase
        .from('artist_merchandise_listener')
        .select('*')
        .eq('artist_id', artistId)
        .eq('availability', 'available')
        .order('product_id', { ascending: false });

      if (error) {
        console.error('Error fetching merchandise:', error);
        throw error;
      }

      // Transform the data from the view format to our Merchandise interface
      const transformedData: Merchandise[] = (data || []).map(item => ({
        id: item.product_id,
        artist_id: item.artist_id,
        name: item.title || 'Untitled Product',
        description: item.description,
        price: item.price || 0,
        image_url: item.image_url || 'https://picsum.photos/400/400',
        category: item.type as 'clothing' | 'accessories' | 'music' | 'collectibles' | 'other' || 'other',
        inventory_count: 100, // Default since not in view
        is_active: item.availability === 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getArtistMerchandise:', error);
      // Return empty array on error to prevent crash
      return [];
    }
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
  },

  async createMerchOrder(order: MerchOrderInput): Promise<any> {
    try {
      // First, create the merchandise order
      const orderData = {
        user_id: order.user_id,
        merchandise_id: order.product_id,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        shipping_address: {
          full_name: order.shipping_info.fullName,
          address: order.shipping_info.address,
          city: order.shipping_info.city,
          state: order.shipping_info.state,
          zip_code: order.shipping_info.zipCode,
          country: order.shipping_info.country,
          phone: order.shipping_info.phone
        },
        payment_method: 'credit_card' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: merchOrder, error: orderError } = await supabase
        .from('merchandise_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating merchandise order:', orderError);
        // Continue anyway to try artist_fan_orders
      }

      // Then, create the artist fan order record
      const fanOrderData = {
        artist_id: order.artist_id,
        fan_user_id: order.user_id,
        order_id: merchOrder?.id || crypto.randomUUID(),
        size: order.size,
        shipping_snapshot: {
          fullName: order.shipping_info.fullName,
          address: order.shipping_info.address,
          city: order.shipping_info.city,
          state: order.shipping_info.state,
          zipCode: order.shipping_info.zipCode,
          country: order.shipping_info.country,
          phone: order.shipping_info.phone,
          productName: order.product_name,
          quantity: order.quantity,
          price: order.price,
          total: order.total,
          orderDate: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      const { data: fanOrder, error: fanOrderError } = await supabase
        .from('artist_fan_orders')
        .insert(fanOrderData)
        .select()
        .single();

      if (fanOrderError) {
        console.error('Error creating artist fan order:', fanOrderError);
        throw fanOrderError;
      }

      return { merchOrder, fanOrder };
    } catch (error) {
      console.error('Error in createMerchOrder:', error);
      throw error;
    }
  },

  async getArtistOrders(artistId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('artist_fan_orders')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching artist orders:', error);
      throw error;
    }

    return data || [];
  }
};

export default merchandiseService;
