/**
 * Shared Contact Search Hook
 *
 * This hook provides reusable contact search functionality that can be used
 * by both user management and email recipient selection components.
 * It implements server-side search with debouncing to optimize API calls.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserManagementService } from '../services/userManagementService';
import { createEmailRecipientService } from '../services/emailRecipientService';
import type { RecipientContact } from '../types/emails/recipients';
import { ContactType } from '@draco/shared-schemas';

// Search modes determine which service to use
export type SearchMode = 'users' | 'recipients';

export interface ContactSearchOptions {
  seasonId?: string | null;
  onlyWithRoles?: boolean;
  roles?: boolean;
  contactDetails?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactSearchState {
  results: ContactType[] | RecipientContact[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export interface UseContactSearchReturn {
  searchState: ContactSearchState;
  searchContacts: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_DELAY = 400;

/**
 * Custom hook for contact search functionality
 *
 * @param accountId - The account ID to search within
 * @param mode - Search mode: 'users' for user management, 'recipients' for email composition
 * @param options - Additional search options
 * @param debounceDelay - Debounce delay in milliseconds (default: 400ms)
 */
export function useContactSearch(
  accountId: string,
  mode: SearchMode = 'users',
  options: ContactSearchOptions = {},
  debounceDelay: number = DEFAULT_DEBOUNCE_DELAY,
): UseContactSearchReturn {
  const { token } = useAuth();

  // Search state
  const [searchState, setSearchState] = useState<ContactSearchState>({
    results: [],
    loading: false,
    error: null,
    hasSearched: false,
  });

  // Refs for cleanup and debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentRequestRef = useRef<AbortController | undefined>(undefined);

  // Service instances
  const userService = token ? createUserManagementService(token) : null;
  const emailRecipientService = createEmailRecipientService();

  /**
   * Clear any pending searches and requests
   */
  const cleanup = useCallback(() => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = undefined;
    }

    // Abort current request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = undefined;
    }
  }, []);

  /**
   * Execute search based on mode
   */
  const executeSearch = useCallback(
    async (query: string): Promise<void> => {
      if (!accountId || !token) {
        setSearchState((prev) => ({
          ...prev,
          error: 'Missing account ID or authentication token',
          loading: false,
        }));
        return;
      }

      if (!query.trim()) {
        // Clear results for empty query
        setSearchState((prev) => ({
          ...prev,
          results: [],
          loading: false,
          error: null,
          hasSearched: false,
        }));
        return;
      }

      try {
        // Create abort controller for this request
        currentRequestRef.current = new AbortController();

        setSearchState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        if (mode === 'users') {
          // Use user management service for user search
          if (!userService) {
            throw new Error('User service not available');
          }

          const searchResponse = await userService.searchUsers(
            accountId,
            query,
            options.seasonId,
            options.onlyWithRoles,
            {
              page: 0, // Frontend uses 0-based pagination
              limit: options.limit || 50,
              sortBy: options.sortBy || 'lastname',
              sortOrder: options.sortOrder || 'asc',
            },
          );

          setSearchState((prev) => ({
            ...prev,
            results: searchResponse.users,
            loading: false,
            hasSearched: true,
          }));
        } else if (mode === 'recipients') {
          // Use email recipient service for recipient search
          const searchResult = await emailRecipientService.searchContacts(accountId, token, query, {
            seasonId: options.seasonId || undefined,
            roles: options.roles !== false, // Default to true
            limit: options.limit || 50,
            page: (options.offset || 0) / (options.limit || 25) + 1,
          });

          if (!searchResult.success) {
            throw new Error(searchResult.error.message);
          }

          // Transform backend contacts to recipient contacts
          const transformedContacts: RecipientContact[] = searchResult.data.contacts.map(
            (contact) => ({
              ...contact,
              displayName: contact.firstName + ' ' + contact.lastName,
              hasValidEmail: !!contact.email,
            }),
          );

          setSearchState((prev) => ({
            ...prev,
            results: transformedContacts,
            loading: false,
            hasSearched: true,
          }));
        }
      } catch (error: unknown) {
        // Don't update state if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('Contact search failed:', error);
        setSearchState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Search failed',
          loading: false,
          hasSearched: true,
        }));
      }
    },
    [accountId, token, mode, options, userService, emailRecipientService],
  );

  /**
   * Debounced search function
   */
  const searchContacts = useCallback(
    (query: string) => {
      // Clear previous debounce timer and requests
      cleanup();

      // Return immediately if no query change
      if (query.trim() === '' && !searchState.hasSearched) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          try {
            await executeSearch(query);
            resolve();
          } catch {
            // Error is already handled in executeSearch
            resolve();
          }
        }, debounceDelay);
      });
    },
    [cleanup, executeSearch, debounceDelay, searchState.hasSearched],
  );

  /**
   * Clear search results and state
   */
  const clearSearch = useCallback(() => {
    cleanup();
    setSearchState({
      results: [],
      loading: false,
      error: null,
      hasSearched: false,
    });
  }, [cleanup]);

  /**
   * Clear error state only
   */
  const clearError = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    searchState,
    searchContacts,
    clearSearch,
    clearError,
  };
}
