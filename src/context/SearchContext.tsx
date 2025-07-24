import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  isSearchOpen: boolean;
  searchQuery: string;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <SearchContext.Provider value={{ 
      isSearchOpen, 
      searchQuery, 
      openSearch, 
      closeSearch, 
      setSearchQuery 
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}