import { supabase } from '../lib/supabase/client';

export interface NFTCollection {
  id: string;
  name: string;
  description?: string;
  artist_id: string;
  artist?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  contract_address: string;
  symbol: string;
  total_supply: number;
  floor_price: number;
  volume_traded: number;
  is_verified: boolean;
  metadata_uri?: string;
  created_at: string;
  updated_at: string;
}

export interface NFTListing {
  id: string;
  token_id: string;
  collection_id: string;
  collection?: NFTCollection;
  seller_id: string;
  seller?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  song_id?: string;
  song?: {
    id: string;
    title: string;
    artist_id: string;
    cover_url?: string;
    duration_ms: number;
  };
  price: number;
  currency: string;
  is_auction: boolean;
  auction_end_time?: string;
  highest_bid: number;
  highest_bidder_id?: string;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  metadata_uri?: string;
  rarity_rank?: number;
  traits: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NFTTransaction {
  id: string;
  listing_id: string;
  listing?: NFTListing;
  buyer_id?: string;
  buyer?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  seller_id?: string;
  seller?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  price: number;
  currency: string;
  transaction_hash?: string;
  gas_fee: number;
  marketplace_fee: number;
  royalty_fee: number;
  transaction_type: 'sale' | 'mint' | 'transfer';
  created_at: string;
}

export interface MarketplaceStats {
  id: string;
  date: string;
  total_volume: number;
  total_sales: number;
  unique_buyers: number;
  unique_sellers: number;
  average_price: number;
  floor_price: number;
  top_collection_id?: string;
  top_collection?: NFTCollection;
  created_at: string;
}

export interface MarketplaceFilters {
  collections?: string[];
  price_min?: number;
  price_max?: number;
  rarity_ranks?: number[];
  traits?: Record<string, string[]>;
  verified_only?: boolean;
  auction_only?: boolean;
  search?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'rarity_asc' | 'rarity_desc' | 'recent';
  limit?: number;
  offset?: number;
}

class MarketplaceService {
  // Collections
  async getCollections(options?: {
    artist_id?: string;
    verified_only?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    include_artist?: boolean;
  }) {
    let selectClause = '*';
    if (options?.include_artist) {
      selectClause += ', artists(id, name, avatar_url, is_verified)';
    }

    let query = supabase
      .from('nft_collections')
      .select(selectClause);

    if (options?.artist_id) {
      query = query.eq('artist_id', options.artist_id);
    }

    if (options?.verified_only) {
      query = query.eq('is_verified', true);
    }

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    query = query.order('volume_traded', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as NFTCollection[];
  }

  async getCollection(id: string) {
    const { data, error } = await supabase
      .from('nft_collections')
      .select('*, artists(id, name, avatar_url, is_verified)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as NFTCollection;
  }

  async getCollectionStats(collectionId: string) {
    // Get basic collection info
    const collection = await this.getCollection(collectionId);

    // Get listings count
    const { count: totalListings } = await supabase
      .from('nft_listings')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId)
      .eq('status', 'active');

    // Get recent transactions for volume calculation
    const { data: recentTransactions } = await supabase
      .from('nft_transactions')
      .select('price')
      .eq('collection_id', collectionId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24h

    const volume24h = recentTransactions?.reduce((sum, tx) => sum + tx.price, 0) || 0;

    // Get owners count (unique sellers/buyers)
    const { data: owners } = await supabase
      .from('nft_listings')
      .select('seller_id')
      .eq('collection_id', collectionId);

    const uniqueOwners = new Set(owners?.map(o => o.seller_id) || []).size;

    return {
      collection,
      totalSupply: collection.total_supply,
      totalListings: totalListings || 0,
      floorPrice: collection.floor_price,
      volume24h,
      volumeTotal: collection.volume_traded,
      uniqueOwners,
    };
  }

  // Listings
  async getListings(filters?: MarketplaceFilters) {
    let query = supabase
      .from('nft_listings')
      .select(`
        *,
        nft_collections(*,  artists(id, name, avatar_url, is_verified)),
        user_profiles:seller_id(id, username, display_name, avatar_url),
        songs(id, title, artist_id, cover_url, duration_ms)
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters?.collections && filters.collections.length > 0) {
      query = query.in('collection_id', filters.collections);
    }

    if (filters?.price_min !== undefined) {
      query = query.gte('price', filters.price_min);
    }

    if (filters?.price_max !== undefined) {
      query = query.lte('price', filters.price_max);
    }

    if (filters?.rarity_ranks && filters.rarity_ranks.length > 0) {
      query = query.in('rarity_rank', filters.rarity_ranks);
    }

    if (filters?.verified_only) {
      query = query.eq('nft_collections.is_verified', true);
    }

    if (filters?.auction_only) {
      query = query.eq('is_auction', true);
    }

    if (filters?.search) {
      query = query.or(`
        nft_collections.name.ilike.%${filters.search}%,
        songs.title.ilike.%${filters.search}%
      `);
    }

    // Traits filtering (simplified - would need more complex logic for production)
    if (filters?.traits) {
      for (const [traitType, values] of Object.entries(filters.traits)) {
        if (values.length > 0) {
          query = query.contains('traits', { [traitType]: values[0] });
        }
      }
    }

    // Sorting
    switch (filters?.sort_by) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rarity_asc':
        query = query.order('rarity_rank', { ascending: true, nullsLast: true });
        break;
      case 'rarity_desc':
        query = query.order('rarity_rank', { ascending: false, nullsLast: true });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
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
    return data as NFTListing[];
  }

  async getListing(id: string) {
    const { data, error } = await supabase
      .from('nft_listings')
      .select(`
        *,
        nft_collections(*, artists(id, name, avatar_url, is_verified)),
        user_profiles:seller_id(id, username, display_name, avatar_url),
        songs(id, title, artist_id, cover_url, duration_ms)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as NFTListing;
  }

  async createListing(data: {
    token_id: string;
    collection_id: string;
    song_id?: string;
    price: number;
    currency?: string;
    is_auction?: boolean;
    auction_end_time?: string;
    metadata_uri?: string;
    rarity_rank?: number;
    traits?: Record<string, any>;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: listing, error } = await supabase
      .from('nft_listings')
      .insert({
        ...data,
        seller_id: user.id,
        currency: data.currency || 'ETH',
        is_auction: data.is_auction || false,
        traits: data.traits || {},
      })
      .select()
      .single();

    if (error) throw error;
    return listing as NFTListing;
  }

  async updateListing(id: string, data: {
    price?: number;
    is_auction?: boolean;
    auction_end_time?: string;
    status?: NFTListing['status'];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: listing, error } = await supabase
      .from('nft_listings')
      .update(data)
      .eq('id', id)
      .eq('seller_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return listing as NFTListing;
  }

  async cancelListing(id: string) {
    return this.updateListing(id, { status: 'cancelled' });
  }

  // Bidding (for auctions)
  async placeBid(listingId: string, bidAmount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current listing
    const listing = await this.getListing(listingId);

    if (!listing.is_auction) {
      throw new Error('This is not an auction listing');
    }

    if (listing.status !== 'active') {
      throw new Error('Auction is not active');
    }

    if (listing.auction_end_time && new Date(listing.auction_end_time) < new Date()) {
      throw new Error('Auction has ended');
    }

    if (bidAmount <= listing.highest_bid) {
      throw new Error('Bid must be higher than current highest bid');
    }

    // Update listing with new highest bid
    const { data, error } = await supabase
      .from('nft_listings')
      .update({
        highest_bid: bidAmount,
        highest_bidder_id: user.id,
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data as NFTListing;
  }

  // Purchasing
  async purchaseNFT(listingId: string, paymentDetails?: {
    transaction_hash?: string;
    gas_fee?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const listing = await this.getListing(listingId);

    if (listing.status !== 'active') {
      throw new Error('Listing is not active');
    }

    if (listing.seller_id === user.id) {
      throw new Error('Cannot purchase your own listing');
    }

    // Calculate fees (simplified)
    const marketplaceFeeRate = 0.025; // 2.5%
    const royaltyFeeRate = 0.1; // 10% (could be dynamic based on collection)
    
    const marketplaceFee = listing.price * marketplaceFeeRate;
    const royaltyFee = listing.price * royaltyFeeRate;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('nft_transactions')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        price: listing.price,
        currency: listing.currency,
        transaction_hash: paymentDetails?.transaction_hash,
        gas_fee: paymentDetails?.gas_fee || 0,
        marketplace_fee: marketplaceFee,
        royalty_fee: royaltyFee,
        transaction_type: 'sale',
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update listing status
    await supabase
      .from('nft_listings')
      .update({ status: 'sold' })
      .eq('id', listingId);

    // Update collection volume
    await supabase.rpc('increment_collection_volume', {
      collection_id: listing.collection_id,
      amount: listing.price,
    });

    return transaction as NFTTransaction;
  }

  // Transactions
  async getTransactions(options?: {
    user_id?: string;
    collection_id?: string;
    transaction_type?: NFTTransaction['transaction_type'];
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('nft_transactions')
      .select(`
        *,
        nft_listings(*, nft_collections(*, artists(name))),
        buyer:user_profiles!buyer_id(id, username, display_name, avatar_url),
        seller:user_profiles!seller_id(id, username, display_name, avatar_url)
      `);

    if (options?.user_id) {
      query = query.or(`buyer_id.eq.${options.user_id},seller_id.eq.${options.user_id}`);
    }

    if (options?.collection_id) {
      query = query.eq('nft_listings.collection_id', options.collection_id);
    }

    if (options?.transaction_type) {
      query = query.eq('transaction_type', options.transaction_type);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as NFTTransaction[];
  }

  async getUserTransactions(type?: 'bought' | 'sold') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('nft_transactions')
      .select(`
        *,
        nft_listings(*, nft_collections(*, artists(name))),
        buyer:user_profiles!buyer_id(id, username, display_name, avatar_url),
        seller:user_profiles!seller_id(id, username, display_name, avatar_url)
      `);

    if (type === 'bought') {
      query = query.eq('buyer_id', user.id);
    } else if (type === 'sold') {
      query = query.eq('seller_id', user.id);
    } else {
      query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data as NFTTransaction[];
  }

  // Statistics
  async getMarketplaceStats(period?: 'day' | 'week' | 'month' | 'all') {
    let dateFilter = '';
    const now = new Date();

    switch (period) {
      case 'day':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        dateFilter = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString().split('T')[0];
        break;
    }

    let query = supabase
      .from('marketplace_stats')
      .select('*, nft_collections:top_collection_id(*)');

    if (dateFilter) {
      query = query.gte('date', dateFilter);
    }

    query = query.order('date', { ascending: false });

    if (period && period !== 'all') {
      query = query.limit(period === 'day' ? 1 : period === 'week' ? 7 : 30);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate data if multiple days
    if (data && data.length > 1) {
      const aggregated = data.reduce((acc, stat) => ({
        total_volume: acc.total_volume + stat.total_volume,
        total_sales: acc.total_sales + stat.total_sales,
        unique_buyers: acc.unique_buyers + stat.unique_buyers, // This is not accurate for aggregation
        unique_sellers: acc.unique_sellers + stat.unique_sellers, // This is not accurate for aggregation
        average_price: (acc.total_volume + stat.total_volume) / (acc.total_sales + stat.total_sales),
        floor_price: Math.min(acc.floor_price, stat.floor_price),
      }), {
        total_volume: 0,
        total_sales: 0,
        unique_buyers: 0,
        unique_sellers: 0,
        average_price: 0,
        floor_price: Infinity,
      });

      return aggregated;
    }

    return data?.[0] as MarketplaceStats;
  }

  async getTrendingCollections(limit = 10) {
    const { data, error } = await supabase
      .from('nft_collections')
      .select('*, artists(id, name, avatar_url, is_verified)')
      .order('volume_traded', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as NFTCollection[];
  }

  // User-specific data
  async getUserListings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('nft_listings')
      .select(`
        *,
        nft_collections(*, artists(name)),
        songs(id, title, cover_url)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as NFTListing[];
  }

  async getUserWatchlist() {
    // This would require a separate watchlist table
    // For now, return empty array
    return [];
  }

  // Search
  async searchMarketplace(query: string, filters?: Partial<MarketplaceFilters>) {
    return this.getListings({
      ...filters,
      search: query,
    });
  }
}

export const marketplaceService = new MarketplaceService();