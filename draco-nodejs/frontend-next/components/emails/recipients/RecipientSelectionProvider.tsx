'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  RecipientSelectionState,
  RecipientSelectionActions,
  RecipientSelectionConfig,
  RecipientSelectionContextValue,
  RecipientSelectionProviderProps,
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionTab,
} from '../../../types/emails/recipients';
import { getEffectiveRecipients, validateRecipientSelection } from './recipientUtils';
import { useContactSearch } from '../../../hooks/useContactSearch';
import { safeAsync, logError } from '../../../utils/errorHandling';

const RecipientSelectionContext = createContext<RecipientSelectionContextValue | null>(null);

/**
 * Default configuration for recipient selection
 */
const defaultConfig: RecipientSelectionConfig = {
  allowAllContacts: true,
  allowTeamGroups: true,
  allowRoleGroups: true,
  requireValidEmails: true,
  showRecipientCount: true,
};

/**
 * RecipientSelectionProvider - Manages recipient selection state for email composition
 */
export const RecipientSelectionProvider: React.FC<RecipientSelectionProviderProps> = ({
  children,
  contacts,
  teamGroups = [],
  roleGroups = [],
  config: userConfig = {},
  onSelectionChange,
  accountId, // Add accountId prop for search functionality
  seasonId, // Add seasonId prop for search context
  initialHasMoreContacts = false, // Initial pagination state from parent
}) => {
  const { token } = useAuth();
  const config = useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);

  // Client-side mounted state to prevent SSR hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Selection state
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [allContacts, setAllContacts] = useState(false);
  const [selectedTeamGroups, setSelectedTeamGroups] = useState<TeamGroup[]>([]);
  const [selectedRoleGroups, setSelectedRoleGroups] = useState<RoleGroup[]>([]);
  const [lastSelectedContactId, setLastSelectedContactId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<RecipientSelectionTab>('contacts');

  // Simple pagination state
  const [currentPageContacts, setCurrentPageContacts] = useState<RecipientContact[]>(contacts);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialHasMoreContacts);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const pageSize = 50;

  // Server-side search functionality - only initialize when mounted to prevent SSR issues
  const { searchState, searchContacts, clearSearch } = useContactSearch(
    (isMounted && accountId) || '',
    'recipients',
    {
      seasonId: isMounted ? seasonId : undefined,
      roles: true,
      contactDetails: true,
      limit: 50, // Smaller initial limit for better pagination
    },
  );

  // Initialize contacts with first page
  useEffect(() => {
    if (accountId && contacts.length > 0) {
      // Use provided contacts as first page
      setCurrentPageContacts(contacts);
      setCurrentPage(1);
      setHasPrevPage(false);
      setHasNextPage(initialHasMoreContacts);
    }
  }, [contacts, accountId, initialHasMoreContacts]);

  // Determine which contacts to display - use current page or search results
  const displayContacts = useMemo(() => {
    let contactsToUse: RecipientContact[];

    if (searchState.hasSearched && searchQuery.trim()) {
      // Use search results if we have searched and have a query
      contactsToUse = searchState.results as RecipientContact[];
    } else {
      // Use current page contacts (simple pagination)
      contactsToUse = currentPageContacts;
    }

    // Apply email validation filter if required
    if (false && config.requireValidEmails) {
      // TEMPORARILY DISABLED FOR TESTING
      // const beforeFilter = contactsToUse.length;
      // const beforeFilterFirst = contactsToUse[0]?.displayName;
      contactsToUse = contactsToUse.filter((contact) => contact.hasValidEmail);
    }

    // Force new array reference for React to detect change
    const result = [...contactsToUse];

    return result;
  }, [
    currentPageContacts,
    searchState.results,
    searchState.hasSearched,
    searchQuery,
    config.requireValidEmails,
  ]);

  // Handle search query changes with proper memoization to prevent infinite loops
  const handleSearchQueryChange = useCallback(
    async (query: string) => {
      // Prevent unnecessary updates if query hasn't changed
      if (query === searchQuery) {
        return;
      }

      setSearchQuery(query);

      if (!query.trim()) {
        // Clear search when query is empty
        clearSearch();
      } else {
        // Perform server-side search
        await searchContacts(query);
      }
    },
    [searchContacts, clearSearch, searchQuery],
  );

  // Compute selection state
  const state = useMemo<RecipientSelectionState>(() => {
    const effectiveRecipients = getEffectiveRecipients(
      {
        selectedContactIds,
        allContacts,
        selectedTeamGroups,
        selectedRoleGroups,
        totalRecipients: 0,
        validEmailCount: 0,
        invalidEmailCount: 0,
        searchQuery,
        activeTab,
      },
      displayContacts, // Use display contacts instead of original contacts
    );

    const validEmailCount = effectiveRecipients.filter((r) => r.hasValidEmail).length;
    const invalidEmailCount = effectiveRecipients.filter((r) => !r.hasValidEmail).length;

    return {
      selectedContactIds,
      allContacts,
      selectedTeamGroups,
      selectedRoleGroups,
      totalRecipients: effectiveRecipients.length,
      validEmailCount,
      invalidEmailCount,
      lastSelectedContactId,
      searchQuery,
      activeTab,
      searchLoading: searchState.loading, // Add search loading state
      searchError: searchState.error, // Add search error state
      // Pagination state
      currentPage,
      hasNextPage,
      hasPrevPage,
      contactsLoading,
      contactsError,
    };
  }, [
    selectedContactIds,
    allContacts,
    selectedTeamGroups,
    selectedRoleGroups,
    lastSelectedContactId,
    searchQuery,
    activeTab,
    displayContacts,
    searchState.loading,
    searchState.error,
    currentPage,
    hasNextPage,
    hasPrevPage,
    contactsLoading,
    contactsError,
  ]);

  // Individual contact actions
  const selectContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => new Set([...prev, contactId]));
    setLastSelectedContactId(contactId);
  }, []);

  const deselectContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(contactId);
      return newSet;
    });
  }, []);

  const toggleContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
        setLastSelectedContactId(contactId);
      }
      return newSet;
    });
  }, []);

  const selectContactRange = useCallback(
    (fromId: string, toId: string) => {
      const fromIndex = displayContacts.findIndex((c) => c.id === fromId);
      const toIndex = displayContacts.findIndex((c) => c.id === toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);

      const rangeIds = displayContacts.slice(startIndex, endIndex + 1).map((c) => c.id);

      setSelectedContactIds((prev) => new Set([...prev, ...rangeIds]));
    },
    [displayContacts],
  );

  // Group actions
  const selectAllContacts = useCallback(() => {
    setAllContacts(true);
    setSelectedContactIds(new Set());
    setSelectedTeamGroups([]);
    setSelectedRoleGroups([]);
  }, []);

  const deselectAllContacts = useCallback(() => {
    setAllContacts(false);
  }, []);

  const selectTeamGroup = useCallback((team: TeamGroup) => {
    setSelectedTeamGroups((prev) => {
      const exists = prev.find((t) => t.id === team.id);
      if (exists) return prev;
      return [...prev, team];
    });
  }, []);

  const deselectTeamGroup = useCallback((teamId: string) => {
    setSelectedTeamGroups((prev) => prev.filter((t) => t.id !== teamId));
  }, []);

  const selectRoleGroup = useCallback((role: RoleGroup) => {
    setSelectedRoleGroups((prev) => {
      const exists = prev.find((r) => r.roleId === role.roleId);
      if (exists) return prev;
      return [...prev, role];
    });
  }, []);

  const deselectRoleGroup = useCallback((roleId: string) => {
    setSelectedRoleGroups((prev) => prev.filter((r) => r.roleId !== roleId));
  }, []);

  // Navigate to next page
  const goToNextPage = useCallback(async () => {
    if (contactsLoading || !hasNextPage || !accountId || !token || !isMounted) return;

    setContactsLoading(true);
    setContactsError(null);

    const result = await safeAsync(
      async () => {
        const { createEmailRecipientService } = await import(
          '../../../services/emailRecipientService'
        );
        const emailRecipientService = createEmailRecipientService();

        const nextPage = currentPage + 1;
        const response = await emailRecipientService.fetchContacts(accountId, token, {
          page: nextPage,
          limit: pageSize,
          seasonId,
          roles: true,
          contactDetails: true,
        });

        if (!response.success) {
          throw new Error(response.error.message);
        }

        const { transformBackendContact } = await import(
          '../../../utils/emailRecipientTransformers'
        );
        const newContacts = response.data.contacts.map(transformBackendContact);

        return {
          nextPage,
          newContacts,
          hasNext: response.data.pagination?.hasNext ?? false,
        };
      },
      {
        accountId,
        seasonId,
        operation: 'pagination_next',
      },
    );

    if (result.success) {
      setCurrentPageContacts(result.data.newContacts);
      setCurrentPage(result.data.nextPage);
      setHasPrevPage(true);
      setHasNextPage(result.data.hasNext);
    } else {
      logError(result.error, 'goToNextPage');
      setContactsError(result.error.userMessage);
    }

    setContactsLoading(false);
  }, [contactsLoading, hasNextPage, accountId, currentPage, pageSize, seasonId, token, isMounted]);

  // Navigate to previous page
  const goToPrevPage = useCallback(async () => {
    if (contactsLoading || !hasPrevPage || !accountId || !token || !isMounted || currentPage <= 1)
      return;

    setContactsLoading(true);
    setContactsError(null);

    const result = await safeAsync(
      async () => {
        const { createEmailRecipientService } = await import(
          '../../../services/emailRecipientService'
        );
        const emailRecipientService = createEmailRecipientService();

        const prevPage = currentPage - 1;
        const response = await emailRecipientService.fetchContacts(accountId, token, {
          page: prevPage,
          limit: pageSize,
          seasonId,
          roles: true,
          contactDetails: true,
        });

        if (!response.success) {
          throw new Error(response.error.message);
        }

        const { transformBackendContact } = await import(
          '../../../utils/emailRecipientTransformers'
        );
        const newContacts = response.data.contacts.map(transformBackendContact);

        return {
          prevPage,
          newContacts,
        };
      },
      {
        accountId,
        seasonId,
        operation: 'pagination_prev',
      },
    );

    if (result.success) {
      setCurrentPageContacts(result.data.newContacts);
      setCurrentPage(result.data.prevPage);
      setHasPrevPage(result.data.prevPage > 1);
      setHasNextPage(true); // If we went back, there must be a next page
    } else {
      logError(result.error, 'goToPrevPage');
      setContactsError(result.error.userMessage);
    }

    setContactsLoading(false);
  }, [contactsLoading, hasPrevPage, accountId, currentPage, pageSize, seasonId, token, isMounted]);

  // Utility actions
  const clearAll = useCallback(() => {
    setSelectedContactIds(new Set());
    setAllContacts(false);
    setSelectedTeamGroups([]);
    setSelectedRoleGroups([]);
    setLastSelectedContactId(undefined);
  }, []);

  const isContactSelected = useCallback(
    (contactId: string): boolean => {
      if (allContacts) return true;
      if (selectedContactIds.has(contactId)) return true;

      // Check if contact is in selected team groups
      for (const team of selectedTeamGroups) {
        if (team.members.some((member) => member.id === contactId)) return true;
      }

      // Check if contact is in selected role groups
      for (const role of selectedRoleGroups) {
        if (role.members.some((member) => member.id === contactId)) return true;
      }

      return false;
    },
    [allContacts, selectedContactIds, selectedTeamGroups, selectedRoleGroups],
  );

  const getSelectedContacts = useCallback((): RecipientContact[] => {
    return displayContacts.filter((contact) => selectedContactIds.has(contact.id));
  }, [displayContacts, selectedContactIds]);

  const getEffectiveRecipientsCallback = useCallback((): RecipientContact[] => {
    return getEffectiveRecipients(state, displayContacts);
  }, [state, displayContacts]);

  // Actions object with new search functionality - memoized to prevent infinite loops
  const actions = useMemo<RecipientSelectionActions>(
    () => ({
      selectContact,
      deselectContact,
      toggleContact,
      selectContactRange,
      selectAllContacts,
      deselectAllContacts,
      selectTeamGroup,
      deselectTeamGroup,
      selectRoleGroup,
      deselectRoleGroup,
      clearAll,
      isContactSelected,
      getSelectedContacts,
      getEffectiveRecipients: getEffectiveRecipientsCallback,
      setSearchQuery: handleSearchQueryChange, // Use the new search handler
      setActiveTab,
      goToNextPage,
      goToPrevPage,
    }),
    [
      selectContact,
      deselectContact,
      toggleContact,
      selectContactRange,
      selectAllContacts,
      deselectAllContacts,
      selectTeamGroup,
      deselectTeamGroup,
      selectRoleGroup,
      deselectRoleGroup,
      clearAll,
      isContactSelected,
      getSelectedContacts,
      getEffectiveRecipientsCallback,
      handleSearchQueryChange,
      setActiveTab,
      goToNextPage,
      goToPrevPage,
    ],
  );

  // Validation
  const validation = useMemo(() => {
    return validateRecipientSelection(state, displayContacts, config.maxRecipients);
  }, [state, displayContacts, config.maxRecipients]);

  // Track previous values to prevent infinite loops
  const prevValuesRef = useRef({
    selectedContactIdsSize: selectedContactIds.size,
    allContacts: allContacts,
    selectedTeamGroupsLength: selectedTeamGroups.length,
    selectedRoleGroupsLength: selectedRoleGroups.length,
  });

  // Notify parent of selection changes only when actual selection values change
  useEffect(() => {
    const currentValues = {
      selectedContactIdsSize: selectedContactIds.size,
      allContacts: allContacts,
      selectedTeamGroupsLength: selectedTeamGroups.length,
      selectedRoleGroupsLength: selectedRoleGroups.length,
    };

    // Check if any actual selection values have changed
    const hasChanged =
      prevValuesRef.current.selectedContactIdsSize !== currentValues.selectedContactIdsSize ||
      prevValuesRef.current.allContacts !== currentValues.allContacts ||
      prevValuesRef.current.selectedTeamGroupsLength !== currentValues.selectedTeamGroupsLength ||
      prevValuesRef.current.selectedRoleGroupsLength !== currentValues.selectedRoleGroupsLength;

    if (hasChanged && onSelectionChange) {
      onSelectionChange(state);
      // Update the ref with current values
      prevValuesRef.current = currentValues;
    }
  }, [
    selectedContactIds.size,
    allContacts,
    selectedTeamGroups.length,
    selectedRoleGroups.length,
    onSelectionChange,
    state,
  ]);

  // Context value with timestamp to force re-renders when pagination changes
  const contextValue = useMemo<RecipientSelectionContextValue>(
    () => ({
      state: {
        ...state,
        _timestamp: Date.now(), // Force context updates when data changes
      } as RecipientSelectionState,
      actions,
      config,
      contacts: displayContacts, // Use display contacts
      teamGroups,
      roleGroups,
      validation,
    }),
    [state, actions, config, displayContacts, teamGroups, roleGroups, validation],
  );

  return (
    <RecipientSelectionContext.Provider value={contextValue}>
      {children}
    </RecipientSelectionContext.Provider>
  );
};

/**
 * Hook to use recipient selection context
 */
export function useRecipientSelection(): RecipientSelectionContextValue {
  const context = useContext(RecipientSelectionContext);
  if (!context) {
    throw new Error('useRecipientSelection must be used within a RecipientSelectionProvider');
  }
  return context;
}
