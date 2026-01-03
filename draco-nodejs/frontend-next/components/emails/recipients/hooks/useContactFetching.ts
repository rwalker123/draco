'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { RecipientContact } from '../../../../types/emails/recipients';
import { EmailRecipientError, EmailRecipientErrorCode } from '../../../../types/errors';
import { createEmailRecipientError, safeAsync } from '../../../../utils/errorHandling';
import { createEmailRecipientService } from '../../../../services/emailRecipientService';

interface SelectedContactCacheEntry {
  contact: RecipientContact;
  selectedTime: number;
}

export interface PaginationState {
  hasNext: boolean;
  hasPrev: boolean;
  totalContacts: number;
}

export interface UseContactFetchingProps {
  accountId: string;
  token: string | null;
  seasonId?: string;
  showNotification: (message: string, severity: 'error' | 'warning' | 'info' | 'success') => void;
  initialRowsPerPage?: number;
}

export interface UseContactFetchingResult {
  currentPageContacts: RecipientContact[];
  paginationLoading: boolean;
  paginationError: EmailRecipientError | null;
  selectedContactsCache: Map<string, SelectedContactCacheEntry>;
  searchContacts: RecipientContact[];

  // Pagination state
  currentPage: number;
  rowsPerPage: number;
  serverPaginationState: PaginationState;
  searchCurrentPage: number;
  searchPaginationState: PaginationState;
  hasSearched: boolean;
  lastSearchQuery: string;

  setSearchContacts: React.Dispatch<React.SetStateAction<RecipientContact[]>>;

  fetchContactsPage: (page: number, limit: number) => Promise<void>;
  handleSearchWithPagination: (query: string, page: number, limit: number) => Promise<void>;
  handleSearch: (query: string) => Promise<void>;
  getContactDetails: (contactId: string) => RecipientContact | null;
  hasContacts: boolean;

  // Pagination helpers
  isInSearchMode: () => boolean;
  paginationState: PaginationState & { currentPage: number; totalPages: number };
  paginationHandlers: {
    handleNextPage: () => void;
    handlePrevPage: () => void;
    handleRowsPerPageChange: (newRowsPerPage: number) => void;
  };

  // Selected contacts cache management
  cacheSelectedContact: (contact: RecipientContact) => void;
  uncacheSelectedContact: (contactId: string) => void;
  getSelectedContactsFromCache: () => RecipientContact[];
  clearSelectedContactsCache: () => void;
}

export function useContactFetching({
  accountId,
  token,
  seasonId,
  showNotification,
  initialRowsPerPage = 25,
}: UseContactFetchingProps): UseContactFetchingResult {
  const [currentPageContacts, setCurrentPageContacts] = useState<RecipientContact[]>([]);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [paginationError, setPaginationError] = useState<EmailRecipientError | null>(null);
  const [selectedContactsCache] = useState<Map<string, SelectedContactCacheEntry>>(new Map());
  const [cacheVersion, setCacheVersion] = useState(0);
  const [searchContacts, setSearchContacts] = useState<RecipientContact[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [serverPaginationState, setServerPaginationState] = useState<PaginationState>({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });

  // Search pagination state
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchPaginationState, setSearchPaginationState] = useState<PaginationState>({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const emailRecipientService = useMemo(() => createEmailRecipientService(), []);

  const fetchContactsPage = useCallback(
    async (page: number, limit: number) => {
      if (!token || !accountId) return;

      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      fetchAbortControllerRef.current = abortController;

      setPaginationLoading(true);
      setPaginationError(null);

      const result = await safeAsync(
        async () => {
          const result = await emailRecipientService.fetchContacts(accountId, token, {
            page,
            limit,
            roles: true,
            contactDetails: true,
            seasonId: seasonId || undefined,
          });

          if (abortController.signal.aborted) {
            return;
          }

          const recipientContacts: RecipientContact[] = result.contacts.map((contact) => ({
            ...contact,
            displayName: contact.firstName + ' ' + contact.lastName,
            hasValidEmail: !!contact.email,
          }));

          setCurrentPageContacts(recipientContacts);
          setServerPaginationState({
            hasNext: result.pagination?.hasNext || false,
            hasPrev: result.pagination?.hasPrev || page > 1,
            totalContacts: recipientContacts.length,
          });
          setCurrentPage(page);
        },
        {
          operation: 'fetchContactsPage',
          accountId: accountId,
          additionalData: { component: 'AdvancedRecipientDialog', page, limit },
        },
      );

      if (!result.success) {
        if (result.error.message?.includes('AbortError')) {
          return;
        }

        const contactError =
          result.error.code === EmailRecipientErrorCode.CONTACT_NOT_FOUND
            ? result.error
            : createEmailRecipientError(
                EmailRecipientErrorCode.API_UNAVAILABLE,
                'Contact service temporarily unavailable',
                {
                  userMessage: 'Unable to load contacts. Please try again later.',
                  retryable: true,
                  context: result.error.context,
                },
              );

        setPaginationError(contactError);
        showNotification(contactError.userMessage || contactError.message, 'error');
      }

      if (!abortController.signal.aborted) {
        setPaginationLoading(false);
      }

      if (fetchAbortControllerRef.current === abortController) {
        fetchAbortControllerRef.current = null;
      }
    },
    [emailRecipientService, token, accountId, seasonId, showNotification],
  );

  const handleSearchWithPagination = useCallback(
    async (query: string, page: number = 1, limit: number = 25) => {
      if (!query.trim() || !token) {
        setSearchContacts([]);
        setHasSearched(false);
        setSearchCurrentPage(1);
        setSearchPaginationState({ hasNext: false, hasPrev: false, totalContacts: 0 });
        return;
      }

      try {
        const searchResult = await emailRecipientService.searchContacts(accountId, token, query, {
          roles: true,
          contactDetails: true,
          page: page,
          limit: limit,
        });

        if (searchResult.success) {
          const recipientContacts: RecipientContact[] = searchResult.data.contacts.map(
            (contact) => ({
              ...contact,
              displayName: contact.firstName + ' ' + contact.lastName,
              hasValidEmail: !!contact.email,
            }),
          );

          setSearchContacts(recipientContacts);
          setHasSearched(true);
          setSearchCurrentPage(page);

          const pagination = searchResult.data.pagination;
          setSearchPaginationState({
            hasNext: pagination?.hasNext || false,
            hasPrev: pagination?.hasPrev || page > 1,
            totalContacts: recipientContacts.length,
          });
        } else {
          throw new Error(searchResult.error.message);
        }
      } catch (error: unknown) {
        console.error('Search failed:', error);
        setSearchContacts([]);
        setHasSearched(true);
        setSearchPaginationState({ hasNext: false, hasPrev: false, totalContacts: 0 });
        showNotification(error instanceof Error ? error.message : 'Search failed', 'error');
      }
    },
    [emailRecipientService, token, accountId, showNotification],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setSearchContacts([]);
        setHasSearched(false);
        setSearchCurrentPage(1);
        setSearchPaginationState({ hasNext: false, hasPrev: false, totalContacts: 0 });
        setLastSearchQuery('');
        return;
      }

      setLastSearchQuery(trimmedQuery);
      await handleSearchWithPagination(trimmedQuery, 1, rowsPerPage);
    },
    [handleSearchWithPagination, rowsPerPage],
  );

  const getContactDetails = useCallback(
    (contactId: string): RecipientContact | null => {
      const currentPageContact = currentPageContacts.find((c) => c.id === contactId);
      if (currentPageContact) {
        return currentPageContact;
      }

      const searchContact = searchContacts.find((c) => c.id === contactId);
      if (searchContact) {
        return searchContact;
      }

      const cacheEntry = selectedContactsCache.get(contactId);
      return cacheEntry ? cacheEntry.contact : null;
    },
    [currentPageContacts, searchContacts, selectedContactsCache],
  );

  const hasContacts = useMemo(
    () => Array.isArray(currentPageContacts) && currentPageContacts.length > 0,
    [currentPageContacts],
  );

  // Derived state for search mode - used by pagination logic
  const inSearchMode = useMemo(
    () => Boolean(lastSearchQuery?.trim() && hasSearched),
    [lastSearchQuery, hasSearched],
  );

  // Wrapper function for external consumers that expect a function
  const isInSearchMode = useCallback(() => inSearchMode, [inSearchMode]);

  const paginationState = useMemo(() => {
    if (inSearchMode) {
      return {
        hasNext: searchPaginationState.hasNext,
        hasPrev: searchPaginationState.hasPrev,
        totalContacts: searchPaginationState.totalContacts,
        currentPage: searchCurrentPage,
        totalPages: 0,
      };
    }

    return {
      hasNext: serverPaginationState.hasNext,
      hasPrev: serverPaginationState.hasPrev,
      totalContacts: serverPaginationState.totalContacts,
      currentPage: currentPage,
      totalPages: 0,
    };
  }, [serverPaginationState, searchPaginationState, searchCurrentPage, currentPage, inSearchMode]);

  const handleNextPage = useCallback(() => {
    if (inSearchMode) {
      if (searchPaginationState.hasNext) {
        void handleSearchWithPagination(lastSearchQuery, searchCurrentPage + 1, rowsPerPage);
      }
    } else {
      if (serverPaginationState.hasNext) {
        void fetchContactsPage(currentPage + 1, rowsPerPage);
      }
    }
  }, [
    inSearchMode,
    searchPaginationState.hasNext,
    lastSearchQuery,
    searchCurrentPage,
    rowsPerPage,
    serverPaginationState.hasNext,
    currentPage,
    handleSearchWithPagination,
    fetchContactsPage,
  ]);

  const handlePrevPage = useCallback(() => {
    if (inSearchMode) {
      if (searchPaginationState.hasPrev && searchCurrentPage > 1) {
        void handleSearchWithPagination(lastSearchQuery, searchCurrentPage - 1, rowsPerPage);
      }
    } else {
      if (serverPaginationState.hasPrev && currentPage > 1) {
        void fetchContactsPage(currentPage - 1, rowsPerPage);
      }
    }
  }, [
    inSearchMode,
    searchPaginationState.hasPrev,
    lastSearchQuery,
    searchCurrentPage,
    rowsPerPage,
    serverPaginationState.hasPrev,
    currentPage,
    handleSearchWithPagination,
    fetchContactsPage,
  ]);

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      setRowsPerPage(newRowsPerPage);
      if (inSearchMode) {
        void handleSearchWithPagination(lastSearchQuery, 1, newRowsPerPage);
      } else {
        void fetchContactsPage(1, newRowsPerPage);
      }
    },
    [inSearchMode, lastSearchQuery, handleSearchWithPagination, fetchContactsPage],
  );

  const paginationHandlers = useMemo(
    () => ({
      handleNextPage,
      handlePrevPage,
      handleRowsPerPageChange,
    }),
    [handleNextPage, handlePrevPage, handleRowsPerPageChange],
  );

  const cacheSelectedContact = useCallback(
    (contact: RecipientContact) => {
      selectedContactsCache.set(contact.id, {
        contact,
        selectedTime: Date.now(),
      });
      setCacheVersion((v) => v + 1);
    },
    [selectedContactsCache],
  );

  const uncacheSelectedContact = useCallback(
    (contactId: string) => {
      selectedContactsCache.delete(contactId);
      setCacheVersion((v) => v + 1);
    },
    [selectedContactsCache],
  );

  const getSelectedContactsFromCache = useCallback((): RecipientContact[] => {
    void cacheVersion;
    return Array.from(selectedContactsCache.values())
      .sort((a, b) => a.selectedTime - b.selectedTime)
      .map((entry) => entry.contact);
  }, [selectedContactsCache, cacheVersion]);

  const clearSelectedContactsCache = useCallback(() => {
    selectedContactsCache.clear();
    setCacheVersion((v) => v + 1);
  }, [selectedContactsCache]);

  return {
    currentPageContacts,
    paginationLoading,
    paginationError,
    selectedContactsCache,
    searchContacts,

    currentPage,
    rowsPerPage,
    serverPaginationState,
    searchCurrentPage,
    searchPaginationState,
    hasSearched,
    lastSearchQuery,

    setSearchContacts,

    fetchContactsPage,
    handleSearchWithPagination,
    handleSearch,
    getContactDetails,
    hasContacts,

    isInSearchMode,
    paginationState,
    paginationHandlers,

    cacheSelectedContact,
    uncacheSelectedContact,
    getSelectedContactsFromCache,
    clearSelectedContactsCache,
  };
}
