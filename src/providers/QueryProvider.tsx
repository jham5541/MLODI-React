import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

// Create a client with optimized settings for React Native
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache time (how long data stays in cache when not being used)
      cacheTime: 1000 * 60 * 30, // 30 minutes
      
      // Stale time (how long data is considered fresh)
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry for 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus (not applicable for mobile but good to be explicit)
      refetchOnWindowFocus: false,
      
      // Refetch on network reconnect
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 2000,
    },
  },
});

// Create async storage persister
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000, // Throttle writes to AsyncStorage
});

// Configure persistence
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  hydrateOptions: {
    // Only restore data that's less than 1 hour old
    deserializeData: (data) => {
      const now = Date.now();
      const maxAge = 1000 * 60 * 60; // 1 hour
      
      if (data.dataUpdatedAt && now - data.dataUpdatedAt > maxAge) {
        // Data is too old, don't restore it
        return undefined;
      }
      
      return data;
    },
  },
  dehydrateOptions: {
    // Only persist certain query types
    shouldDehydrateQuery: (query) => {
      const queryKey = query.queryKey[0] as string;
      
      // Don't persist real-time data or user-specific sensitive data
      const excludeKeys = ['notifications', 'live-listeners', 'marketplace-live'];
      
      return !excludeKeys.some(key => queryKey.includes(key));
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Export query client for direct access when needed
export { queryClient };

// Development tools (only in development)
if (__DEV__) {
  import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
    // You can add devtools here if needed for debugging
    // Note: React Query devtools are primarily for web, limited support in React Native
  });
}

// Query client utilities
export const queryUtils = {
  // Clear all cached data
  clearCache: () => {
    queryClient.clear();
  },
  
  // Invalidate all queries
  invalidateAll: () => {
    queryClient.invalidateQueries();
  },
  
  // Remove specific queries
  removeQueries: (filters: any) => {
    queryClient.removeQueries(filters);
  },
  
  // Prefetch data
  prefetchQuery: (options: any) => {
    return queryClient.prefetchQuery(options);
  },
  
  // Set query data manually
  setQueryData: (queryKey: any, data: any) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached data
  getQueryData: (queryKey: any) => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Get cache stats for debugging
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      freshQueries: queries.filter(q => q.isStale() === false).length,
      staleQueries: queries.filter(q => q.isStale() === true).length,
      loadingQueries: queries.filter(q => q.isFetching()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
    };
  },
  
  // Force garbage collection (cleanup unused cache)
  cleanup: () => {
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  },
};

// Hook to access query utils
export const useQueryUtils = () => queryUtils;

// Network status aware query options
export const getNetworkAwareOptions = (isConnected: boolean) => ({
  enabled: isConnected,
  refetchOnReconnect: isConnected,
  retry: isConnected ? 3 : 0,
  cacheTime: isConnected ? 1000 * 60 * 30 : 1000 * 60 * 60 * 24, // Cache longer when offline
});

// Background task to cleanup old cache data
export const setupCacheCleanup = () => {
  // Run cleanup every hour
  const cleanupInterval = setInterval(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    // Remove queries that haven't been used in the last 2 hours
    const twoHoursAgo = Date.now() - 1000 * 60 * 60 * 2;
    
    queries.forEach(query => {
      if (query.state.dataUpdatedAt < twoHoursAgo && !query.hasObservers()) {
        cache.remove(query);
      }
    });
  }, 1000 * 60 * 60); // Every hour
  
  // Return cleanup function
  return () => {
    clearInterval(cleanupInterval);
  };
};