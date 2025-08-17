// useClassifiedsSearch Hook
// Manages search functionality for Player Classifieds

import { useState, useCallback, useRef } from 'react';
import { IUseClassifiedsSearchReturn, IClassifiedsSearchState } from '../types/playerClassifieds';

interface UseClassifiedsSearchProps {
  onSearch: (term: string) => void;
  debounceMs?: number;
}

export const useClassifiedsSearch = ({
  onSearch,
  debounceMs = 300,
}: UseClassifiedsSearchProps): IUseClassifiedsSearchReturn => {
  // Search state
  const [searchState, setSearchState] = useState<IClassifiedsSearchState>({
    searchTerm: '',
    isSearching: false,
    hasSearchResults: false,
    searchHistory: [],
  });

  // Debounce timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add term to search history
  const addToSearchHistory = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;

    setSearchState((prev) => {
      // Remove existing occurrence if present
      const filtered = prev.searchHistory.filter((item) => item !== trimmedTerm);
      // Add to beginning
      const newHistory = [trimmedTerm, ...filtered];
      // Keep only last 10 searches
      return {
        ...prev,
        searchHistory: newHistory.slice(0, 10),
      };
    });
  }, []);

  // Handle search submission
  const handleSearchSubmit = useCallback(
    (term?: string) => {
      const searchTermToUse = term || searchState.searchTerm;

      if (!searchTermToUse.trim()) {
        return;
      }

      setSearchState((prev) => ({
        ...prev,
        isSearching: true,
        hasSearchResults: false,
      }));

      // Add to search history if not already present
      addToSearchHistory(searchTermToUse);

      // Call the onSearch callback if provided
      if (onSearch) {
        onSearch(searchTermToUse);
      }

      // Simulate search completion (remove this when integrating with actual search)
      setTimeout(() => {
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          hasSearchResults: true,
        }));
      }, 500);
    },
    [searchState.searchTerm, onSearch, addToSearchHistory],
  );

  // Handle search input with debouncing
  const handleSearchInput = useCallback(
    (term: string) => {
      setSearchState((prev) => ({
        ...prev,
        searchTerm: term,
      }));

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced search
      debounceTimeoutRef.current = setTimeout(() => {
        if (term.trim()) {
          // Direct call to avoid circular dependency
          if (term.trim() && onSearch) {
            onSearch(term);
          }
        }
      }, debounceMs);
    },
    [debounceMs, onSearch],
  );

  // Handle clearing search
  const handleClearSearch = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      searchTerm: '',
      hasSearchResults: false,
    }));

    // Clear the debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Call onSearch with empty term to clear results
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  // Handle selecting from search history
  const handleSearchHistorySelect = useCallback(
    (term: string) => {
      setSearchState((prev) => ({
        ...prev,
        searchTerm: term,
      }));
      handleSearchSubmit(term);
    },
    [handleSearchSubmit],
  );

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      searchHistory: [],
    }));
  }, []);

  return {
    searchState,
    handleSearchInput,
    handleSearchSubmit,
    handleClearSearch,
    handleSearchHistorySelect,
    clearSearchHistory,
  };
};
