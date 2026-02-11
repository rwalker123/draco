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

import { useState, useEffect } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0);

  // Validation
  const isValidAccountId = accountId && accountId.trim() !== '';

  /**
   * Enhanced search function with error handling
   */
  const searchContacts = async (query: string): Promise<RecipientContact[]> => {
    if (!token || !isValidAccountId) {
      throw createEmailRecipientError(
        EmailRecipientErrorCode.INVALID_DATA,
        'Service not available or invalid account ID',
        { context: { operation: 'useEmailRecipients.searchContacts', accountId, query } },
      );
    }

    if (!query || query.trim() === '') {
      return [];
    }

    const service = new EmailRecipientService({
      enableRetries: true,
      maxRetries: 3,
      timeoutMs: 30000,
    });

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
  };

  /**
   * Enhanced refresh with retry logic
   */
  const refresh = async (): Promise<void> => {
    if (isRetrying) return; // Prevent multiple concurrent retries

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    setRefreshKey((prev) => prev + 1);
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  // Computed properties for error recovery
  const canRetry = error?.retryable === true && retryCount < 3;

  const recoveryActions = !error
    ? []
    : [
        'Try refreshing the data',
        'Check your internet connection',
        'Contact support if the problem persists',
      ];

  // Initial data fetch with dependency validation
  useEffect(() => {
    if (!token || !isValidAccountId) {
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

    const controller = new AbortController();

    const fetchRecipients = async (): Promise<void> => {
      const service = new EmailRecipientService({
        enableRetries: true,
        maxRetries: 3,
        timeoutMs: 30000,
      });

      try {
        setIsLoading(true);
        setError(null);

        const result = await service.getRecipientData(accountId, token, seasonId);

        if (controller.signal.aborted) return;

        if (result.success) {
          setContacts(result.data.contacts);
          setHasMoreContacts(result.data.pagination?.hasNext ?? false);

          setRetryCount(0);
        } else {
          const normalizedError = result.error;
          setError(normalizedError);
          logError(normalizedError, 'useEmailRecipients.fetchRecipients');
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const normalizedError = normalizeError(err, {
          operation: 'useEmailRecipients.fetchRecipients',
          accountId,
          seasonId,
        });

        setError(normalizedError);
        logError(normalizedError, 'useEmailRecipients.fetchRecipients - unexpected error');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRetrying(false);
        }
      }
    };

    void fetchRecipients();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, isValidAccountId, token, refreshKey]);

  // Auto-retry on network recovery
  useEffect(() => {
    const handleOnline = () => {
      if (error?.code === EmailRecipientErrorCode.NETWORK_ERROR) {
        setIsRetrying(true);
        setRetryCount((prev) => prev + 1);
        setRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [error]);

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
  const validContacts = !Array.isArray(contacts)
    ? (() => {
        console.warn('useContactSearch: contacts is not an array, using empty array');
        return [];
      })()
    : contacts;

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Set search query with validation
  const setSearchQuery = (query: string) => {
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
  };

  // Clear search error
  const clearSearchError = () => {
    setSearchError(null);
  };

  // Filter contacts based on debounced query with comprehensive error handling
  const filterOutcome = (() => {
    if (!debouncedQuery.trim()) {
      return { contacts: validContacts, error: null as EmailRecipientError | null };
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
      return { contacts: filterResult.data, error: null as EmailRecipientError | null };
    }

    logError(filterResult.error, 'useContactSearch.filteredContacts');
    // Return original contacts as fallback
    return { contacts: validContacts, error: filterResult.error };
  })();

  const filteredContacts = filterOutcome.contacts;
  const derivedSearchError = filterOutcome.error;

  return {
    searchQuery,
    setSearchQuery,
    filteredContacts,
    isSearching,
    searchError: searchError ?? derivedSearchError,
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

  // Initial data fetch
  useEffect(() => {
    if (!token || !accountId) {
      return;
    }

    const controller = new AbortController();

    const fetchSeasonData = async (): Promise<void> => {
      const service = new EmailRecipientService();

      try {
        setIsLoading(true);
        setError(null);

        const currentSeasonResult = await service.fetchCurrentSeason(accountId, token);

        if (controller.signal.aborted) return;

        if (currentSeasonResult.success) {
          setCurrentSeason(currentSeasonResult.data);
          setSeasons(currentSeasonResult.data ? [currentSeasonResult.data] : []);
        } else {
          logError(currentSeasonResult.error, 'useCurrentSeason.fetchSeasonData');
          throw currentSeasonResult.error;
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const normalizedError = normalizeError(err, {
          operation: 'useCurrentSeason.fetchSeasonData',
          accountId,
        });
        setError(normalizedError);
        logError(normalizedError, 'useCurrentSeason.fetchSeasonData');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchSeasonData();

    return () => {
      controller.abort();
    };
  }, [accountId, token]);

  return {
    currentSeason,
    isLoading,
    error,
    seasons,
  };
}
