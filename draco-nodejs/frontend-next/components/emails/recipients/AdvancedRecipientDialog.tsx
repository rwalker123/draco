'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Stack,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { useNotifications } from '../../../hooks/useNotifications';
import ContactSelectionPanel from './ContactSelectionPanel';
import HierarchicalGroupSelection from './HierarchicalGroupSelection';
import { ManagerStateProvider, useManagerStateContext } from './context/ManagerStateContext';
// import { ErrorBoundary } from '../../common/ErrorBoundary'; // TODO: Re-enable when needed
import { RecipientDialogSkeleton } from '../../common/SkeletonLoaders';
import {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  GroupType,
  ContactGroup,
  RecipientSelectionTab,
} from '../../../types/emails/recipients';

// Simplified RecipientSelectionState for backward compatibility
interface SimplifiedRecipientSelectionState {
  selectedGroups?: Map<GroupType, ContactGroup[]>;
  totalRecipients: number;
  validEmailCount: number;
  invalidEmailCount: number;
  searchQuery: string;
  activeTab: RecipientSelectionTab;
  expandedSections: Set<string>;
  searchLoading?: boolean;
  searchError?: string | null;
  groupSearchQueries: Record<string, string>;
  currentPage?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  contactsLoading?: boolean;
  contactsError?: string | null;
}
import { EmailRecipientError, EmailRecipientErrorCode } from '../../../types/errors';
import { normalizeError, createEmailRecipientError, safeAsync } from '../../../utils/errorHandling';
import { createEmailRecipientService } from '../../../services/emailRecipientService';
import { useAuth } from '../../../context/AuthContext';
import { transformBackendContact } from '../../../utils/emailRecipientTransformers';

export interface AdvancedRecipientDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectionAccepted?: (selectedGroups: Map<GroupType, ContactGroup[]>) => void;
  // Legacy support for onApply callback
  onApply?: (
    recipientState: SimplifiedRecipientSelectionState,
    selectedContacts: RecipientContact[],
  ) => void;
  accountId: string;
  seasonId?: string;
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  initialSelectedGroups?: Map<GroupType, ContactGroup[]>;
}

interface LoadingState {
  contacts: boolean;
  teamGroups: boolean;
  roleGroups: boolean;
  applying: boolean;
}

interface ErrorState {
  contacts: EmailRecipientError | null;
  teamGroups: EmailRecipientError | null;
  roleGroups: EmailRecipientError | null;
  general: EmailRecipientError | null;
}

// Selected contacts cache interfaces and constants
interface SelectedContactCacheEntry {
  contact: RecipientContact;
  selectedTime: number;
}

type TabValue = 'contacts' | 'groups';

/**
 * Wrapper component that provides the ManagerStateProvider context
 */
const AdvancedRecipientDialogWithProvider: React.FC<AdvancedRecipientDialogProps> = (props) => {
  const { accountId, seasonId } = props;

  return (
    <ManagerStateProvider accountId={accountId} seasonId={seasonId || ''}>
      <AdvancedRecipientDialog {...props} />
    </ManagerStateProvider>
  );
};

/**
 * AdvancedRecipientDialog - Comprehensive recipient selection interface
 * Provides tabbed interface for individual contacts, groups, and quick selections
 */
const AdvancedRecipientDialog: React.FC<AdvancedRecipientDialogProps> = ({
  open,
  onClose,
  onSelectionAccepted,
  onApply,
  accountId,
  seasonId,
  teamGroups,
  roleGroups,
  loading = false,
  error = null,
  onRetry,
  initialSelectedGroups,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotifications();
  const { token } = useAuth();

  // Use EmailCompose provider which now contains all recipient functionality

  // Access manager state for converting manager IDs to contact details
  const { state: managerState } = useManagerStateContext();

  // UNIFIED GROUP SYSTEM - Single source of truth for all selections
  const [selectedGroups, setSelectedGroups] = useState<Map<GroupType, ContactGroup[]>>(new Map());

  // Hierarchical selection state for shared data model
  const [hierarchicalSelectedIds, setHierarchicalSelectedIds] = useState<
    Map<string, 'selected' | 'intermediate' | 'unselected'>
  >(new Map());
  const [hierarchicalManagersOnly, setHierarchicalManagersOnly] = useState<boolean>(false);

  // Server-side pagination state for contacts
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPageContacts, setCurrentPageContacts] = useState<RecipientContact[]>([]);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [paginationError, setPaginationError] = useState<EmailRecipientError | null>(null);
  const [serverPaginationState, setServerPaginationState] = useState({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });

  // Selected contacts cache: stores only selected contacts for cross-page tracking
  const [selectedContactsCache, setSelectedContactsCache] = useState<
    Map<string, SelectedContactCacheEntry>
  >(new Map());

  // Search state at dialog level (shared between ContactsTabContent and getContactDetails)
  const [searchContacts, setSearchContacts] = useState<RecipientContact[]>([]);

  // Search pagination state
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchPaginationState, setSearchPaginationState] = useState({
    hasNext: false,
    hasPrev: false,
    totalContacts: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  // AbortController for race condition protection
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Email recipient service
  const emailRecipientService = useMemo(() => createEmailRecipientService(), []);

  // Unified group system utilities
  const addToGroup = useCallback(
    (groupType: GroupType, contactId: string, _contact?: RecipientContact) => {
      setSelectedGroups((prevGroups) => {
        const newGroups = new Map(prevGroups);
        const existingGroups = newGroups.get(groupType) || [];

        // Find existing group or create new one
        let targetGroup = existingGroups.find((g) => g.groupType === groupType);
        if (!targetGroup) {
          const groupName =
            {
              individuals: 'Individual Selections',
              managers: 'Managers',
              teams: 'Teams',
              division: 'Divisions',
              league: 'Leagues',
              season: 'Season Participants',
            }[groupType] || 'Unknown Group';

          targetGroup = {
            groupType,
            groupName,
            contactIds: new Set(),
            totalCount: 0,
          };
          existingGroups.push(targetGroup);
        }

        // Add contact to group (targetGroup is guaranteed to exist here)
        if (targetGroup) {
          targetGroup.contactIds.add(contactId);
          targetGroup.totalCount = targetGroup.contactIds.size;
        }

        newGroups.set(groupType, existingGroups);
        return newGroups;
      });
    },
    [],
  );

  const removeFromGroup = useCallback((groupType: GroupType, contactId: string) => {
    setSelectedGroups((prevGroups) => {
      const newGroups = new Map(prevGroups);
      const existingGroups = newGroups.get(groupType) || [];

      const updatedGroups = existingGroups
        .map((group) => {
          const newContactIds = new Set(group.contactIds);
          newContactIds.delete(contactId);

          return {
            ...group,
            contactIds: newContactIds,
            totalCount: newContactIds.size,
          };
        })
        .filter((group) => group.totalCount > 0); // Remove empty groups

      if (updatedGroups.length > 0) {
        newGroups.set(groupType, updatedGroups);
      } else {
        newGroups.delete(groupType);
      }

      return newGroups;
    });
  }, []);

  const isContactInGroup = useCallback(
    (groupType: GroupType, contactId: string): boolean => {
      const groups = selectedGroups.get(groupType);
      if (!groups) return false;
      return groups.some((group) => group.contactIds.has(contactId));
    },
    [selectedGroups],
  );

  const getTotalSelected = useCallback((): number => {
    let total = 0;
    selectedGroups.forEach((groups) => {
      groups.forEach((group) => {
        total += group.totalCount;
      });
    });
    return total;
  }, [selectedGroups]);

  // Hierarchical selection change handler
  const handleHierarchicalSelectionChange = useCallback(
    (
      itemSelectedState: Map<string, 'selected' | 'intermediate' | 'unselected'>,
      managersOnly: boolean,
    ) => {
      setHierarchicalSelectedIds(itemSelectedState);
      setHierarchicalManagersOnly(managersOnly);

      // TODO: Convert to ContactGroups when needed for unified system
      // For now, we'll keep hierarchical selections separate from the main selectedGroups
    },
    [],
  );

  // Hybrid lookup: check current page first, then search contacts, then selected contacts cache
  const getContactDetails = useCallback(
    (contactId: string): RecipientContact | null => {
      // First check current page contacts (best performance)
      const currentPageContact = currentPageContacts.find((c) => c.id === contactId);
      if (currentPageContact) {
        return currentPageContact;
      }

      // Second check search contacts (for search results)
      const searchContact = searchContacts.find((c) => c.id === contactId);
      if (searchContact) {
        return searchContact;
      }

      // Fallback to selected contacts cache (for cross-page selections)
      const cacheEntry = selectedContactsCache.get(contactId);
      return cacheEntry ? cacheEntry.contact : null;
    },
    [currentPageContacts, searchContacts, selectedContactsCache],
  );

  // Function to fetch contacts from server with pagination (with race condition protection)
  const fetchContactsPage = useCallback(
    async (page: number, limit: number) => {
      if (!token || !accountId) return;

      // Cancel any ongoing request to prevent race conditions
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
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
          });

          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }

          if (result.success) {
            const transformedContacts = result.data.contacts.map(transformBackendContact);

            setCurrentPageContacts(transformedContacts);

            // Note: We no longer add all contacts to cache here
            // Only selected contacts are cached when user selects them

            setServerPaginationState({
              hasNext: result.data.pagination?.hasNext || false,
              hasPrev: result.data.pagination?.hasPrev || false,
              totalContacts: transformedContacts.length,
            });
            setCurrentPage(page);
          } else {
            // Convert service result error to standardized error
            const serviceError = result.error?.message || 'Failed to fetch contacts';
            throw createEmailRecipientError(
              EmailRecipientErrorCode.CONTACT_NOT_FOUND,
              serviceError,
              {
                userMessage: 'Unable to load contacts. Please try again.',
                retryable: true,
                context: {
                  operation: 'fetchContacts',
                  accountId: accountId,
                  additionalData: { page, limit },
                },
              },
            );
          }
        },
        {
          operation: 'fetchContactsPage',
          accountId: accountId,
          additionalData: { component: 'AdvancedRecipientDialog', page, limit },
        },
      );

      if (!result.success) {
        // Handle AbortError specifically
        if (result.error.message?.includes('AbortError')) {
          return;
        }

        // Convert to appropriate error type
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

      // Clear the abort controller reference if this was the current request
      if (fetchAbortControllerRef.current === abortController) {
        fetchAbortControllerRef.current = null;
      }
    },
    [emailRecipientService, token, accountId, showNotification],
  );

  // Handle search functionality with pagination support
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
        // Use the search functionality from emailRecipientService
        const searchResult = await emailRecipientService.searchContacts(accountId, token, query, {
          roles: true,
          contactDetails: true,
          page: page - 1, // Backend uses 0-based pagination
          limit: limit,
        });

        if (searchResult.success) {
          // Transform backend contacts to recipient contacts
          const { transformBackendContact } = await import(
            '../../../utils/emailRecipientTransformers'
          );
          const transformedContacts = searchResult.data.contacts.map(transformBackendContact);
          setSearchContacts(transformedContacts);
          setHasSearched(true);
          setSearchCurrentPage(page);

          // Properly calculate pagination state from search results
          const pagination = searchResult.data.pagination;
          setSearchPaginationState({
            hasNext: pagination?.hasNext || false,
            hasPrev: pagination?.hasPrev || page > 1,
            totalContacts: transformedContacts.length,
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

  // Create wrapper for search that handles new search vs pagination
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

      // If this is a new search query, start from page 1
      const isNewSearch = trimmedQuery !== lastSearchQuery;
      const pageToSearch = isNewSearch ? 1 : searchCurrentPage;

      setLastSearchQuery(trimmedQuery);
      await handleSearchWithPagination(trimmedQuery, pageToSearch, rowsPerPage);
    },
    [handleSearchWithPagination, lastSearchQuery, searchCurrentPage, rowsPerPage],
  );

  // Load initial page when dialog opens
  useEffect(() => {
    if (open && token && accountId) {
      fetchContactsPage(1, rowsPerPage);
    }
  }, [open, token, accountId, rowsPerPage, fetchContactsPage]);

  // Check if seasonId is available when dialog opens
  useEffect(() => {
    if (open && !seasonId) {
      // No seasonId provided, skipping season loading
    }
  }, [open, seasonId]);

  const [currentTab, setCurrentTab] = useState<TabValue>('contacts');

  // Initialize unified groups when dialog opens
  useEffect(() => {
    if (open) {
      // Initialize with provided groups or empty if none provided
      setSelectedGroups(initialSelectedGroups || new Map());
    }
  }, [open, initialSelectedGroups]);

  // State for loading and error handling
  const [loadingState, setLoadingState] = useState<LoadingState>({
    contacts: false,
    teamGroups: false,
    roleGroups: false,
    applying: false,
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    contacts: null,
    teamGroups: null,
    roleGroups: null,
    general: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // TODO: Remove this callback when legacy state is fully removed
  // const handleRecipientSelectionChange = useCallback((newState: RecipientSelectionState) => {
  //   console.log('handleRecipientSelectionChange:', newState);
  // }, []);

  // Unified group actions
  const unifiedActions = useMemo(
    () => ({
      toggleContact: (contactId: string) => {
        const contact = getContactDetails(contactId);
        if (!contact || !contact.hasValidEmail) {
          return; // Don't allow selection of contacts without valid email
        }

        if (isContactInGroup('individuals', contactId)) {
          removeFromGroup('individuals', contactId);
        } else {
          addToGroup('individuals', contactId, contact);
        }
      },

      toggleManager: (managerId: string) => {
        // Get manager info from manager state to validate email
        const managerInfo = managerState.managers.find((m) => m.id === managerId);
        if (!managerInfo || !managerInfo.hasValidEmail) {
          return; // Don't allow selection of managers without valid email
        }

        if (isContactInGroup('managers', managerId)) {
          removeFromGroup('managers', managerId);
        } else {
          addToGroup('managers', managerId);
        }
      },

      clearAllRecipients: () => {
        setSelectedGroups(new Map());
      },

      isContactSelected: (contactId: string): boolean => {
        return (
          isContactInGroup('individuals', contactId) || isContactInGroup('managers', contactId)
        );
      },

      getTotalSelected,
    }),
    [
      getContactDetails,
      isContactInGroup,
      removeFromGroup,
      addToGroup,
      managerState.managers,
      getTotalSelected,
    ],
  );

  // Local actions that modify local state only
  // Removed old localActions - now using unifiedActions above

  // Function to check if we're in search mode - more reliable check
  const isInSearchMode = useCallback(() => {
    return Boolean(lastSearchQuery?.trim() && searchContacts.length > 0 && hasSearched);
  }, [lastSearchQuery, searchContacts.length, hasSearched]);

  // Server-side pagination handlers
  const paginationHandlers = useMemo(
    () => ({
      handleNextPage: () => {
        // Check if we're showing search results using reliable method
        if (isInSearchMode()) {
          // Handle search pagination
          if (searchPaginationState.hasNext && !paginationLoading) {
            handleSearchWithPagination(lastSearchQuery, searchCurrentPage + 1, rowsPerPage);
          }
        } else {
          // Handle regular pagination
          if (serverPaginationState.hasNext && !paginationLoading) {
            fetchContactsPage(currentPage + 1, rowsPerPage);
          }
        }
      },
      handlePrevPage: () => {
        // Check if we're showing search results using reliable method
        if (isInSearchMode()) {
          // Handle search pagination
          if (searchPaginationState.hasPrev && !paginationLoading && searchCurrentPage > 1) {
            handleSearchWithPagination(lastSearchQuery, searchCurrentPage - 1, rowsPerPage);
          }
        } else {
          // Handle regular pagination
          if (serverPaginationState.hasPrev && !paginationLoading && currentPage > 1) {
            fetchContactsPage(currentPage - 1, rowsPerPage);
          }
        }
      },
      handleRowsPerPageChange: (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        // Check if we're showing search results using reliable method
        if (isInSearchMode()) {
          // Handle search rows per page change - restart from page 1
          handleSearchWithPagination(lastSearchQuery, 1, newRowsPerPage);
        } else {
          // Handle regular rows per page change
          fetchContactsPage(1, newRowsPerPage);
        }
      },
    }),
    [
      currentPage,
      rowsPerPage,
      serverPaginationState.hasNext,
      serverPaginationState.hasPrev,
      paginationLoading,
      fetchContactsPage,
      handleSearchWithPagination,
      searchCurrentPage,
      searchPaginationState.hasNext,
      searchPaginationState.hasPrev,
      isInSearchMode,
      lastSearchQuery,
    ],
  );

  // Server pagination state - context-aware for search vs regular
  const paginationState = useMemo(() => {
    // If showing search results, use search pagination state
    if (isInSearchMode()) {
      return {
        hasNext: searchPaginationState.hasNext,
        hasPrev: searchPaginationState.hasPrev,
        totalContacts: searchPaginationState.totalContacts,
        totalPages: 0, // Not provided by server, but not needed for UI
      };
    }

    // Otherwise use regular pagination state
    return {
      hasNext: serverPaginationState.hasNext,
      hasPrev: serverPaginationState.hasPrev,
      totalContacts: serverPaginationState.totalContacts,
      totalPages: 0, // Not provided by server, but not needed for UI
    };
  }, [
    serverPaginationState.hasNext,
    serverPaginationState.hasPrev,
    serverPaginationState.totalContacts,
    searchPaginationState.hasNext,
    searchPaginationState.hasPrev,
    searchPaginationState.totalContacts,
    isInSearchMode,
  ]);

  // Data availability checks - use server-loaded contacts
  const hasContacts = useMemo(
    () => Array.isArray(currentPageContacts) && currentPageContacts.length > 0,
    [currentPageContacts],
  );
  const hasTeamGroups = useMemo(
    () => Array.isArray(teamGroups) && teamGroups.length > 0,
    [teamGroups],
  );
  const hasRoleGroups = useMemo(
    () => Array.isArray(roleGroups) && roleGroups.length > 0,
    [roleGroups],
  );
  const hasAnyData = hasContacts || hasTeamGroups || hasRoleGroups;

  // Determine overall loading state - include pagination loading
  const isGeneralLoading =
    loading || paginationLoading || Object.values(loadingState).some(Boolean);

  // Handle tab changes
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  }, []);

  // Cancel and close dialog
  const handleCancel = useCallback(() => {
    // No need to reset state since it's managed by EmailComposeProvider
    // The dialog just closes and the parent retains its current state

    // Clear any temporary errors when canceling
    setErrorState({
      contacts: null,
      teamGroups: null,
      roleGroups: null,
      general: null,
    });
    onClose();
  }, [onClose]);

  // Retry functionality
  const handleRetry = useCallback(() => {
    if (retryCount >= maxRetries) {
      showNotification('Maximum retry attempts reached. Please refresh the page.', 'error');
      return;
    }

    setRetryCount((prev) => prev + 1);
    setErrorState({
      contacts: null,
      teamGroups: null,
      roleGroups: null,
      general: null,
    });

    if (onRetry) {
      onRetry();
    }

    showNotification('Retrying...', 'info');
  }, [retryCount, maxRetries, onRetry, showNotification]);

  // Clear specific errors
  const clearError = useCallback((errorType: keyof ErrorState) => {
    setErrorState((prev) => ({ ...prev, [errorType]: null }));
  }, []);

  // Handle apply selection - UNIFIED SYSTEM ONLY
  const handleApply = useCallback(() => {
    const totalSelected = getTotalSelected();

    if (onSelectionAccepted) {
      // New callback pattern - pass groups directly
      onSelectionAccepted(selectedGroups);
      onClose();
      return;
    }

    if (onApply) {
      // Legacy callback pattern - build contact details and simplified state
      const allSelectedContactDetails: RecipientContact[] = [];
      const allContactIds = new Set<string>();

      // Process all groups in selectedGroups
      selectedGroups.forEach((groups, groupType) => {
        groups.forEach((group) => {
          group.contactIds.forEach((contactId) => {
            if (!allContactIds.has(contactId)) {
              allContactIds.add(contactId);

              // Get contact details based on group type
              let contact = getContactDetails(contactId);

              // If not found in current page and it's a manager, convert from manager data
              if (!contact && groupType === 'managers') {
                const managerInfo = managerState.managers.find((m) => m.id === contactId);
                if (managerInfo) {
                  contact = {
                    id: managerInfo.id,
                    displayName: managerInfo.name,
                    email: managerInfo.email || '',
                    hasValidEmail: managerInfo.hasValidEmail,
                    firstname: managerInfo.name.split(' ')[0] || '',
                    lastname: managerInfo.name.split(' ').slice(1).join(' ') || '',
                    roles: [],
                    teams: managerInfo.allTeams.map((team) => team.teamSeasonId),
                  };
                }
              }

              if (contact) {
                allSelectedContactDetails.push(contact);
              }
            }
          });
        });
      });

      // Create simplified state for the compose page
      const simplifiedState: SimplifiedRecipientSelectionState = {
        selectedGroups,
        totalRecipients: allSelectedContactDetails.length,
        validEmailCount: allSelectedContactDetails.filter((c) => c.hasValidEmail).length,
        invalidEmailCount: allSelectedContactDetails.filter((c) => !c.hasValidEmail).length,
        searchQuery: '',
        activeTab: 'contacts',
        expandedSections: new Set(),
        groupSearchQueries: {},
      };

      onApply(simplifiedState, allSelectedContactDetails);
      onClose();
      return;
    }

    // No callbacks provided - just show notification
    showNotification(`Applied selection: ${totalSelected} recipients`, 'success');
    onClose();
  }, [
    onSelectionAccepted,
    onApply,
    selectedGroups,
    getTotalSelected,
    getContactDetails,
    managerState.managers,
    showNotification,
    onClose,
  ]);

  // Effect to handle external error prop
  useEffect(() => {
    if (error) {
      const generalError =
        typeof error === 'string'
          ? createEmailRecipientError(EmailRecipientErrorCode.UNKNOWN_ERROR, error, {
              userMessage: error,
              retryable: true,
              context: {
                operation: 'external',
                additionalData: { component: 'AdvancedRecipientDialog', source: 'external' },
              },
            })
          : normalizeError(error, {
              operation: 'external',
              additionalData: { component: 'AdvancedRecipientDialog', source: 'external' },
            });

      setErrorState((prev) => ({ ...prev, general: generalError }));
    }
  }, [error]);

  // Note: The contactSelection hook is already initialized with initialSelections from parent
  // so we don't need to manually reset on open - it starts with the correct state

  // Effect to clear retry count when dialog closes
  useEffect(() => {
    if (!open) {
      setRetryCount(0);
      setLoadingState({
        contacts: false,
        teamGroups: false,
        roleGroups: false,
        applying: false,
      });
      setErrorState({
        contacts: null,
        teamGroups: null,
        roleGroups: null,
        general: null,
      });
    }
  }, [open]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing fetch requests
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
        fetchAbortControllerRef.current = null;
      }

      // Clear selected contacts cache to prevent memory leaks
      setSelectedContactsCache(new Map());

      // Clear search contacts to prevent memory leaks
      setSearchContacts([]);
    };
  }, []);

  // Show loading dialog if completely loading
  if (loading && !hasAnyData) {
    return (
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        aria-labelledby="recipient-dialog-title"
      >
        <RecipientDialogSkeleton showTabs={true} showPreview={!isMobile} />
      </Dialog>
    );
  }

  // Show error dialog if major error and no data
  if (errorState.general && !hasAnyData) {
    return (
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        aria-labelledby="recipient-dialog-error-title"
      >
        <DialogTitle id="recipient-dialog-error-title">
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="error" />
            <Typography variant="h6">Error Loading Recipients</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Failed to Load Data</AlertTitle>
            {errorState.general.userMessage || errorState.general.message}
          </Alert>

          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              We encountered an error while loading recipient data. This could be due to:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Network connectivity issues</li>
              <li>Server temporarily unavailable</li>
              <li>Insufficient permissions</li>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Close</Button>
          {onRetry && retryCount < maxRetries && (
            <Button onClick={handleRetry} variant="contained" startIcon={<RefreshIcon />}>
              Retry ({retryCount}/{maxRetries})
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="recipient-dialog-title"
      aria-describedby="recipient-dialog-description"
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '80vh',
          minHeight: 600,
          maxHeight: 800,
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" id="recipient-dialog-title">
            Advanced Recipient Selection
          </Typography>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<PersonIcon />} label="Contacts" value="contacts" iconPosition="start" />
          <Tab icon={<GroupsIcon />} label="Groups" value="groups" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        {/* General Error Alert */}
        {errorState.general && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              onClose={() => clearError('general')}
              action={
                onRetry && retryCount < maxRetries && errorState.general?.retryable ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRetry}
                    startIcon={<RefreshIcon />}
                  >
                    Retry
                  </Button>
                ) : undefined
              }
            >
              <AlertTitle>Error</AlertTitle>
              {errorState.general.userMessage || errorState.general.message}
            </Alert>
          </Box>
        )}

        {/* Season Loading Indicator */}
        {!seasonId && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading season data...
            </Typography>
          </Box>
        )}

        {/* No Data Available */}
        {!hasAnyData && !isGeneralLoading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Recipients Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              There are no contacts, teams, or roles available for selection. This might be because:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <li>No contacts have been added to your account yet</li>
              <li>You do not have permission to view recipient data</li>
              <li>The data is still loading</li>
            </Box>
            {onRetry && (
              <Button
                onClick={handleRetry}
                variant="outlined"
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                Refresh Data
              </Button>
            )}
          </Box>
        )}

        {/* Main Content */}
        {hasAnyData && (
          <Stack direction="row" sx={{ height: '100%' }}>
            {/* Main Selection Panel */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Contacts Tab - Now using ContactSelectionTable with local state */}
              {currentTab === 'contacts' && (
                <ContactsTabContent
                  errorState={errorState}
                  isMobile={isMobile}
                  clearError={clearError}
                  contacts={currentPageContacts}
                  selectedGroups={selectedGroups}
                  unifiedActions={unifiedActions}
                  isLoading={paginationLoading}
                  paginationError={paginationError}
                  currentPage={isInSearchMode() ? searchCurrentPage : currentPage}
                  _rowsPerPage={rowsPerPage}
                  paginationState={paginationState}
                  paginationHandlers={paginationHandlers}
                  accountId={accountId}
                  searchContacts={searchContacts}
                  setSearchContacts={setSearchContacts}
                  onSearch={handleSearch}
                />
              )}

              {/* Groups Tab */}
              {currentTab === 'groups' && (
                <HierarchicalGroupSelection
                  accountId={accountId}
                  seasonId={seasonId || ''}
                  itemSelectedState={hierarchicalSelectedIds}
                  managersOnly={hierarchicalManagersOnly}
                  onSelectionChange={handleHierarchicalSelectionChange}
                  loading={loadingState.teamGroups}
                />
              )}
            </Box>

            {/* Preview Panel removed for simplicity - can be re-added later if needed */}
          </Stack>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
          {/* Selection Controls */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              size="small"
              variant={getTotalSelected() > 0 ? 'contained' : 'outlined'}
              onClick={unifiedActions.clearAllRecipients}
              disabled={loadingState.applying || getTotalSelected() === 0}
            >
              Clear All
            </Button>
            <Typography variant="body2" color="text.secondary">
              {getTotalSelected()} selected
            </Typography>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button onClick={handleCancel} color="inherit" disabled={loadingState.applying}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              variant="contained"
              disabled={getTotalSelected() === 0 || loadingState.applying}
              startIcon={loadingState.applying ? <CircularProgress size={20} /> : undefined}
            >
              {loadingState.applying ? 'Applying...' : 'Apply Selection'}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

// Contacts Tab Component
interface ContactsTabContentProps {
  errorState: ErrorState;
  isMobile: boolean;
  clearError: (errorType: keyof ErrorState) => void;
  contacts: RecipientContact[];
  selectedGroups: Map<GroupType, ContactGroup[]>;
  unifiedActions: {
    toggleContact: (contactId: string) => void;
    clearAllRecipients: () => void;
    isContactSelected: (contactId: string) => boolean;
    getTotalSelected: () => number;
  };
  isLoading: boolean;
  paginationError: EmailRecipientError | null;
  currentPage: number;
  _rowsPerPage: number;
  paginationState: {
    hasNext: boolean;
    hasPrev: boolean;
    totalContacts: number;
    totalPages: number;
  };
  paginationHandlers: {
    handleNextPage: () => void;
    handlePrevPage: () => void;
    handleRowsPerPageChange: (newRowsPerPage: number) => void;
  };
  accountId: string;
  // Search state from parent dialog
  searchContacts: RecipientContact[];
  setSearchContacts: (contacts: RecipientContact[]) => void;
  // Search handler from parent dialog
  onSearch?: (query: string) => Promise<void>;
}

const ContactsTabContent: React.FC<ContactsTabContentProps> = ({
  errorState,
  isMobile,
  clearError,
  contacts,
  selectedGroups,
  unifiedActions,
  isLoading,
  paginationError,
  currentPage,
  _rowsPerPage,
  paginationState,
  paginationHandlers,
  accountId: _accountId,
  searchContacts,
  setSearchContacts,
  onSearch,
}) => {
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchContacts([]);
    setSearchError(null);
    setSearchQuery('');
  }, [setSearchContacts]);

  // Handle search query change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Effect to trigger search when search query changes (with debouncing)
  useEffect(() => {
    const trimmedQuery = searchQuery?.trim();

    if (!trimmedQuery) {
      setSearchContacts([]);
      setSearchError(null);
      return;
    }

    if (onSearch) {
      const timeoutId = setTimeout(() => {
        onSearch(trimmedQuery).catch((error) => {
          console.error('Search failed:', error);
          setSearchError(error instanceof Error ? error.message : 'Search failed');
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, onSearch, setSearchContacts]);

  // Determine which contacts to display - use searchContacts when there's an active search
  const displayContacts = useMemo(() => {
    if (searchQuery?.trim() && searchContacts.length > 0) {
      return searchContacts;
    }
    return contacts;
  }, [searchQuery, searchContacts, contacts]);

  // Check if we have search results
  const hasSearchResults = Boolean(searchQuery?.trim() && searchContacts.length > 0);

  return (
    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {errorState.contacts && (
        <Box sx={{ p: 2 }}>
          <Alert severity="warning" onClose={() => clearError('contacts')}>
            {errorState.contacts.userMessage || errorState.contacts.message}
          </Alert>
        </Box>
      )}

      {paginationError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => {}}>
            Pagination Error: {paginationError.userMessage || paginationError.message}
          </Alert>
        </Box>
      )}

      {searchError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => setSearchError(null)}>
            Search Error: {searchError}
          </Alert>
        </Box>
      )}

      <ContactSelectionPanel
        contacts={displayContacts}
        selectedContactIds={selectedGroups.get('individuals')?.[0]?.contactIds || new Set()}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onContactToggle={unifiedActions.toggleContact}
        onSelectAll={() => {
          /* TODO: Handle select all */
        }}
        onClearAll={unifiedActions.clearAllRecipients}
        currentPage={currentPage}
        hasNext={paginationState.hasNext}
        hasPrev={paginationState.hasPrev}
        loading={isLoading}
        onNextPage={paginationHandlers.handleNextPage}
        onPrevPage={paginationHandlers.handlePrevPage}
        onRowsPerPageChange={paginationHandlers.handleRowsPerPageChange}
        rowsPerPage={_rowsPerPage}
        error={searchError}
        compact={isMobile}
        searchResultsMessage={
          hasSearchResults ? (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Showing search results for &ldquo;{searchQuery}&rdquo;
              </Typography>
              <Button size="small" onClick={handleClearSearch} variant="outlined">
                Clear Search
              </Button>
            </Stack>
          ) : undefined
        }
      />
    </Box>
  );
};

export default AdvancedRecipientDialogWithProvider;
