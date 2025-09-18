'use client';

import { useState, useCallback, useMemo } from 'react';
import { RecipientContact } from '../../../../types/emails/recipients';
import { hasValidEmail } from '../../common/mailtoUtils';

export interface SearchFilters {
  query: string;
  teamIds: string[];
  roleIds: string[];
  hasEmail: boolean;
}

export interface UseRecipientSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export interface UseRecipientSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: SearchFilters;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  filteredContacts: RecipientContact[];
  searchStats: {
    total: number;
    filtered: number;
    selected: number;
  };
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  teamIds: [],
  roleIds: [],
  hasEmail: true,
};

export const useRecipientSearch = (
  contacts: RecipientContact[],
  options: UseRecipientSearchOptions = {},
): UseRecipientSearchReturn => {
  const { minQueryLength = 2 } = options;

  const [searchQuery, setSearchQueryState] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // Debounced search query setter
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setFilters((prev) => ({ ...prev, query: query.trim() }));
  }, []);

  // Update individual filter
  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Filter contacts based on search criteria
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];

    // Filter by email requirement
    if (filters.hasEmail) {
      filtered = filtered.filter((contact) => hasValidEmail(contact));
    }

    // Filter by search query
    if (filters.query && filters.query.length >= minQueryLength) {
      const queryLower = filters.query.toLowerCase();
      filtered = filtered.filter((contact) => {
        const searchableText = [
          contact.displayName,
          contact.email,
          contact.firstName,
          contact.lastName,
          // Note: roles and teams properties may not exist on all contacts
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(queryLower);
      });
    }

    // Filter by team IDs (not implemented - contacts don't have teams property)
    if (filters.teamIds.length > 0) {
      // This would be implemented when team associations are added to contacts
      // filtered = filtered.filter(contact => /* team filtering logic */);
    }

    // Filter by role IDs (not implemented - contacts don't have roles property)
    if (filters.roleIds.length > 0) {
      // This would be implemented when role associations are added to contacts
      // filtered = filtered.filter(contact => /* role filtering logic */);
    }

    // Sort by display name
    filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return filtered;
  }, [contacts, filters, minQueryLength]);

  // Calculate search statistics
  const searchStats = useMemo(() => {
    return {
      total: contacts.length,
      filtered: filteredContacts.length,
      selected: 0, // This will be overridden by the calling component
    };
  }, [contacts.length, filteredContacts.length]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    filteredContacts,
    searchStats,
  };
};
