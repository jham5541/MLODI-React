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
        description.ilike.%${filters.search}%
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
    
    // Fetch artists separately
    const products = data as Product[];
    if (products && products.length > 0) {
      const artistIds = [...new Set(products.map(p => p.artist_id).filter(Boolean))];
      if (artistIds.length > 0) {
        const { data: artists } = await supabase
          .from('artists')
          .select('id, name, avatar_url, is_verified')
          .in('id', artistIds);
        
        if (artists) {
          const artistMap = new Map(artists.map(a => [a.id, a]));
          products.forEach(product => {
            if (product.artist_id) {
              product.artist = artistMap.get(product.artist_id);
            }
          });
        }
      }
    }
    
    return products;
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(id, name, slug),
        product_variants(*),
        songs(id, title, duration_ms),
        albums(id, title, total_tracks)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    
    const product = data as Product;
    
    // Fetch artist separately
    if (product.artist_id) {
      const { data: artist } = await supabase
        .from('artists')
        .select('id, name, avatar_url, is_verified')
        .eq('id', product.artist_id)
        .single();
      
      if (artist) {
        product.artist = artist;
      }
    }
    
    return product;
  }

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
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
      .select('*')
      .eq('is_active', true)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Fetch artists separately
    const products = data as Product[];
    if (products && products.length > 0) {
      const artistIds = [...new Set(products.map(p => p.artist_id).filter(Boolean))];
      if (artistIds.length > 0) {
        const { data: artists } = await supabase
          .from('artists')
          .select('id, name, avatar_url, is_verified')
          .in('id', artistIds);
        
        if (artists) {
          const artistMap = new Map(artists.map(a => [a.id, a]));
          products.forEach(product => {
            if (product.artist_id) {
              product.artist = artistMap.get(product.artist_id);
            }
          });
        }
      }
    }
    
    return products;
  }

  // Cart Management
  async getOrCreateCart(): Promise<Cart> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      try {
        // Try to get existing cart
        let { data: cart, error } = await supabase
          .from('carts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cart || error?.code === 'PGRST116' || error?.code === '42501') {
          // No cart exists or permission denied, create one
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .upsert({
              user_id: user.id,
              currency: 'USD'
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: true 
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating cart:', createError);
            // Return sample cart for development
            return {
              id: 'sample-cart-id',
              user_id: user.id,
              currency: 'USD',
              items: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Cart;
          }
          cart = newCart;
        }

        return {
          ...cart,
          items: [],
          created_at: cart.created_at || new Date().toISOString(),
          updated_at: cart.updated_at || new Date().toISOString()
        } as Cart;

      } catch (error) {
        console.error('Error getting/creating cart:', error);
        // Return sample cart for development
        return {
          id: 'sample-cart-id',
          user_id: user.id,
          currency: 'USD',
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Cart;
      }

      // Get cart items
      const { data: cartItemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id);

      if (itemsError) {
        console.error('Error getting cart items:', itemsError);
        return {
          ...cart,
          items: []
        } as Cart;
      }

      if (!cartItemsData || cartItemsData.length === 0) {
        return {
          ...cart,
          items: []
        } as Cart;
      }
      
      // Manually fetch products for cart items since the relationship is broken
      const productIds = [...new Set(cartItemsData.map(item => item.product_id).filter(Boolean))];
      let productsMap = new Map();
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productsError) {
          console.error('Error getting products:', productsError);
          return {
            ...cart,
            items: []
          } as Cart;
        }
        productsMap = new Map(products.map(p => [p.id, p]));
      }
      
      // Manually fetch product variants for cart items since the relationship is broken
      const variantIds = [...new Set(cartItemsData.map(item => item.variant_id).filter(Boolean))];
      let variantsMap = new Map();
      if (variantIds.length > 0) {
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .in('id', variantIds);

        if (variantsError) {
          console.error('Error getting variants:', variantsError);
          return {
            ...cart,
            items: []
          } as Cart;
        }
        variantsMap = new Map(variants.map(v => [v.id, v]));
      }

      const populatedCartItems = cartItemsData.map(item => ({
        ...item,
        products: productsMap.get(item.product_id),
        product_variants: variantsMap.get(item.variant_id),
      }));

      return {
        ...cart,
        items: populatedCartItems as CartItem[]
      } as Cart;

    } catch (error) {
      console.error('Error in getOrCreateCart:', error);
      // Return empty cart for development
      return {
        id: 'sample-cart-id',
        user_id: null,
        currency: 'USD',
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Cart;
    }

    // Get cart items
    const { data: cartItemsData, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError) throw itemsError;

    if (!cartItemsData || cartItemsData.length === 0) {
      return {
        ...cart,
        items: []
      } as Cart;
    }
    
    // Manually fetch products for cart items since the relationship is broken
    const productIds = [...new Set(cartItemsData.map(item => item.product_id).filter(Boolean))];
    let productsMap = new Map();
    if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);

        if (productsError) throw productsError;
        productsMap = new Map(products.map(p => [p.id, p]));
    }
    
    // Manually fetch product variants for cart items since the relationship is broken
    const variantIds = [...new Set(cartItemsData.map(item => item.variant_id).filter(Boolean))];
    let variantsMap = new Map();
    if (variantIds.length > 0) {
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('*')
            .in('id', variantIds);

        if (variantsError) throw variantsError;
        variantsMap = new Map(variants.map(v => [v.id, v]));
    }

    const populatedCartItems = cartItemsData.map(item => ({
      ...item,
      products: productsMap.get(item.product_id),
      product_variants: variantsMap.get(item.variant_id),
    }));

    return {
      ...cart,
      items: populatedCartItems as CartItem[]
    } as Cart;
  }

  async addToCart(productId: string, variantId?: string, quantity = 1): Promise<void> {
    try {
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
      const { data: existingItem, error: selectError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .eq('product_id', productId)
        .eq('variant_id', variantId || null)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking cart item:', selectError);
        return;
      }

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            price
          })
          .eq('id', existingItem.id);

        if (error) {
          console.error('Error updating cart item:', error);
          return;
        }
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

        if (error) {
          console.error('Error adding cart item:', error);
          return;
        }
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
      // In development, continue silently
      return;
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
        products(*)
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