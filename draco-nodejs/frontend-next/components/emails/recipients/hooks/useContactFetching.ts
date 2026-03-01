'use client';

import { useState, useRef, useEffect } from 'react';
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
  open?: boolean;
}

export interface UseContactFetchingResult {
  currentPageContacts: RecipientContact[];
  paginationLoading: boolean;
  paginationError: EmailRecipientError | null;
  selectedContactsCache: Map<string, SelectedContactCacheEntry>;
  searchContacts: RecipientContact[];

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

  isInSearchMode: () => boolean;
  paginationState: PaginationState & { currentPage: number; totalPages: number };
  paginationHandlers: {
    handleNextPage: () => void;
    handlePrevPage: () => void;
    handleRowsPerPageChange: (newRowsPerPage: number) => void;
  };

  cacheSelectedContact: (contact: RecipientContact) => void;
  uncacheSelectedContact: (contactId: string) => void;
  getSelectedContactsFromCache: () => RecipientContact[];
  clearSelectedContactsCache: () => void;
}

const emailRecipientService = createEmailRecipientService();

export function useContactFetching({
  accountId,
  token,
  seasonId,
  showNotification,
  initialRowsPerPage = 25,
  open = false,
}: UseContactFetchingProps): UseContactFetchingResult {
  const [currentPageContacts, setCurrentPageContacts] = useState<RecipientContact[]>([]);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [paginationError, setPaginationError] = useState<EmailRecipientError | null>(null);
  const [selectedContactsCache, setSelectedContactsCache] = useState<
    Map<string, SelectedContactCacheEntry>
  >(new Map());
  const [searchContacts, setSearchContacts] = useState<RecipientContact[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [serverPaginationState, setServerPaginationState] = useState<PaginationState>({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });

  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchPaginationState, setSearchPaginationState] = useState<PaginationState>({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      fetchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!open || !token || !accountId) return;

    const controller = new AbortController();

    const loadInitialPage = async () => {
      setPaginationLoading(true);
      setPaginationError(null);

      try {
        const fetchResult = await emailRecipientService.fetchContacts(accountId, token, {
          page: 1,
          limit: initialRowsPerPage,
          roles: true,
          contactDetails: true,
          seasonId: seasonId || undefined,
        });

        if (controller.signal.aborted) return;

        const recipientContacts: RecipientContact[] = fetchResult.contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));

        setCurrentPageContacts(recipientContacts);
        setServerPaginationState({
          hasNext: fetchResult.pagination?.hasNext || false,
          hasPrev: false,
          totalContacts: recipientContacts.length,
        });
        setCurrentPage(1);
      } catch {
        if (controller.signal.aborted) return;

        const contactError = createEmailRecipientError(
          EmailRecipientErrorCode.API_UNAVAILABLE,
          'Contact service temporarily unavailable',
          {
            userMessage: 'Unable to load contacts. Please try again later.',
            retryable: true,
          },
        );
        setPaginationError(contactError);
      } finally {
        if (!controller.signal.aborted) {
          setPaginationLoading(false);
        }
      }
    };

    void loadInitialPage();

    return () => {
      controller.abort();
    };
  }, [open, accountId, token, seasonId, initialRowsPerPage]);

  const fetchContactsPage = async (page: number, limit: number) => {
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
        const fetchResult = await emailRecipientService.fetchContacts(accountId, token, {
          page,
          limit,
          roles: true,
          contactDetails: true,
          seasonId: seasonId || undefined,
        });

        if (abortController.signal.aborted) {
          return;
        }

        const recipientContacts: RecipientContact[] = fetchResult.contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));

        setCurrentPageContacts(recipientContacts);
        setServerPaginationState({
          hasNext: fetchResult.pagination?.hasNext || false,
          hasPrev: fetchResult.pagination?.hasPrev || page > 1,
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
      if (abortController.signal.aborted) {
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
  };

  const handleSearchWithPagination = async (
    query: string,
    page: number = 1,
    limit: number = 25,
  ) => {
    if (!query.trim() || !token) {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
        searchAbortControllerRef.current = null;
      }
      setSearchContacts([]);
      setHasSearched(false);
      setSearchCurrentPage(1);
      setSearchPaginationState({ hasNext: false, hasPrev: false, totalContacts: 0 });
      return;
    }

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    try {
      const searchResult = await emailRecipientService.searchContacts(accountId, token, query, {
        roles: true,
        contactDetails: true,
        page: page,
        limit: limit,
      });

      if (abortController.signal.aborted) return;

      if (searchResult.success) {
        const recipientContacts: RecipientContact[] = searchResult.data.contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));

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
      if (abortController.signal.aborted) return;
      console.error('Search failed:', error);
      setSearchContacts([]);
      setHasSearched(true);
      setSearchPaginationState({ hasNext: false, hasPrev: false, totalContacts: 0 });
      showNotification(error instanceof Error ? error.message : 'Search failed', 'error');
    } finally {
      if (searchAbortControllerRef.current === abortController) {
        searchAbortControllerRef.current = null;
      }
    }
  };

  const handleSearch = async (query: string) => {
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
  };

  const getContactDetails = (contactId: string): RecipientContact | null => {
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
  };

  const hasContacts = Array.isArray(currentPageContacts) && currentPageContacts.length > 0;

  const inSearchMode = Boolean(lastSearchQuery?.trim() && hasSearched);

  const isInSearchMode = () => inSearchMode;

  const paginationState = inSearchMode
    ? {
        hasNext: searchPaginationState.hasNext,
        hasPrev: searchPaginationState.hasPrev,
        totalContacts: searchPaginationState.totalContacts,
        currentPage: searchCurrentPage,
        totalPages: 0,
      }
    : {
        hasNext: serverPaginationState.hasNext,
        hasPrev: serverPaginationState.hasPrev,
        totalContacts: serverPaginationState.totalContacts,
        currentPage: currentPage,
        totalPages: 0,
      };

  const handleNextPage = () => {
    if (inSearchMode) {
      if (searchPaginationState.hasNext) {
        void handleSearchWithPagination(lastSearchQuery, searchCurrentPage + 1, rowsPerPage);
      }
    } else {
      if (serverPaginationState.hasNext) {
        void fetchContactsPage(currentPage + 1, rowsPerPage);
      }
    }
  };

  const handlePrevPage = () => {
    if (inSearchMode) {
      if (searchPaginationState.hasPrev && searchCurrentPage > 1) {
        void handleSearchWithPagination(lastSearchQuery, searchCurrentPage - 1, rowsPerPage);
      }
    } else {
      if (serverPaginationState.hasPrev && currentPage > 1) {
        void fetchContactsPage(currentPage - 1, rowsPerPage);
      }
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    if (inSearchMode) {
      void handleSearchWithPagination(lastSearchQuery, 1, newRowsPerPage);
    } else {
      void fetchContactsPage(1, newRowsPerPage);
    }
  };

  const paginationHandlers = {
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
  };

  const cacheSelectedContact = (contact: RecipientContact) => {
    setSelectedContactsCache((prev) => {
      const next = new Map(prev);
      next.set(contact.id, { contact, selectedTime: Date.now() });
      return next;
    });
  };

  const uncacheSelectedContact = (contactId: string) => {
    setSelectedContactsCache((prev) => {
      const next = new Map(prev);
      next.delete(contactId);
      return next;
    });
  };

  const getSelectedContactsFromCache = (): RecipientContact[] => {
    return Array.from(selectedContactsCache.values())
      .sort((a, b) => a.selectedTime - b.selectedTime)
      .map((entry) => entry.contact);
  };

  const clearSelectedContactsCache = () => {
    setSelectedContactsCache(new Map());
  };

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
