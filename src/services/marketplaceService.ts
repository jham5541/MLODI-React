import { supabase } from '../lib/supabase/client';
import { 
  Product, 
  Cart, 
  CartItem, 
  Order, 
  UserLibrary,
  MarketplaceFilters,
  ProductType 
} from '../types/marketplace';

export class MarketplaceService {
  // Products
  async getProducts(filters?: MarketplaceFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        artists(id, name, avatar_url, is_verified),
        product_categories(id, name, slug),
        product_variants(*)
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.artist_id) {
      query = query.eq('artist_id', filters.artist_id);
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.price_min !== undefined) {
      query = query.gte('price', filters.price_min);
    }

    if (filters?.price_max !== undefined) {
      query = query.lte('price', filters.price_max);
    }

    if (filters?.on_sale) {
      query = query.eq('is_on_sale', true);
    }

    if (filters?.search) {
      query = query.or(`
        title.ilike.%${filters.search}%,
        description.ilike.%${filters.search}%,
        artists.name.ilike.%${filters.search}%
      `);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Sorting
    switch (filters?.sort_by) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('title', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('title', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Product[];
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        artists(id, name, avatar_url, is_verified),
        product_categories(id, name, slug),
        product_variants(*),
        songs(id, title, duration_ms),
        albums(id, title, total_tracks)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data as Product;
  }

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        artists(id, name, avatar_url, is_verified)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Product[];
  }

  async getProductsByType(type: ProductType, limit = 20): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        artists(id, name, avatar_url, is_verified)
      `)
      .eq('is_active', true)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Product[];
  }

  // Cart Management
  async getOrCreateCart(): Promise<Cart> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Try to get existing cart
    let { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error?.code === 'PGRST116') {
      // No cart exists, create one
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          currency: 'USD'
        })
        .select()
        .single();

      if (createError) throw createError;
      cart = newCart;
    } else if (error) {
      throw error;
    }

    // Get cart items
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products(*),
        product_variants(*)
      `)
      .eq('cart_id', cart.id);

    if (itemsError) throw itemsError;

    return {
      ...cart,
      items: cartItems as CartItem[]
    } as Cart;
  }

  async addToCart(productId: string, variantId?: string, quantity = 1): Promise<void> {
    const cart = await this.getOrCreateCart();
    
    // Get product to check price
    const product = await this.getProduct(productId);
    let price = product.price;
    
    if (variantId) {
      const variant = product.product_variants?.find(v => v.id === variantId);
      if (variant) {
        price = variant.price || product.price;
      }
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null)
      .single();

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          price
        })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Add new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
          price
        });

      if (error) throw error;
    }
  }

  async updateCartItem(cartItemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeFromCart(cartItemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (error) throw error;
  }

  async removeFromCart(cartItemId: string): Promise<void> {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  }

  async clearCart(): Promise<void> {
    const cart = await this.getOrCreateCart();
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) throw error;
  }

  // Checkout
  async createOrder(checkoutData: {
    paymentMethod: string;
    billingAddress?: any;
    shippingAddress?: any;
    paymentReference?: string;
  }): Promise<Order> {
    const cart = await this.getOrCreateCart();
    
    if (!cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Call the checkout Edge Function
    const { data, error } = await supabase.functions.invoke('marketplace-checkout', {
      body: {
        cart_id: cart.id,
        payment_method: checkoutData.paymentMethod,
        billing_address: checkoutData.billingAddress,
        shipping_address: checkoutData.shippingAddress,
        payment_reference: checkoutData.paymentReference
      }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    // Get the created order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', data.order_id)
      .single();

    if (orderError) throw orderError;
    return order as Order;
  }

  // Orders
  async getUserOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Order[];
  }

  async getOrder(orderId: string): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data as Order;
  }

  // User Library
  async getUserLibrary(): Promise<UserLibrary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_library')
      .select(`
        *,
        products(*),
        orders(order_number)
      `)
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data as UserLibrary[];
  }

  async getLibraryByType(type: ProductType): Promise<UserLibrary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_library')
      .select(`
        *,
        products(*),
        orders(order_number)
      `)
      .eq('user_id', user.id)
      .eq('products.type', type)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data as UserLibrary[];
  }

  // Product Categories
  async getCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data;
  }

  // Search
  async searchProducts(query: string, filters?: Partial<MarketplaceFilters>): Promise<Product[]> {
    return this.getProducts({
      ...filters,
      search: query
    });
  }

  // Wishlist
  async addToWishlist(productId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        product_id: productId
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
  }

  async removeFromWishlist(productId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;
  }

  async getWishlist(): Promise<Product[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        products(
          *,
          artists(id, name, avatar_url, is_verified)
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return data.map(item => item.products) as Product[];
  }

  // Listings (alias for products)
  async getListings(filters?: MarketplaceFilters): Promise<Product[]> {
    return this.getProducts(filters);
  }

  // Statistics
  async getMarketplaceStats(): Promise<any> {
    // Get total products by type
    const { data: stats, error } = await supabase
      .from('products')
      .select('type')
      .eq('is_active', true);

    if (error) throw error;

    const statsByType = stats.reduce((acc, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts: stats.length,
      productsByType: statsByType
    };
  }
}

export const marketplaceService = new MarketplaceService();