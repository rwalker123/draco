import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { useAuth } from '../context/AuthContext';
import { createEmailRecipientService } from '../services/emailRecipientService';
import { RecipientContact } from '../types/emails/recipients';

// Pagination state for atomic updates (based on useUserManagement pattern)
interface ContactPaginationState {
  contacts: RecipientContact[];
  loading: boolean;
  isInitialLoad: boolean;
  isPaginating: boolean;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type ContactPaginationAction =
  | { type: 'START_LOADING' }
  | { type: 'START_PAGINATION'; page: number }
  | {
      type: 'SET_DATA';
      contacts: RecipientContact[];
      hasNext: boolean;
      hasPrev: boolean;
      page?: number;
    }
  | { type: 'RESET_TO_INITIAL' };

// Reducer for atomic pagination state updates
const contactPaginationReducer = (
  state: ContactPaginationState,
  action: ContactPaginationAction,
): ContactPaginationState => {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        loading: true,
        isInitialLoad: state.contacts.length === 0,
        isPaginating: false,
      };
    case 'START_PAGINATION':
      return {
        ...state,
        loading: true,
        isInitialLoad: false,
        isPaginating: true,
        page: action.page,
      };
    case 'SET_DATA':
      return {
        ...state,
        contacts: action.contacts,
        hasNext: action.hasNext,
        hasPrev: action.hasPrev,
        page: action.page !== undefined ? action.page : state.page,
        loading: false,
        isInitialLoad: false,
        isPaginating: false,
      };
    case 'RESET_TO_INITIAL':
      return {
        contacts: [],
        loading: true,
        isInitialLoad: true,
        isPaginating: false,
        page: 1,
        hasNext: false,
        hasPrev: false,
      };
    default:
      return state;
  }
};

export interface UseContactSelectionOptions {
  accountId: string;
  seasonId?: string;
  initialRowsPerPage?: number;
  initialSelections?: {
    selectedContactIds: Set<string>;
    selectedContacts: RecipientContact[];
    allContactsSelected: boolean;
  };
}

export interface UseContactSelectionReturn {
  // Pagination state
  contacts: RecipientContact[];
  loading: boolean;
  isInitialLoad: boolean;
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;

  // Search state
  searchTerm: string;
  searchLoading: boolean;
  isShowingSearchResults: boolean;

  // Selection state
  selectedContactIds: Set<string>;
  selectedContacts: RecipientContact[]; // All selected contacts from all pages
  allContactsSelected: boolean;

  // Error state
  error: string | null;

  // Pagination actions
  handleNextPage: () => Promise<void>;
  handlePrevPage: () => Promise<void>;
  handleRowsPerPageChange: (newRowsPerPage: number) => void;

  // Search actions
  handleSearch: (term: string) => Promise<void>;
  handleClearSearch: () => void;
  setSearchTerm: (term: string) => void;

  // Selection actions
  handleContactToggle: (contactId: string) => void;
  handleSelectAll: () => void;
  handleClearAll: () => void;

  // Utility actions
  setError: (error: string | null) => void;
  resetToInitial: () => void;
}

/**
 * Custom hook for contact selection functionality
 * Based on proven useUserManagement pattern with reducer-based pagination state
 */
export const useContactSelection = ({
  accountId,
  seasonId,
  initialRowsPerPage = 25,
  initialSelections,
}: UseContactSelectionOptions): UseContactSelectionReturn => {
  const { token } = useAuth();

  // Pagination state using reducer for atomic updates
  const [paginationState, dispatch] = useReducer(contactPaginationReducer, {
    contacts: [],
    loading: true,
    isInitialLoad: true,
    isPaginating: false,
    page: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Additional state
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    initialSelections?.selectedContactIds || new Set(),
  );
  const [selectedContactsCache, setSelectedContactsCache] = useState<Map<string, RecipientContact>>(
    initialSelections?.selectedContacts
      ? new Map(initialSelections.selectedContacts.map((contact) => [contact.id, contact]))
      : new Map(),
  );
  const [allContactsSelected, setAllContactsSelected] = useState(
    initialSelections?.allContactsSelected || false,
  );
  const [error, setError] = useState<string | null>(null);

  // Service and refs
  const [emailService] = useState(() => createEmailRecipientService());
  const rowsPerPageRef = useRef(rowsPerPage);

  // Update ref when rowsPerPage changes
  useEffect(() => {
    rowsPerPageRef.current = rowsPerPage;
  }, [rowsPerPage]);

  // Load contacts with current pagination parameters
  const loadContacts = useCallback(
    async (currentPage = 1, limit?: number, isPaginating = false) => {
      if (!emailService || !accountId || !token) return;

      try {
        // Use START_PAGINATION for page changes, START_LOADING for initial loads
        if (isPaginating) {
          dispatch({ type: 'START_PAGINATION', page: currentPage });
        } else {
          dispatch({ type: 'START_LOADING' });
        }
        setError(null);

        const result = await emailService.fetchContacts(accountId, token, {
          page: currentPage, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          seasonId,
          roles: true,
          contactDetails: true,
        });

        if (!result.success) {
          throw new Error(result.error.message);
        }

        const transformedContacts: RecipientContact[] = result.data.contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));

        // Atomic state update via reducer
        dispatch({
          type: 'SET_DATA',
          contacts: transformedContacts,
          hasNext: result.data.pagination?.hasNext ?? false,
          hasPrev: result.data.pagination?.hasPrev ?? false,
          page: isPaginating ? undefined : currentPage,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
        dispatch({ type: 'SET_DATA', contacts: [], hasNext: false, hasPrev: false });
      }
    },
    [emailService, accountId, token, seasonId],
  );

  // Search contacts
  const searchContacts = useCallback(
    async (searchQuery: string) => {
      if (!emailService || !accountId || !token || !searchQuery.trim()) return;

      try {
        setSearchLoading(true);
        setError(null);

        const result = await emailService.searchContacts(accountId, token, searchQuery.trim(), {
          seasonId,
          roles: true,
          limit: 100, // Higher limit for search results
        });

        if (!result.success) {
          throw new Error(result.error.message);
        }

        const transformedContacts: RecipientContact[] = result.data.contacts.map((contact) => ({
          ...contact,
          displayName: contact.firstName + ' ' + contact.lastName,
          hasValidEmail: !!contact.email,
        }));

        // Update pagination state with search results
        dispatch({
          type: 'SET_DATA',
          contacts: transformedContacts,
          hasNext: false, // Search results don't have pagination
          hasPrev: false,
          page: 1,
        });

        setIsShowingSearchResults(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search contacts');
        dispatch({ type: 'SET_DATA', contacts: [], hasNext: false, hasPrev: false });
      } finally {
        setSearchLoading(false);
      }
    },
    [emailService, accountId, token, seasonId],
  );

  // Pagination handlers
  const handleNextPage = useCallback(async () => {
    if (paginationState.loading || !paginationState.hasNext || isShowingSearchResults) return;
    await loadContacts(paginationState.page + 1, undefined, true);
  }, [
    paginationState.loading,
    paginationState.hasNext,
    paginationState.page,
    isShowingSearchResults,
    loadContacts,
  ]);

  const handlePrevPage = useCallback(async () => {
    if (
      paginationState.loading ||
      !paginationState.hasPrev ||
      paginationState.page <= 1 ||
      isShowingSearchResults
    )
      return;
    await loadContacts(paginationState.page - 1, undefined, true);
  }, [
    paginationState.loading,
    paginationState.hasPrev,
    paginationState.page,
    isShowingSearchResults,
    loadContacts,
  ]);

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      setRowsPerPage(newRowsPerPage);
      // Reset to first page with new page size
      if (!isShowingSearchResults) {
        loadContacts(1, newRowsPerPage, false);
      }
    },
    [isShowingSearchResults, loadContacts],
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setIsShowingSearchResults(false);
    setSearchLoading(false);
    // Reload regular paginated data
    loadContacts(1, undefined, false);
  }, [loadContacts]);

  // Search handlers
  const handleSearch = useCallback(
    async (term: string) => {
      if (term.trim()) {
        await searchContacts(term);
      } else {
        handleClearSearch();
      }
    },
    [searchContacts, handleClearSearch],
  );

  // Selection handlers
  const handleContactToggle = useCallback(
    (contactId: string) => {
      const contact = paginationState.contacts.find((c) => c.id === contactId);

      setSelectedContactIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(contactId)) {
          newSet.delete(contactId);
        } else {
          newSet.add(contactId);
        }
        return newSet;
      });

      // Update the contacts cache
      if (contact) {
        setSelectedContactsCache((prev) => {
          const newCache = new Map(prev);
          if (newCache.has(contactId)) {
            newCache.delete(contactId);
          } else {
            newCache.set(contactId, contact);
          }
          return newCache;
        });
      }

      // Clear all contacts selected if individual selection is made
      if (allContactsSelected) {
        setAllContactsSelected(false);
      }
    },
    [allContactsSelected, paginationState.contacts],
  );

  const handleSelectAll = useCallback(() => {
    if (allContactsSelected) {
      // If all contacts are selected globally, clear everything
      setAllContactsSelected(false);
      setSelectedContactIds(new Set());
      setSelectedContactsCache(new Map());
    } else {
      // Select all currently visible contacts
      const visibleIds = new Set(paginationState.contacts.map((contact) => contact.id));
      setSelectedContactIds((prev) => new Set([...prev, ...visibleIds]));

      // Add visible contacts to cache
      setSelectedContactsCache((prev) => {
        const newCache = new Map(prev);
        paginationState.contacts.forEach((contact) => {
          newCache.set(contact.id, contact);
        });
        return newCache;
      });
    }
  }, [allContactsSelected, paginationState.contacts]);

  const handleClearAll = useCallback(() => {
    setSelectedContactIds(new Set());
    setSelectedContactsCache(new Map());
    setAllContactsSelected(false);
  }, []);

  const resetToInitial = useCallback(() => {
    // Don't dispatch RESET_TO_INITIAL as it triggers loading state and reloads contacts
    // Just reset the selection state to initial values from parent
    setSearchTerm('');
    setIsShowingSearchResults(false);
    setSearchLoading(false);

    // Reset to initial selections from parent, not empty state
    setSelectedContactIds(initialSelections?.selectedContactIds || new Set());
    setSelectedContactsCache(
      initialSelections?.selectedContacts
        ? new Map(initialSelections.selectedContacts.map((contact) => [contact.id, contact]))
        : new Map(),
    );
    setAllContactsSelected(initialSelections?.allContactsSelected || false);
    setError(null);
  }, [initialSelections]);

  // Initial load
  useEffect(() => {
    if (accountId && token) {
      loadContacts(1, undefined, false);
    }
  }, [accountId, token, loadContacts]); // Only on mount or when these change

  return {
    // Pagination state
    contacts: paginationState.contacts,
    loading: paginationState.loading,
    isInitialLoad: paginationState.isInitialLoad,
    page: paginationState.page,
    rowsPerPage,
    hasNext: paginationState.hasNext,
    hasPrev: paginationState.hasPrev,

    // Search state
    searchTerm,
    searchLoading,
    isShowingSearchResults,

    // Selection state
    selectedContactIds,
    selectedContacts: Array.from(selectedContactsCache.values()),
    allContactsSelected,

    // Error state
    error,

    // Pagination actions
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,

    // Search actions
    handleSearch,
    handleClearSearch,
    setSearchTerm,

    // Selection actions
    handleContactToggle,
    handleSelectAll,
    handleClearAll,

    // Utility actions
    setError,
    resetToInitial,
  };
};
