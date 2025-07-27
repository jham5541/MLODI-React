export type ProductType = 'song' | 'album' | 'video' | 'merch';

export interface BaseProduct {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  price: number;
  currency: string;
  type: ProductType;
  description?: string;
  featured?: boolean;
  onSale?: boolean;
  originalPrice?: number;
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SongProduct extends BaseProduct {
  type: 'song';
  duration: number;
  audioUrl: string;
  album?: string;
  albumId?: string;
  genre: string;
  explicit: boolean;
  previewUrl?: string;
}

export interface AlbumProduct extends BaseProduct {
  type: 'album';
  releaseDate: string;
  trackCount: number;
  totalDuration: number;
  songs: SongProduct[];
  genre: string;
  explicit: boolean;
}

export interface VideoProduct extends BaseProduct {
  type: 'video';
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  quality: 'HD' | 'FHD' | '4K';
  genre: string;
  explicit: boolean;
  previewUrl?: string;
}

export interface MerchProduct extends BaseProduct {
  type: 'merch';
  category: 'clothing' | 'accessories' | 'collectibles' | 'vinyl' | 'cd' | 'poster' | 'other';
  variants: ProductVariant[];
  images: string[];
  specifications?: Record<string, string>;
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    estimatedDays: number;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { size: 'L', color: 'Red' }
  sku: string;
  images?: string[];
}

export type Product = SongProduct | AlbumProduct | VideoProduct | MerchProduct;

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  variantId?: string;
  variant?: ProductVariant;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: PaymentMethod;
  shippingAddress?: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface UserLibrary {
  userId: string;
  songs: SongProduct[];
  albums: AlbumProduct[];
  videos: VideoProduct[];
  purchases: Order[];
  updatedAt: string;
}

export interface MarketplaceFilters {
  type?: ProductType[];
  priceRange?: {
    min: number;
    max: number;
  };
  categories?: string[];
  tags?: string[];
  artists?: string[];
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular' | 'featured';
  onSale?: boolean;
  search?: string;
}

export interface MarketplaceStats {
  totalProducts: number;
  totalArtists: number;
  totalSales: number;
  featuredProducts: Product[];
  popularCategories: Array<{
    name: string;
    count: number;
  }>;
}

// Supabase Product Types (from database)
export interface SupabaseProduct {
  id: string;
  title: string;
  description?: string;
  type: ProductType;
  artist_id?: string;
  price: number;
  original_price?: number;
  currency: string;
  song_id?: string;
  album_id?: string;
  audio_url?: string;
  video_url?: string;
  preview_url?: string;
  duration_ms?: number;
  quality?: string;
  category_id?: string;
  weight_grams?: number;
  dimensions_json?: any;
  shipping_required: boolean;
  cover_url?: string;
  images?: any;
  tags?: string[];
  genre?: string;
  explicit: boolean;
  stock_quantity: number;
  track_inventory: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  slug?: string;
  sort_order: number;
  release_date?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  artists?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  product_categories?: {
    id: string;
    name: string;
    slug: string;
  };
  product_variants?: SupabaseProductVariant[];
  songs?: {
    id: string;
    title: string;
    duration_ms: number;
  };
  albums?: {
    id: string;
    title: string;
    total_tracks: number;
  };
}

export interface SupabaseProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price?: number;
  stock_quantity: number;
  attributes?: any;
  images?: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCart {
  id: string;
  user_id: string;
  session_id?: string;
  currency: string;
  created_at: string;
  updated_at: string;
  items?: SupabaseCartItem[];
}

export interface SupabaseCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  added_at: string;
  
  // Relations
  products?: SupabaseProduct;
  product_variants?: SupabaseProductVariant;
}

export interface SupabaseOrder {
  id: string;
  user_id?: string;
  order_number: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  billing_address?: any;
  shipping_address?: any;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_reference?: string;
  shipping_method?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  
  // Relations
  order_items?: SupabaseOrderItem[];
}

export interface SupabaseOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_title: string;
  product_type: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  download_url?: string;
  download_expires_at?: string;
  download_count: number;
  max_downloads: number;
  created_at: string;
}

export interface SupabaseUserLibrary {
  id: string;
  user_id: string;
  product_id: string;
  order_id?: string;
  purchased_at: string;
  download_url?: string;
  download_expires_at?: string;
  download_count: number;
  
  // Relations
  products?: SupabaseProduct;
  orders?: {
    order_number: string;
  };
}

// Type aliases for compatibility
export type Product = SupabaseProduct;
export type Cart = SupabaseCart;
export type CartItem = SupabaseCartItem;
export type Order = SupabaseOrder;
export type UserLibrary = SupabaseUserLibrary;

// Updated MarketplaceFilters for Supabase
export interface MarketplaceFilters {
  type?: ProductType;
  artist_id?: string;
  category_id?: string;
  price_min?: number;
  price_max?: number;
  on_sale?: boolean;
  search?: string;
  tags?: string[];
  sort_by?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'oldest';
  limit?: number;
  offset?: number;
}