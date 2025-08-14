import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart, CartItem, Product, Order, UserLibrary } from '../types/marketplace';
import { marketplaceService } from '../services/marketplaceService';
import { useAuthStore } from './authStore';

interface CartStore {
  cart: Cart | null;
  userLibrary: UserLibrary[];
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  // Cart actions
  initializeCart: () => Promise<void>;
  addToCart: (product: Product, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Order actions
  createOrder: (paymentMethod: string, billingAddress?: any, shippingAddress?: any) => Promise<Order>;
  loadOrders: () => Promise<void>;
  getOrder: (orderId: string) => Promise<Order>;
  
  // Library actions
  loadLibrary: () => Promise<void>;
  getLibraryByType: (type: string) => Promise<UserLibrary[]>;
  
  // Utilities
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isInCart: (productId: string, variantId?: string) => boolean;
  isOwned: (productId: string) => boolean;
  
  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      userLibrary: [],
      orders: [],
      isLoading: false,
      error: null,

      setError: (error: string | null) => set({ error }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      initializeCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const cart = await marketplaceService.getOrCreateCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to initialize cart:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      addToCart: async (product: Product, variantId?: string, quantity = 1) => {
        const user = useAuthStore.getState().user;
        try {
          set({ isLoading: true, error: null });

          if (!user) {
            // Guest cart: update local state only
            set((state) => {
              const existingCart = state.cart || {
                id: 'guest-cart',
                user_id: null,
                currency: 'USD',
                items: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as unknown as Cart;

              // Find existing item match by product and variant
              const items = [...(existingCart.items || [])];
              const idx = items.findIndex((it: any) =>
                it.product_id === product.id && ((variantId ? it.variant_id === variantId : !it.variant_id))
              );

              if (idx >= 0) {
                items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
              } else {
                const variant = variantId
                  ? product.product_variants?.find((v: any) => v.id === variantId)
                  : undefined;
                const price = variant?.price || product.price || 0;
                items.push({
                  id: `guest-item-${product.id}-${variantId || 'base'}`,
                  cart_id: existingCart.id,
                  product_id: product.id,
                  variant_id: variantId || null,
                  quantity,
                  price,
                  // Attach denormalized refs for UI
                  products: product as any,
                  product_variants: variant as any,
                } as unknown as CartItem);
              }

              return { cart: { ...existingCart, items }, isLoading: false } as any;
            });
            return;
          }

          await marketplaceService.addToCart(product.id, variantId, quantity);
          const cart = await marketplaceService.getOrCreateCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to add to cart:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      updateQuantity: async (itemId: string, quantity: number) => {
        const user = useAuthStore.getState().user;
        try {
          set({ isLoading: true, error: null });

          if (!user) {
            set((state) => {
              if (!state.cart) return { isLoading: false } as any;
              const items = (state.cart.items || []).map((it: any) =>
                it.id === itemId ? { ...it, quantity: Math.max(0, quantity) } : it
              ).filter((it: any) => it.quantity > 0);
              return { cart: { ...state.cart!, items }, isLoading: false } as any;
            });
            return;
          }

          await marketplaceService.updateCartItem(itemId, quantity);
          const cart = await marketplaceService.getOrCreateCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to update cart item:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      removeFromCart: async (itemId: string) => {
        const user = useAuthStore.getState().user;
        try {
          set({ isLoading: true, error: null });

          if (!user) {
            set((state) => {
              if (!state.cart) return { isLoading: false } as any;
              const items = (state.cart.items || []).filter((it: any) => it.id !== itemId);
              return { cart: { ...state.cart!, items }, isLoading: false } as any;
            });
            return;
          }

          await marketplaceService.removeFromCart(itemId);
          const cart = await marketplaceService.getOrCreateCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to remove from cart:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      clearCart: async () => {
        const user = useAuthStore.getState().user;
        try {
          set({ isLoading: true, error: null });

          if (!user) {
            set((state) => {
              if (!state.cart) return { isLoading: false } as any;
              return { cart: { ...state.cart, items: [] }, isLoading: false } as any;
            });
            return;
          }

          await marketplaceService.clearCart();
          const cart = await marketplaceService.getOrCreateCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to clear cart:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      refreshCart: async () => {
        const user = useAuthStore.getState().user;
        try {
          set({ isLoading: true, error: null });
          if (!user) {
            // Keep current guest cart without hitting network
            set({ isLoading: false });
            return;
          }
          const cart = await marketplaceService.getOrCreateCart();
          set({ cart, isLoading: false });
        } catch (error) {
          console.error('Failed to refresh cart:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createOrder: async (paymentMethod: string, billingAddress?: any, shippingAddress?: any) => {
        try {
          set({ isLoading: true, error: null });
          
          const order = await marketplaceService.createOrder({
            paymentMethod,
            billingAddress,
            shippingAddress
          });
          
          // Refresh cart and library after order creation
          const [cart, userLibrary] = await Promise.all([
            marketplaceService.getOrCreateCart(),
            marketplaceService.getUserLibrary()
          ]);
          
          set({ 
            cart, 
            userLibrary,
            orders: [order, ...get().orders],
            isLoading: false 
          });
          
          return order;
        } catch (error) {
          console.error('Failed to create order:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      loadOrders: async () => {
        try {
          set({ isLoading: true, error: null });
          const orders = await marketplaceService.getUserOrders();
          set({ orders, isLoading: false });
        } catch (error) {
          console.error('Failed to load orders:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      getOrder: async (orderId: string) => {
        try {
          set({ isLoading: true, error: null });
          const order = await marketplaceService.getOrder(orderId);
          set({ isLoading: false });
          return order;
        } catch (error) {
          console.error('Failed to get order:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      loadLibrary: async () => {
        try {
          set({ isLoading: true, error: null });
          const userLibrary = await marketplaceService.getUserLibrary();
          set({ userLibrary, isLoading: false });
        } catch (error) {
          console.error('Failed to load library:', error);
          // Don't set error state for authentication errors
          if ((error as Error).message === 'Not authenticated') {
            set({ userLibrary: [], isLoading: false });
          } else {
            set({ error: (error as Error).message, isLoading: false });
          }
        }
      },

      getLibraryByType: async (type: string) => {
        try {
          set({ isLoading: true, error: null });
          const libraryItems = await marketplaceService.getLibraryByType(type as any);
          set({ isLoading: false });
          return libraryItems;
        } catch (error) {
          console.error('Failed to get library by type:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      getCartTotal: () => {
        const cart = get().cart;
        if (!cart?.items) return 0;
        
        const subtotal = cart.items.reduce((sum, item) => {
          const price = item.product_variants?.price || item.products?.price || 0;
          return sum + (price * item.quantity);
        }, 0);
        
        const tax = subtotal * 0.08; // 8% tax
        const hasPhysicalItems = cart.items.some(item => 
          item.products?.shipping_required
        );
        const shipping = hasPhysicalItems ? 5.99 : 0;
        
        return subtotal + tax + shipping;
      },

      getCartItemCount: () => {
        const cart = get().cart;
        return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      },

      isInCart: (productId: string, variantId?: string) => {
        const cart = get().cart;
        if (!cart?.items) return false;
        
        return cart.items.some(item => 
          item.product_id === productId && 
          (variantId ? item.variant_id === variantId : !item.variant_id)
        );
      },

      isOwned: (productId: string) => {
        const library = get().userLibrary;
        if (!library) return false;
        
        return library.some(item => item.product_id === productId);
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-async data
      partialize: (state) => ({
        orders: state.orders,
        userLibrary: state.userLibrary,
      }),
    }
  )
);