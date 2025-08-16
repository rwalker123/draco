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
  Star as StarIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { useNotifications } from '../../../hooks/useNotifications';
import ContactSelectionPanel from './ContactSelectionPanel';
import GroupSelectionPanel from './GroupSelectionPanel';
import { useEmailCompose } from '../compose/EmailComposeProvider';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { GroupListSkeleton, RecipientDialogSkeleton } from '../../common/SkeletonLoaders';
import {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionState,
} from '../../../types/emails/recipients';
import { EmailRecipientError, EmailRecipientErrorCode } from '../../../types/errors';
import { normalizeError, createEmailRecipientError, safeAsync } from '../../../utils/errorHandling';
import { createEmailRecipientService } from '../../../services/emailRecipientService';
import { useAuth } from '../../../context/AuthContext';
import { transformBackendContact } from '../../../utils/emailRecipientTransformers';

export interface AdvancedRecipientDialogProps {
  open: boolean;
  onClose: () => void;
  onApply?: (recipientState: RecipientSelectionState, selectedContacts: RecipientContact[]) => void;
  accountId: string;
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  initialRecipientState?: RecipientSelectionState;
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

const SELECTED_CONTACTS_CACHE_LIMIT = 100; // Much smaller since we only store selected contacts

type TabValue = 'contacts' | 'groups' | 'quick';

/**
 * AdvancedRecipientDialog - Comprehensive recipient selection interface
 * Provides tabbed interface for individual contacts, groups, and quick selections
 */
const AdvancedRecipientDialog: React.FC<AdvancedRecipientDialogProps> = ({
  open,
  onClose,
  onApply,
  accountId,
  teamGroups,
  roleGroups,
  loading = false,
  error = null,
  onRetry,
  initialRecipientState: _initialRecipientState,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotifications();
  const { token } = useAuth();

  // Use EmailCompose provider which now contains all recipient functionality
  const { state: composeState } = useEmailCompose();

  // Local state for dialog - changes here are only applied when user clicks "Apply"
  const [localRecipientState, setLocalRecipientState] = useState<
    RecipientSelectionState | undefined
  >(undefined);

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

  // Selected contacts cache management functions
  const addContactToSelectedCache = useCallback((contact: RecipientContact) => {
    setSelectedContactsCache((prevCache) => {
      const newCache = new Map(prevCache);
      newCache.set(contact.id, {
        contact,
        selectedTime: Date.now(),
      });

      // Safety net: remove oldest if cache gets too large (shouldn't happen in normal use)
      if (newCache.size > SELECTED_CONTACTS_CACHE_LIMIT) {
        const oldestEntry = Array.from(newCache.entries()).sort(
          (a, b) => a[1].selectedTime - b[1].selectedTime,
        )[0];
        newCache.delete(oldestEntry[0]);
      }

      return newCache;
    });
  }, []);

  const removeContactFromSelectedCache = useCallback((contactId: string) => {
    setSelectedContactsCache((prevCache) => {
      const newCache = new Map(prevCache);
      newCache.delete(contactId);
      return newCache;
    });
  }, []);

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

  const [currentTab, setCurrentTab] = useState<TabValue>('contacts');
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

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalRecipientState(composeState.recipientState);
    }
  }, [open, composeState.recipientState]);

  // Local actions that modify local state only
  const localActions = useMemo(() => {
    const createDefaultState = (): RecipientSelectionState => ({
      selectedContactIds: new Set<string>(),
      allContacts: false,
      selectedTeamGroups: [],
      selectedRoleGroups: [],
      totalRecipients: 0,
      validEmailCount: 0,
      invalidEmailCount: 0,
      searchQuery: '',
      activeTab: 'contacts' as const,
    });

    const calculateRecipientCounts = (state: RecipientSelectionState) => {
      let totalRecipients = 0;
      let validEmailCount = 0;
      let invalidEmailCount = 0;

      if (state.allContacts) {
        // For "all contacts", we need the total count from server
        // This is a complex case that would require additional API support
        totalRecipients = state.selectedContactIds.size; // Temporary fallback
        validEmailCount = totalRecipients; // Assume valid for now
        invalidEmailCount = 0;
      } else {
        // Count selected contact IDs and check their validity using hybrid lookup
        totalRecipients = state.selectedContactIds.size;

        // Check email validity for selected contacts
        let valid = 0;
        let invalid = 0;

        state.selectedContactIds.forEach((contactId) => {
          const contact = getContactDetails(contactId);
          if (contact) {
            if (contact.hasValidEmail) {
              valid++;
            } else {
              invalid++;
            }
          } else {
            // If contact not found anywhere, assume valid (could be from a previous session)
            valid++;
          }
        });

        validEmailCount = valid;
        invalidEmailCount = invalid;
      }

      // TODO: Add team and role group members to counts

      return { totalRecipients, validEmailCount, invalidEmailCount };
    };

    return {
      toggleContact: (contactId: string) => {
        // Get contact details using hybrid lookup
        const contact = getContactDetails(contactId);
        if (!contact || !contact.hasValidEmail) {
          return; // Don't allow selection of contacts without valid email
        }

        setLocalRecipientState((prev) => {
          const current = prev || createDefaultState();
          const newSelectedContactIds = new Set(current.selectedContactIds);

          if (newSelectedContactIds.has(contactId)) {
            // Deselecting: remove from selection and cache
            newSelectedContactIds.delete(contactId);
            removeContactFromSelectedCache(contactId);
          } else {
            // Selecting: add to selection and cache
            newSelectedContactIds.add(contactId);
            addContactToSelectedCache(contact);
          }

          const newState = {
            ...current,
            selectedContactIds: newSelectedContactIds,
            allContacts: false, // Deselect "all contacts" when manually selecting individuals
          };

          const counts = calculateRecipientCounts(newState);
          return { ...newState, ...counts };
        });
      },

      selectAllContacts: () => {
        setLocalRecipientState((prev) => {
          const current = prev || createDefaultState();
          const newState = {
            ...current,
            allContacts: true,
            selectedContactIds: new Set<string>(),
            selectedTeamGroups: [],
            selectedRoleGroups: [],
          };

          const counts = calculateRecipientCounts(newState);
          return { ...newState, ...counts };
        });
      },

      clearAllRecipients: () => {
        setLocalRecipientState((prev) => {
          const current = prev || createDefaultState();
          const newState = {
            ...current,
            selectedContactIds: new Set<string>(),
            allContacts: false,
            selectedTeamGroups: [],
            selectedRoleGroups: [],
          };

          const counts = calculateRecipientCounts(newState);
          return { ...newState, ...counts };
        });
      },

      setRecipientSearchQuery: (query: string) => {
        setLocalRecipientState((prev) => {
          const current = prev || createDefaultState();
          return { ...current, searchQuery: query };
        });
      },
    };
  }, [getContactDetails, addContactToSelectedCache, removeContactFromSelectedCache]);

  // Function to check if we're in search mode - more reliable check
  const isInSearchMode = useCallback(() => {
    return Boolean(
      localRecipientState?.searchQuery?.trim() && searchContacts.length > 0 && hasSearched,
    );
  }, [localRecipientState?.searchQuery, searchContacts.length, hasSearched]);

  // Server-side pagination handlers
  const paginationHandlers = useMemo(
    () => ({
      handleNextPage: () => {
        // Check if we're showing search results using reliable method
        if (isInSearchMode()) {
          // Handle search pagination
          if (searchPaginationState.hasNext && !paginationLoading) {
            handleSearchWithPagination(
              localRecipientState!.searchQuery,
              searchCurrentPage + 1,
              rowsPerPage,
            );
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
            handleSearchWithPagination(
              localRecipientState!.searchQuery,
              searchCurrentPage - 1,
              rowsPerPage,
            );
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
          handleSearchWithPagination(localRecipientState!.searchQuery, 1, newRowsPerPage);
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
      localRecipientState,
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

  // Handle apply selection
  const handleApply = useCallback(() => {
    if (!onApply) {
      // Fallback behavior if no onApply callback provided
      const totalRecipients = localRecipientState?.totalRecipients || 0;
      showNotification(`Applied selection: ${totalRecipients} recipients`, 'success');
      onClose();
      return;
    }

    // Apply the local state to the global EmailCompose state
    if (localRecipientState) {
      // Get selected contact details using hybrid lookup
      const selectedContactDetails: RecipientContact[] = [];

      localRecipientState.selectedContactIds.forEach((contactId) => {
        const contact = getContactDetails(contactId);
        if (contact) {
          selectedContactDetails.push(contact);
        }
      });

      onApply(localRecipientState, selectedContactDetails);
    }
    onClose();
  }, [onApply, localRecipientState, getContactDetails, showNotification, onClose]);

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
          <Tab icon={<StarIcon />} label="Quick Select" value="quick" iconPosition="start" />
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
                  localRecipientState={localRecipientState}
                  localActions={localActions}
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
                <GroupsTabContent
                  teamGroups={teamGroups}
                  roleGroups={roleGroups}
                  errorState={errorState}
                  loadingState={loadingState}
                  isMobile={isMobile}
                  hasTeamGroups={hasTeamGroups}
                  hasRoleGroups={hasRoleGroups}
                  clearError={clearError}
                />
              )}

              {/* Quick Select Tab */}
              {currentTab === 'quick' && (
                <QuickSelectTabContent
                  contacts={composeState.contacts}
                  teamGroups={teamGroups}
                  roleGroups={roleGroups}
                  loadingState={loadingState}
                  hasContacts={hasContacts}
                  hasTeamGroups={hasTeamGroups}
                  hasRoleGroups={hasRoleGroups}
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
              variant={(localRecipientState?.totalRecipients || 0) > 0 ? 'contained' : 'outlined'}
              onClick={localActions.clearAllRecipients}
              disabled={loadingState.applying || (localRecipientState?.totalRecipients || 0) === 0}
            >
              Clear All
            </Button>
            <Typography variant="body2" color="text.secondary">
              {localRecipientState?.totalRecipients || 0} selected
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
              disabled={(localRecipientState?.totalRecipients || 0) === 0 || loadingState.applying}
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
  localRecipientState: RecipientSelectionState | undefined;
  localActions: {
    toggleContact: (contactId: string) => void;
    selectAllContacts: () => void;
    clearAllRecipients: () => void;
    setRecipientSearchQuery: (query: string) => void;
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
  localRecipientState,
  localActions,
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

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchContacts([]);
    setSearchError(null);
    localActions.setRecipientSearchQuery('');
  }, [localActions, setSearchContacts]);

  // Handle search query change
  const handleSearchChange = useCallback(
    (query: string) => {
      localActions.setRecipientSearchQuery(query);
    },
    [localActions],
  );

  // Effect to trigger search when search query changes (with debouncing)
  useEffect(() => {
    const searchQuery = localRecipientState?.searchQuery?.trim();

    if (!searchQuery) {
      setSearchContacts([]);
      setSearchError(null);
      return;
    }

    if (onSearch) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery).catch((error) => {
          console.error('Search failed:', error);
          setSearchError(error instanceof Error ? error.message : 'Search failed');
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [localRecipientState?.searchQuery, onSearch, setSearchContacts]);

  // Determine which contacts to display - use searchContacts when there's an active search
  const displayContacts = useMemo(() => {
    if (localRecipientState?.searchQuery?.trim() && searchContacts.length > 0) {
      return searchContacts;
    }
    return contacts;
  }, [localRecipientState?.searchQuery, searchContacts, contacts]);

  // Check if we have search results
  const hasSearchResults = Boolean(
    localRecipientState?.searchQuery?.trim() && searchContacts.length > 0,
  );

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
        selectedContactIds={localRecipientState?.selectedContactIds || new Set()}
        searchQuery={localRecipientState?.searchQuery || ''}
        onSearchChange={handleSearchChange}
        onContactToggle={localActions.toggleContact}
        onSelectAll={localActions.selectAllContacts}
        onClearAll={localActions.clearAllRecipients}
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
                Showing search results for &ldquo;{localRecipientState?.searchQuery}&rdquo;
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

// Groups Tab Component
interface GroupsTabContentProps {
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  errorState: ErrorState;
  loadingState: LoadingState;
  isMobile: boolean;
  hasTeamGroups: boolean;
  hasRoleGroups: boolean;
  clearError: (errorType: keyof ErrorState) => void;
}

const GroupsTabContent: React.FC<GroupsTabContentProps> = ({
  teamGroups,
  roleGroups,
  errorState,
  loadingState,
  isMobile,
  hasTeamGroups,
  hasRoleGroups,
  clearError,
}) => {
  // TODO: Implement group selection logic using a similar pattern to contactSelection
  const selectedTeamGroups: TeamGroup[] = [];
  const selectedRoleGroups: RoleGroup[] = [];

  const handleTeamGroupToggle = (_group: TeamGroup) => {
    // TODO: Implement team group selection
  };

  const handleRoleGroupToggle = (_group: RoleGroup) => {
    // TODO: Implement role group selection
  };

  return (
    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {(errorState.teamGroups || errorState.roleGroups) && (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="warning"
            onClose={() => {
              clearError('teamGroups');
              clearError('roleGroups');
            }}
          >
            {errorState.teamGroups?.userMessage ||
              errorState.teamGroups?.message ||
              errorState.roleGroups?.userMessage ||
              errorState.roleGroups?.message}
          </Alert>
        </Box>
      )}

      {loadingState.teamGroups || loadingState.roleGroups ? (
        <Box sx={{ p: 3 }}>
          <GroupListSkeleton count={4} compact={isMobile} />
        </Box>
      ) : hasTeamGroups || hasRoleGroups ? (
        <ErrorBoundary
          componentName="GroupSelectionPanel"
          fallback={
            <Alert severity="error" sx={{ m: 2 }}>
              <AlertTitle>Group Selection Unavailable</AlertTitle>
              The group selection panel encountered an error. Please try refreshing the dialog.
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => window.location.reload()}
                variant="outlined"
              >
                Refresh Page
              </Button>
            </Alert>
          }
          onError={(error) => {
            console.error('GroupSelectionPanel error:', error);
          }}
        >
          <GroupSelectionPanel
            teamGroups={teamGroups}
            roleGroups={roleGroups}
            selectedTeamGroups={selectedTeamGroups}
            selectedRoleGroups={selectedRoleGroups}
            onTeamGroupToggle={handleTeamGroupToggle}
            onRoleGroupToggle={handleRoleGroupToggle}
            compact={isMobile}
          />
        </ErrorBoundary>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Groups Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No team or role groups are available for selection.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Quick Select Tab Component
interface QuickSelectTabContentProps {
  contacts: RecipientContact[];
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  loadingState: LoadingState;
  hasContacts: boolean;
  hasTeamGroups: boolean;
  hasRoleGroups: boolean;
}

const QuickSelectTabContent: React.FC<QuickSelectTabContentProps> = ({
  contacts,
  loadingState,
  hasContacts,
  hasTeamGroups,
  hasRoleGroups,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Quick Selection Options
      </Typography>
      <Stack spacing={2}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => {
            /* TODO: Implement quick select all */
          }}
          fullWidth
          disabled={!hasContacts || loadingState.contacts}
          startIcon={loadingState.contacts ? <CircularProgress size={20} /> : undefined}
        >
          Select All Contacts ({hasContacts ? contacts.length : 0})
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={() => {
            /* TODO: Implement quick select managers */
          }}
          fullWidth
          disabled={!hasTeamGroups || loadingState.teamGroups}
          startIcon={loadingState.teamGroups ? <CircularProgress size={20} /> : undefined}
        >
          Select All Team Managers
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={() => {
            /* TODO: Implement quick select admins */
          }}
          fullWidth
          disabled={!hasRoleGroups || loadingState.roleGroups}
          startIcon={loadingState.roleGroups ? <CircularProgress size={20} /> : undefined}
        >
          Select All Administrators
        </Button>

        {/* Help text for empty states */}
        {!hasContacts && !hasTeamGroups && !hasRoleGroups && (
          <Alert severity="info">
            <AlertTitle>No Data Available</AlertTitle>
            Quick selections are not available because no recipient data has been loaded.
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default AdvancedRecipientDialog;
