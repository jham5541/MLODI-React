import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  marketplaceService, 
  NFTCollection, 
  NFTListing, 
  NFTTransaction, 
  MarketplaceStats, 
  MarketplaceFilters 
} from '../services/marketplaceService';
import { realtimeService } from '../services/realtimeService';

interface MarketplaceState {
  // Collections
  collections: NFTCollection[];
  trendingCollections: NFTCollection[];
  
  // Listings
  listings: NFTListing[];
  featuredListings: NFTListing[];
  userListings: NFTListing[];
  
  // Transactions
  recentTransactions: NFTTransaction[];
  userTransactions: NFTTransaction[];
  
  // Stats
  marketplaceStats: MarketplaceStats | null;
  collectionStats: Record<string, any>; // collectionId -> stats
  
  // Filters and search
  currentFilters: MarketplaceFilters;
  searchQuery: string;
  searchResults: NFTListing[];
  
  // Current selection
  selectedCollection: NFTCollection | null;
  selectedListing: NFTListing | null;
  
  // Loading states
  isLoadingCollections: boolean;
  isLoadingListings: boolean;
  isLoadingTransactions: boolean;
  isLoadingStats: boolean;
  isSearching: boolean;
  isCreatingListing: boolean;
  isPurchasing: boolean;
  
  // Pagination
  listingsPage: number;
  hasMoreListings: boolean;
  
  // Real-time features
  liveUpdates: any[];
  realtimeSubscriptions: any[];
  
  // Actions
  // Collections
  loadCollections: (options?: { artist_id?: string; verified_only?: boolean }) => Promise<void>;
  loadTrendingCollections: () => Promise<void>;
  loadCollection: (id: string) => Promise<void>;
  loadCollectionStats: (collectionId: string) => Promise<void>;
  
  // Listings
  loadListings: (filters?: MarketplaceFilters, resetPage?: boolean) => Promise<void>;
  loadMoreListings: () => Promise<void>;
  loadFeaturedListings: () => Promise<void>;
  loadUserListings: () => Promise<void>;
  loadListing: (id: string) => Promise<void>;
  createListing: (data: any) => Promise<NFTListing>;
  updateListing: (id: string, data: any) => Promise<void>;
  cancelListing: (id: string) => Promise<void>;
  
  // Transactions
  loadRecentTransactions: () => Promise<void>;
  loadUserTransactions: (type?: 'bought' | 'sold') => Promise<void>;
  purchaseNFT: (listingId: string, paymentDetails?: any) => Promise<NFTTransaction>;
  placeBid: (listingId: string, amount: number) => Promise<void>;
  
  // Stats
  loadMarketplaceStats: (period?: 'day' | 'week' | 'month' | 'all') => Promise<void>;
  
  // Filters and search
  updateFilters: (filters: Partial<MarketplaceFilters>) => void;
  clearFilters: () => void;
  searchMarketplace: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // Selection
  selectCollection: (collection: NFTCollection | null) => void;
  selectListing: (listing: NFTListing | null) => void;
  
  // Utility
  getCollectionById: (id: string) => NFTCollection | null;
  getListingById: (id: string) => NFTListing | null;
  isListingOwner: (listing: NFTListing) => boolean;
  
  // Real-time subscriptions
  subscribeToMarketplace: () => void;
  unsubscribeFromMarketplace: () => void;
}

const DEFAULT_FILTERS: MarketplaceFilters = {
  sort_by: 'recent',
  limit: 20,
  offset: 0,
};

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      collections: [],
      trendingCollections: [],
      listings: [],
      featuredListings: [],
      userListings: [],
      recentTransactions: [],
      userTransactions: [],
      marketplaceStats: null,
      collectionStats: {},
      
      currentFilters: DEFAULT_FILTERS,
      searchQuery: '',
      searchResults: [],
      
      selectedCollection: null,
      selectedListing: null,
      
      isLoadingCollections: false,
      isLoadingListings: false,
      isLoadingTransactions: false,
      isLoadingStats: false,
      isSearching: false,
      isCreatingListing: false,
      isPurchasing: false,
      
      listingsPage: 0,
      hasMoreListings: true,
      
      // Real-time state
      liveUpdates: [],
      realtimeSubscriptions: [],
      
      // Collection actions
      loadCollections: async (options) => {
        set({ isLoadingCollections: true });
        try {
          const collections = await marketplaceService.getCollections({
            ...options,
            include_artist: true,
            limit: 20,
          });
          set({ collections });
        } catch (error) {
          console.error('Failed to load collections:', error);
        } finally {
          set({ isLoadingCollections: false });
        }
      },
      
      loadTrendingCollections: async () => {
        try {
          const collections = await marketplaceService.getTrendingCollections(10);
          set({ trendingCollections: collections });
        } catch (error) {
          console.error('Failed to load trending collections:', error);
        }
      },
      
      loadCollection: async (id: string) => {
        try {
          const collection = await marketplaceService.getCollection(id);
          set({ selectedCollection: collection });
          
          // Load collection stats
          await get().loadCollectionStats(id);
        } catch (error) {
          console.error('Failed to load collection:', error);
          throw error;
        }
      },
      
      loadCollectionStats: async (collectionId: string) => {
        try {
          const stats = await marketplaceService.getCollectionStats(collectionId);
          set(state => ({
            collectionStats: {
              ...state.collectionStats,
              [collectionId]: stats,
            },
          }));
        } catch (error) {
          console.error('Failed to load collection stats:', error);
        }
      },
      
      // Listing actions
      loadListings: async (filters, resetPage = true) => {
        if (resetPage) {
          set({ listingsPage: 0, listings: [] });
        }
        
        set({ isLoadingListings: true });
        try {
          const finalFilters = {
            ...get().currentFilters,
            ...filters,
            offset: resetPage ? 0 : get().listingsPage * (filters?.limit || DEFAULT_FILTERS.limit!),
          };
          
          const listings = await marketplaceService.getListings(finalFilters);
          
          set(state => ({
            listings: resetPage ? listings : [...state.listings, ...listings],
            currentFilters: finalFilters,
            hasMoreListings: listings.length === (finalFilters.limit || DEFAULT_FILTERS.limit),
          }));
        } catch (error) {
          console.error('Failed to load listings:', error);
        } finally {
          set({ isLoadingListings: false });
        }
      },
      
      loadMoreListings: async () => {
        if (!get().hasMoreListings || get().isLoadingListings) return;
        
        const nextPage = get().listingsPage + 1;
        set({ listingsPage: nextPage });
        
        await get().loadListings(get().currentFilters, false);
      },
      
      loadFeaturedListings: async () => {
        try {
          const listings = await marketplaceService.getListings({
            verified_only: true,
            sort_by: 'price_desc',
            limit: 10,
          });
          set({ featuredListings: listings });
        } catch (error) {
          console.error('Failed to load featured listings:', error);
        }
      },
      
      loadUserListings: async () => {
        try {
          const listings = await marketplaceService.getUserListings();
          set({ userListings: listings });
        } catch (error) {
          console.error('Failed to load user listings:', error);
        }
      },
      
      loadListing: async (id: string) => {
        try {
          const listing = await marketplaceService.getListing(id);
          set({ selectedListing: listing });
        } catch (error) {
          console.error('Failed to load listing:', error);
          throw error;
        }
      },
      
      createListing: async (data) => {
        set({ isCreatingListing: true });
        try {
          const listing = await marketplaceService.createListing(data);
          
          // Add to user listings
          set(state => ({
            userListings: [listing, ...state.userListings],
          }));
          
          return listing;
        } catch (error) {
          console.error('Failed to create listing:', error);
          throw error;
        } finally {
          set({ isCreatingListing: false });
        }
      },
      
      updateListing: async (id: string, data) => {
        try {
          const updatedListing = await marketplaceService.updateListing(id, data);
          
          // Update in relevant arrays
          const updateInArray = (listings: NFTListing[]) =>
            listings.map(l => l.id === id ? updatedListing : l);
          
          set(state => ({
            listings: updateInArray(state.listings),
            userListings: updateInArray(state.userListings),
            featuredListings: updateInArray(state.featuredListings),
            selectedListing: state.selectedListing?.id === id ? updatedListing : state.selectedListing,
          }));
        } catch (error) {
          console.error('Failed to update listing:', error);
          throw error;
        }
      },
      
      cancelListing: async (id: string) => {
        try {
          await marketplaceService.cancelListing(id);
          
          // Remove from active listings or update status
          const removeFromArray = (listings: NFTListing[]) =>
            listings.filter(l => l.id !== id);
          
          set(state => ({
            listings: removeFromArray(state.listings),
            featuredListings: removeFromArray(state.featuredListings),
            userListings: state.userListings.map(l => 
              l.id === id ? { ...l, status: 'cancelled' as const } : l
            ),
          }));
        } catch (error) {
          console.error('Failed to cancel listing:', error);
          throw error;
        }
      },
      
      // Transaction actions
      loadRecentTransactions: async () => {
        set({ isLoadingTransactions: true });
        try {
          const transactions = await marketplaceService.getTransactions({
            limit: 20,
          });
          set({ recentTransactions: transactions });
        } catch (error) {
          console.error('Failed to load recent transactions:', error);
        } finally {
          set({ isLoadingTransactions: false });
        }
      },
      
      loadUserTransactions: async (type) => {
        try {
          const transactions = await marketplaceService.getUserTransactions(type);
          set({ userTransactions: transactions });
        } catch (error) {
          console.error('Failed to load user transactions:', error);
        }
      },
      
      purchaseNFT: async (listingId: string, paymentDetails) => {
        set({ isPurchasing: true });
        try {
          const transaction = await marketplaceService.purchaseNFT(listingId, paymentDetails);
          
          // Remove listing from active listings
          const removeFromArray = (listings: NFTListing[]) =>
            listings.filter(l => l.id !== listingId);
          
          set(state => ({
            listings: removeFromArray(state.listings),
            featuredListings: removeFromArray(state.featuredListings),
            recentTransactions: [transaction, ...state.recentTransactions],
            userTransactions: [transaction, ...state.userTransactions],
          }));
          
          return transaction;
        } catch (error) {
          console.error('Failed to purchase NFT:', error);
          throw error;
        } finally {
          set({ isPurchasing: false });
        }
      },
      
      placeBid: async (listingId: string, amount: number) => {
        try {
          const updatedListing = await marketplaceService.placeBid(listingId, amount);
          
          // Update listing in arrays
          const updateInArray = (listings: NFTListing[]) =>
            listings.map(l => l.id === listingId ? updatedListing : l);
          
          set(state => ({
            listings: updateInArray(state.listings),
            featuredListings: updateInArray(state.featuredListings),
            selectedListing: state.selectedListing?.id === listingId ? updatedListing : state.selectedListing,
          }));
        } catch (error) {
          console.error('Failed to place bid:', error);
          throw error;
        }
      },
      
      // Stats actions
      loadMarketplaceStats: async (period) => {
        set({ isLoadingStats: true });
        try {
          const stats = await marketplaceService.getMarketplaceStats(period);
          set({ marketplaceStats: stats });
        } catch (error) {
          console.error('Failed to load marketplace stats:', error);
        } finally {
          set({ isLoadingStats: false });
        }
      },
      
      // Filter and search actions
      updateFilters: (filters: Partial<MarketplaceFilters>) => {
        const newFilters = {
          ...get().currentFilters,
          ...filters,
          offset: 0, // Reset offset when filters change
        };
        
        set({ currentFilters: newFilters });
        get().loadListings(newFilters, true);
      },
      
      clearFilters: () => {
        set({ currentFilters: DEFAULT_FILTERS });
        get().loadListings(DEFAULT_FILTERS, true);
      },
      
      searchMarketplace: async (query: string) => {
        if (!query.trim()) {
          get().clearSearch();
          return;
        }
        
        set({ isSearching: true, searchQuery: query });
        try {
          const results = await marketplaceService.searchMarketplace(query, {
            limit: 20,
          });
          set({ searchResults: results });
        } catch (error) {
          console.error('Failed to search marketplace:', error);
        } finally {
          set({ isSearching: false });
        }
      },
      
      clearSearch: () => {
        set({
          searchQuery: '',
          searchResults: [],
          isSearching: false,
        });
      },
      
      // Selection actions
      selectCollection: (collection: NFTCollection | null) => {
        set({ selectedCollection: collection });
      },
      
      selectListing: (listing: NFTListing | null) => {
        set({ selectedListing: listing });
      },
      
      // Utility actions
      getCollectionById: (id: string) => {
        const { collections, trendingCollections } = get();
        return [...collections, ...trendingCollections].find(c => c.id === id) || null;
      },
      
      getListingById: (id: string) => {
        const { listings, featuredListings, userListings, searchResults } = get();
        return [...listings, ...featuredListings, ...userListings, ...searchResults]
          .find(l => l.id === id) || null;
      },
      
      isListingOwner: (listing: NFTListing) => {
        // This would need to check against current user ID from auth store
        // For now, return false - would need to integrate with auth
        return false;
      },
      
      // Real-time subscription methods
      subscribeToMarketplace: () => {
        const subscription = realtimeService.subscribeToMarketplace((update) => {
          set(state => ({
            liveUpdates: [update, ...state.liveUpdates.slice(0, 49)], // Keep last 50 updates
          }));
          
          // Handle different update types
          if (update.type === 'new_listing') {
            // Optionally refresh listings to include the new one
            console.log('New listing available:', update.listing);
          } else if (update.type === 'sale') {
            // Remove sold listing from current listings
            set(state => ({
              listings: state.listings.filter(l => l.id !== update.listing_id),
              featuredListings: state.featuredListings.filter(l => l.id !== update.listing_id),
            }));
          }
        });
        
        set(state => ({
          realtimeSubscriptions: [...state.realtimeSubscriptions, subscription],
        }));
      },
      
      unsubscribeFromMarketplace: () => {
        const { realtimeSubscriptions } = get();
        realtimeSubscriptions.forEach(sub => {
          if (sub && sub.unsubscribe) {
            sub.unsubscribe();
          }
        });
        
        set({
          realtimeSubscriptions: [],
          liveUpdates: [],
        });
      },
    }),
    {
      name: 'marketplace-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain data
      partialize: (state) => ({
        collections: state.collections,
        trendingCollections: state.trendingCollections,
        currentFilters: state.currentFilters,
        userTransactions: state.userTransactions,
      }),
    }
  )
);