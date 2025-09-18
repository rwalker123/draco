'use client';

/**
 * Email Recipient Data Fetching Hooks
 * Enhanced with comprehensive error handling and type safety
 *
 * This module provides React hooks for fetching and managing email recipient data
 * with improved error handling, retry logic, and user-friendly error messages.
 *
 * Example usage:
 * ```typescript
 * // In a compose page or dialog
 * const { contacts, teamGroups, roleGroups, isLoading, error } = useEmailRecipients(accountId, seasonId);
 * const { searchQuery, setSearchQuery, filteredContacts } = useContactSearch(contacts);
 * const { currentSeason } = useCurrentSeason(accountId);
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmailRecipientService, Season } from '../services/emailRecipientService';
import { RecipientContact } from '../types/emails/recipients';
import { EmailRecipientError, EmailRecipientErrorCode } from '../types/errors';
import { normalizeError, logError, createEmailRecipientError, safe } from '../utils/errorHandling';

// ============================
// useEmailRecipients Hook
// ============================

export interface UseEmailRecipientsReturn {
  // Data
  contacts: RecipientContact[];
  // Pagination
  hasMoreContacts: boolean;

  // State
  isLoading: boolean;
  error: EmailRecipientError | null;
  isRetrying: boolean;
  retryCount: number;

  // Actions
  refresh: () => Promise<void>;
  searchContacts: (query: string) => Promise<RecipientContact[]>;
  clearError: () => void;

  // Recovery information
  canRetry: boolean;
  recoveryActions: string[];
}

/**
 * Enhanced hook for fetching and managing email recipient data
 * Provides contacts, team groups, and role groups for email composition
 * with comprehensive error handling and retry logic
 *
 * @param accountId - Account ID for fetching recipients
 * @param seasonId - Optional season ID for season-specific data
 * @returns Object with recipient data, loading state, error handling, and actions
 */
export function useEmailRecipients(accountId: string, seasonId?: string): UseEmailRecipientsReturn {
  const { token } = useAuth();

  // State management
  const [contacts, setContacts] = useState<RecipientContact[]>([]);
  const [hasMoreContacts, setHasMoreContacts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<EmailRecipientError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Service instance with error handling configuration
  const service = useMemo(() => {
    if (!token) return null;
    return new EmailRecipientService({
      enableRetries: true,
      maxRetries: 3,
      timeoutMs: 30000,
    });
  }, [token]);

  // Validation
  const isValidAccountId = useMemo(() => {
    return accountId && accountId.trim() !== '';
  }, [accountId]);

  /**
   * Enhanced fetch function with comprehensive error handling
   */
  const fetchRecipients = useCallback(async (): Promise<void> => {
    if (!service || !isValidAccountId) {
      if (!isValidAccountId) {
        setError(
          createEmailRecipientError(
            EmailRecipientErrorCode.INVALID_DATA,
            'Account ID is required',
            { context: { operation: 'useEmailRecipients.fetchRecipients' } },
          ),
        );
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the service's comprehensive method
      const result = await service.getRecipientData(accountId, token, seasonId);

      if (result.success) {
        // Update state with successful data
        setContacts(result.data.contacts);
        setHasMoreContacts(result.data.pagination?.hasNext ?? false);

        // Reset retry count on success
        setRetryCount(0);
      } else {
        // Handle service-level errors
        const normalizedError = result.error;
        setError(normalizedError);
        logError(normalizedError, 'useEmailRecipients.fetchRecipients');

        // Keep existing data on non-critical errors
        if (normalizedError.recoverable && contacts.length > 0) {
          console.warn('Using cached data due to recoverable error:', normalizedError.userMessage);
        }
      }
    } catch (err) {
      // Handle unexpected errors
      const normalizedError = normalizeError(err, {
        operation: 'useEmailRecipients.fetchRecipients',
        accountId,
        seasonId,
      });

      setError(normalizedError);
      logError(normalizedError, 'useEmailRecipients.fetchRecipients - unexpected error');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [service, isValidAccountId, accountId, token, seasonId, contacts.length]);

  /**
   * Enhanced search function with error handling
   */
  const searchContacts = useCallback(
    async (query: string): Promise<RecipientContact[]> => {
      if (!service || !isValidAccountId) {
        throw createEmailRecipientError(
          EmailRecipientErrorCode.INVALID_DATA,
          'Service not available or invalid account ID',
          { context: { operation: 'useEmailRecipients.searchContacts', accountId, query } },
        );
      }

      if (!query || query.trim() === '') {
        return [];
      }

      const result = await service.searchContacts(accountId, token, query.trim(), {
        seasonId,
        roles: true,
        limit: 50,
      });

      if (result && result.success) {
        const recipientContacts: RecipientContact[] = result.data.contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));
        return recipientContacts;
      } else {
        const normalizedError =
          result?.error ??
          createEmailRecipientError(
            EmailRecipientErrorCode.UNKNOWN_ERROR,
            'Failed to search contacts',
            { context: { operation: 'useEmailRecipients.searchContacts', accountId, query } },
          );
        logError(normalizedError, 'useEmailRecipients.searchContacts');
        throw normalizedError;
      }
    },
    [service, isValidAccountId, accountId, token, seasonId],
  );

  /**
   * Enhanced refresh with retry logic
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (isRetrying) return; // Prevent multiple concurrent retries

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    await fetchRecipients();
  }, [fetchRecipients, isRetrying]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // Computed properties for error recovery
  const canRetry = useMemo(() => {
    return error?.retryable === true && retryCount < 3;
  }, [error, retryCount]);

  const recoveryActions = useMemo(() => {
    if (!error) return [];

    // Import getRecoveryActions here to avoid circular dependency
    return [
      'Try refreshing the data',
      'Check your internet connection',
      'Contact support if the problem persists',
    ];
  }, [error]);

  // Initial data fetch with dependency validation
  useEffect(() => {
    if (service && isValidAccountId) {
      fetchRecipients();
    }
  }, [service, isValidAccountId, fetchRecipients]);

  // Auto-retry on network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (error?.code === EmailRecipientErrorCode.NETWORK_ERROR) {
        refresh();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [error, refresh]);

  return {
    contacts,
    hasMoreContacts,
    isLoading,
    error,
    isRetrying,
    retryCount,
    refresh,
    searchContacts,
    clearError,
    canRetry,
    recoveryActions,
  };
}

// ============================
// useContactSearch Hook
// ============================

export interface UseContactSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredContacts: RecipientContact[];
  isSearching: boolean;
  searchError: EmailRecipientError | null;
  clearSearchError: () => void;
}

/**
 * Enhanced hook for searching and filtering contacts with debouncing
 * Includes comprehensive error handling and validation
 *
 * @param contacts - Array of contacts to search through
 * @returns Object with search state and filtered results
 */
export function useContactSearch(contacts: RecipientContact[]): UseContactSearchReturn {
  const [searchQuery, setSearchQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<EmailRecipientError | null>(null);

  // Validation
  const validContacts = useMemo(() => {
    if (!Array.isArray(contacts)) {
      console.warn('useContactSearch: contacts is not an array, using empty array');
      return [];
    }
    return contacts;
  }, [contacts]);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Set search query with validation
  const setSearchQuery = useCallback((query: string) => {
    if (typeof query !== 'string') {
      setSearchError(
        createEmailRecipientError(
          EmailRecipientErrorCode.VALIDATION_FAILED,
          'Search query must be a string',
          { context: { operation: 'useContactSearch.setSearchQuery', query } },
        ),
      );
      return;
    }

    setSearchQueryState(query);
    setSearchError(null);

    if (query.length > 0) {
      setIsSearching(true);
    }
  }, []);

  // Clear search error
  const clearSearchError = useCallback(() => {
    setSearchError(null);
  }, []);

  // Filter contacts based on debounced query with comprehensive error handling
  const filteredContacts = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return validContacts;
    }

    const filterResult = safe(
      () => {
        const query = debouncedQuery.toLowerCase().trim();
        const minQueryLength = 2;

        if (query.length < minQueryLength) {
          return validContacts;
        }

        // Validate contacts before filtering
        const validContactsToFilter = validContacts.filter((contact) => {
          if (!contact || typeof contact !== 'object') {
            console.warn('Invalid contact object found:', contact);
            return false;
          }
          return true;
        });

        return validContactsToFilter.filter((contact) => {
          try {
            const searchableFields = [
              contact.displayName,
              contact.email,
              contact.firstName,
              contact.lastName,
            ].filter((field) => field && typeof field === 'string');

            if (searchableFields.length === 0) {
              return false; // No searchable fields
            }

            const searchableText = searchableFields.join(' ').toLowerCase();
            return searchableText.includes(query);
          } catch (fieldError) {
            console.warn('Error processing contact for search:', contact, fieldError);
            return false;
          }
        });
      },
      {
        operation: 'useContactSearch.filter',
        query: debouncedQuery,
        additionalData: {
          contactCount: validContacts.length,
        },
      },
    );

    if (filterResult.success) {
      return filterResult.data;
    } else {
      setSearchError(filterResult.error);
      logError(filterResult.error, 'useContactSearch.filteredContacts');
      // Return original contacts as fallback
      return validContacts;
    }
  }, [validContacts, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredContacts,
    isSearching,
    searchError,
    clearSearchError,
  };
}

// ============================
// useCurrentSeason Hook (Enhanced)
// ============================

export interface UseCurrentSeasonReturn {
  currentSeason: Season | null;
  isLoading: boolean;
  error: EmailRecipientError | null;
  seasons: Season[];
}

/**
 * Hook for fetching current season and available seasons
 * Enhanced version that provides full season objects and seasons list
 *
 * @param accountId - Account ID for fetching season data
 * @returns Object with current season, loading state, and available seasons
 */
export function useCurrentSeason(accountId: string): UseCurrentSeasonReturn {
  const { token } = useAuth();

  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<EmailRecipientError | null>(null);

  // Service instance
  const service = useMemo(() => {
    if (!token) return null;
    return new EmailRecipientService();
  }, [token]);

  /**
   * Fetch current season data
   */
  const fetchSeasonData = useCallback(async (): Promise<void> => {
    if (!service || !accountId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch current season
      const currentSeasonResult = await service.fetchCurrentSeason(accountId, token);
      if (currentSeasonResult.success) {
        setCurrentSeason(currentSeasonResult.data);
      } else {
        logError(currentSeasonResult.error, 'useCurrentSeason.fetchSeasonData');
        throw currentSeasonResult.error;
      }

      // Note: Seasons list would require additional API endpoint
      // For now, we only provide the current season
      setSeasons(currentSeasonResult.data ? [currentSeasonResult.data] : []);
    } catch (err) {
      const normalizedError = normalizeError(err, {
        operation: 'useCurrentSeason.fetchSeasonData',
        accountId,
      });
      setError(normalizedError);
      logError(normalizedError, 'useCurrentSeason.fetchSeasonData');
    } finally {
      setIsLoading(false);
    }
  }, [service, accountId, token]);

  // Initial data fetch
  useEffect(() => {
    if (service && accountId) {
      fetchSeasonData();
    }
  }, [service, accountId, fetchSeasonData]);

  return {
    currentSeason,
    isLoading,
    error,
    seasons,
  };
}
