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
  Checkbox,
  Switch,
  Chip,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  SportsMartialArts as SportsMartialArtsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

import { useNotifications } from '../../../hooks/useNotifications';
import { useHierarchicalData } from '../../../hooks/useHierarchicalData';
import { useHierarchicalMaps } from '../../../hooks/useHierarchicalMaps';
import ContactSelectionPanel from './ContactSelectionPanel';
import HierarchicalGroupSelection from './HierarchicalGroupSelection';
import { ManagerStateProvider } from './context/ManagerStateContext';
// import { ErrorBoundary } from '../../common/ErrorBoundary'; // TODO: Re-enable when needed
import { RecipientDialogSkeleton } from '../../common/SkeletonLoaders';
import {
  RecipientContact,
  GroupType,
  ContactGroup,
  RecipientSelectionTab,
  HierarchicalSelectionItem,
  HierarchicalSelectionState,
  convertHierarchicalToContactGroups,
  WorkoutRecipientSelection,
  TeamsWantedRecipientSelection,
  UmpireRecipientSelection,
} from '../../../types/emails/recipients';

// Simplified RecipientSelectionState for backward compatibility
interface SimplifiedRecipientSelectionState {
  selectedGroups?: Map<GroupType, ContactGroup[]>;
  selectedWorkoutRecipients?: WorkoutRecipientSelection[];
  selectedTeamsWantedRecipients?: TeamsWantedRecipientSelection[];
  selectedUmpireRecipients?: UmpireRecipientSelection[];
  workoutManagersOnly?: boolean;
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
import {
  getWorkout,
  listWorkouts,
  listWorkoutRegistrations,
} from '../../../services/workoutService';
import { playerClassifiedService } from '../../../services/playerClassifiedService';
import {
  WorkoutRegistrationType,
  WorkoutSummaryType,
  TeamsWantedPublicClassifiedType,
  WorkoutStatusType,
  UmpireType,
} from '@draco/shared-schemas';
import { useUmpireService } from '../../../hooks/useUmpireService';

type WorkoutWithRegistrants = WorkoutSummaryType & { registrants: WorkoutRegistrationType[] };

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
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  initialSelectedGroups?: Map<GroupType, ContactGroup[]>;
  initialWorkoutRecipients?: WorkoutRecipientSelection[];
  initialWorkoutManagersOnly?: boolean;
  initialTeamsWantedRecipients?: TeamsWantedRecipientSelection[];
  initialUmpireRecipients?: UmpireRecipientSelection[];
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

type TabValue = 'contacts' | 'season' | 'workouts' | 'teamsWanted' | 'umpires';

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
  loading = false,
  error = null,
  onRetry,
  initialSelectedGroups,
  initialWorkoutRecipients,
  initialWorkoutManagersOnly,
  initialTeamsWantedRecipients,
  initialUmpireRecipients,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotifications();
  const { token } = useAuth();
  const { listUmpires } = useUmpireService(accountId);

  // Use EmailCompose provider which now contains all recipient functionality

  // Access manager state for converting manager IDs to contact details
  // Manager state no longer needed since 'managers' is not a group type
  // const { state: managerState } = useManagerStateContext();

  // Hierarchical data for converting hierarchical selections to ContactGroups
  const { hierarchicalData, loadHierarchicalData } = useHierarchicalData();

  // Hierarchy mapping
  const hierarchyMaps = useHierarchicalMaps(hierarchicalData, seasonId || '');

  // UNIFIED GROUP SYSTEM - Single source of truth for all selections
  const [selectedGroups, setSelectedGroups] = useState<Map<GroupType, ContactGroup[]>>(new Map());

  const [selectedWorkoutRegistrantIds, setSelectedWorkoutRegistrantIds] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [selectedTeamsWantedIds, setSelectedTeamsWantedIds] = useState<Set<string>>(new Set());
  const [activeWorkouts, setActiveWorkouts] = useState<WorkoutWithRegistrants[]>([]);
  const [recentPastWorkouts, setRecentPastWorkouts] = useState<WorkoutWithRegistrants[]>([]);
  const [loadedOlderWorkouts, setLoadedOlderWorkouts] = useState<WorkoutWithRegistrants[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  const [workoutManagersOnly, setWorkoutManagersOnly] = useState<boolean>(
    initialWorkoutManagersOnly ?? false,
  );
  const [pastWorkoutsLoading, setPastWorkoutsLoading] = useState(false);
  const [pastWorkoutsError, setPastWorkoutsError] = useState<string | null>(null);
  const [olderWorkoutsOptions, setOlderWorkoutsOptions] = useState<WorkoutSummaryType[]>([]);
  const [olderWorkoutsLoading, setOlderWorkoutsLoading] = useState(false);
  const [olderWorkoutsError, setOlderWorkoutsError] = useState<string | null>(null);
  const [selectedOlderWorkoutId, setSelectedOlderWorkoutId] = useState('');
  const [teamsWanted, setTeamsWanted] = useState<TeamsWantedPublicClassifiedType[]>([]);
  const [teamsWantedLoading, setTeamsWantedLoading] = useState(false);
  const [teamsWantedError, setTeamsWantedError] = useState<string | null>(null);
  const [umpires, setUmpires] = useState<UmpireType[]>([]);
  const [selectedUmpireIds, setSelectedUmpireIds] = useState<Set<string>>(new Set());
  const [umpiresLoading, setUmpiresLoading] = useState(false);
  const [umpiresError, setUmpiresError] = useState<string | null>(null);

  // Hierarchical selection state for shared data model
  const [hierarchicalSelectedIds, setHierarchicalSelectedIds] = useState<
    Map<string, HierarchicalSelectionItem>
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
            ids: new Set(),
            managersOnly: false,
            totalCount: 0,
          };
          existingGroups.push(targetGroup);
        }

        // Add contact to group (targetGroup is guaranteed to exist here)
        if (targetGroup) {
          targetGroup.ids.add(contactId);
          targetGroup.totalCount = targetGroup.ids.size;
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
          const newIds = new Set(group.ids);
          newIds.delete(contactId);

          return {
            ...group,
            ids: newIds,
            totalCount: newIds.size,
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
      return groups.some((group) => group.ids.has(contactId));
    },
    [selectedGroups],
  );

  const workoutSelectionCount = useMemo(() => {
    let total = 0;
    selectedWorkoutRegistrantIds.forEach((ids) => {
      total += ids.size;
    });
    return total;
  }, [selectedWorkoutRegistrantIds]);

  const teamsWantedSelectionCount = useMemo(
    () => selectedTeamsWantedIds.size,
    [selectedTeamsWantedIds],
  );

  const umpireSelectionCount = useMemo(() => selectedUmpireIds.size, [selectedUmpireIds]);

  const getTotalSelected = useCallback((): number => {
    let total = 0;

    // Add counts from selectedGroups (individual/manual selections)
    selectedGroups.forEach((groups) => {
      groups.forEach((group) => {
        total += group.totalCount;
      });
    });

    // Add counts from hierarchical selections - ONLY use season-level count
    // The season level already contains the accurate rolled-up total of all selected players
    if (seasonId) {
      const seasonSelection = hierarchicalSelectedIds.get(seasonId);
      if (
        seasonSelection &&
        (seasonSelection.state === 'selected' || seasonSelection.state === 'intermediate')
      ) {
        total += seasonSelection.playerCount;
      }
    }

    total += workoutSelectionCount;
    total += teamsWantedSelectionCount;
    total += umpireSelectionCount;

    return total;
  }, [
    selectedGroups,
    hierarchicalSelectedIds,
    seasonId,
    workoutSelectionCount,
    teamsWantedSelectionCount,
    umpireSelectionCount,
  ]);

  // Hierarchical selection change handler
  const handleHierarchicalSelectionChange = useCallback(
    (itemSelectedState: Map<string, HierarchicalSelectionItem>, managersOnly: boolean) => {
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
            seasonId: seasonId || undefined,
          });

          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }

          const recipientContacts: RecipientContact[] = result.contacts.map((contact) => ({
            ...contact,
            displayName: contact.firstName + ' ' + contact.lastName,
            hasValidEmail: !!contact.email,
          }));

          setCurrentPageContacts(recipientContacts);

          // Note: We no longer add all contacts to cache here
          // Only selected contacts are cached when user selects them

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
    [emailRecipientService, token, accountId, seasonId, showNotification],
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
          page: page, // Backend uses 0-based pagination
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

          // Properly calculate pagination state from search results
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

  // Load hierarchical data when dialog opens
  useEffect(() => {
    if (open && accountId && seasonId) {
      loadHierarchicalData(accountId, seasonId);
    }
  }, [open, accountId, seasonId, loadHierarchicalData]);

  // Check if seasonId is available when dialog opens
  useEffect(() => {
    if (open && !seasonId) {
      // No seasonId provided, skipping season loading
    }
  }, [open, seasonId]);

  const fetchWorkoutsWithRegistrants = useCallback(
    async (params: {
      status: WorkoutStatusType;
      after?: string;
      before?: string;
      limit?: number;
    }): Promise<WorkoutWithRegistrants[]> => {
      const workouts = await listWorkouts(accountId, true, token ?? undefined, params.status, {
        after: params.after,
        before: params.before,
        limit: params.limit,
      });

      return Promise.all(
        workouts.map(async (workout) => {
          const registrants = await listWorkoutRegistrations(
            accountId,
            workout.id,
            token ?? undefined,
          );

          return { ...workout, registrants } satisfies WorkoutWithRegistrants;
        }),
      );
    },
    [accountId, token],
  );

  const loadActiveWorkouts = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setWorkoutsLoading(true);
    setWorkoutsError(null);

    try {
      const workoutsWithRegistrants = await fetchWorkoutsWithRegistrants({ status: 'upcoming' });
      setActiveWorkouts(workoutsWithRegistrants);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workouts';
      setWorkoutsError(message);
    } finally {
      setWorkoutsLoading(false);
    }
  }, [accountId, fetchWorkoutsWithRegistrants]);

  const loadRecentPastWorkouts = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setPastWorkoutsLoading(true);
    setPastWorkoutsError(null);

    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const workoutsWithRegistrants = await fetchWorkoutsWithRegistrants({
        status: 'past',
        after: twoWeeksAgo.toISOString(),
        limit: 25,
      });
      setRecentPastWorkouts(workoutsWithRegistrants);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recent past workouts';
      setPastWorkoutsError(message);
    } finally {
      setPastWorkoutsLoading(false);
    }
  }, [accountId, fetchWorkoutsWithRegistrants]);

  const loadOlderWorkoutsOptions = useCallback(async () => {
    if (!accountId) {
      return;
    }

    setOlderWorkoutsLoading(true);
    setOlderWorkoutsError(null);

    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const workouts = await listWorkouts(accountId, false, token ?? undefined, 'past', {
        before: twoWeeksAgo.toISOString(),
        limit: 100,
      });
      const sorted = [...workouts].sort(
        (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime(),
      );
      setOlderWorkoutsOptions(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load past workouts list';
      setOlderWorkoutsError(message);
    } finally {
      setOlderWorkoutsLoading(false);
    }
  }, [accountId, token]);

  const loadOlderWorkoutWithRegistrants = useCallback(
    async (workoutId: string) => {
      if (!accountId) {
        return;
      }

      setOlderWorkoutsLoading(true);
      setOlderWorkoutsError(null);

      try {
        const [workout, registrants] = await Promise.all([
          getWorkout(accountId, workoutId, token ?? undefined),
          listWorkoutRegistrations(accountId, workoutId, token ?? undefined),
        ]);
        const workoutWithRegistrants: WorkoutWithRegistrants = {
          ...workout,
          registrants,
        };

        setLoadedOlderWorkouts((prev) => {
          const exists = prev.some((item) => item.id === workoutId);
          if (exists) {
            return prev;
          }
          return [...prev, workoutWithRegistrants];
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load past workout';
        setOlderWorkoutsError(message);
      } finally {
        setOlderWorkoutsLoading(false);
      }
    },
    [accountId, token],
  );

  const loadTeamsWanted = useCallback(async () => {
    if (!accountId || !token) {
      return;
    }

    setTeamsWantedLoading(true);
    setTeamsWantedError(null);

    try {
      const result = await playerClassifiedService.getTeamsWanted(accountId, undefined, token);
      setTeamsWanted(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Teams Wanted';
      setTeamsWantedError(message);
    } finally {
      setTeamsWantedLoading(false);
    }
  }, [accountId, token]);

  const loadUmpires = useCallback(async () => {
    if (!accountId || !token) {
      return;
    }

    setUmpiresLoading(true);
    setUmpiresError(null);

    try {
      const result = await listUmpires({ limit: 100 });

      if (result.success) {
        setUmpires(result.data.umpires || []);
      } else {
        setUmpiresError(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load umpires';
      setUmpiresError(message);
    } finally {
      setUmpiresLoading(false);
    }
  }, [accountId, token, listUmpires]);

  useEffect(() => {
    if (open) {
      loadActiveWorkouts();
      loadTeamsWanted();
      loadUmpires();
      loadRecentPastWorkouts();
      loadOlderWorkoutsOptions();
    }
  }, [
    open,
    loadActiveWorkouts,
    loadTeamsWanted,
    loadUmpires,
    loadRecentPastWorkouts,
    loadOlderWorkoutsOptions,
  ]);

  const [currentTab, setCurrentTab] = useState<TabValue>('contacts');

  // Initialize unified groups when dialog opens
  useEffect(() => {
    if (open) {
      // Initialize with provided groups or empty if none provided
      setSelectedGroups(initialSelectedGroups || new Map());

      if (!initialSelectedGroups || initialSelectedGroups.size === 0) {
        setSelectedWorkoutRegistrantIds(new Map());
      }
      if (initialTeamsWantedRecipients && initialTeamsWantedRecipients.length > 0) {
        setSelectedTeamsWantedIds(
          new Set(initialTeamsWantedRecipients.map((item) => item.classifiedId)),
        );
      } else {
        setSelectedTeamsWantedIds(new Set());
      }
      if (initialUmpireRecipients && initialUmpireRecipients.length > 0) {
        setSelectedUmpireIds(new Set(initialUmpireRecipients.map((item) => item.umpireId)));
      } else {
        setSelectedUmpireIds(new Set());
      }

      // Reset hierarchical selections when parent state is cleared
      if (!initialSelectedGroups || initialSelectedGroups.size === 0) {
        setHierarchicalSelectedIds(new Map());
        setHierarchicalManagersOnly(false);
      }
    }
  }, [open, initialSelectedGroups, initialTeamsWantedRecipients, initialUmpireRecipients]);

  useEffect(() => {
    if (open && initialWorkoutManagersOnly) {
      setWorkoutManagersOnly(true);
    }
  }, [open, initialWorkoutManagersOnly]);

  const allWorkoutsMap = useMemo(() => {
    const map = new Map<string, WorkoutWithRegistrants>();
    [...recentPastWorkouts, ...activeWorkouts, ...loadedOlderWorkouts].forEach((workout) => {
      if (!map.has(workout.id)) {
        map.set(workout.id, workout);
      }
    });
    return map;
  }, [activeWorkouts, recentPastWorkouts, loadedOlderWorkouts]);

  const allWorkouts = useMemo(
    () =>
      Array.from(allWorkoutsMap.values()).sort(
        (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime(),
      ),
    [allWorkoutsMap],
  );
  useEffect(() => {
    if (!open || !initialWorkoutRecipients || initialWorkoutRecipients.length === 0) {
      return;
    }

    setSelectedWorkoutRegistrantIds((prev) => {
      if (prev.size > 0 && !allWorkouts.length) {
        return prev;
      }

      const next = new Map<string, Set<string>>();

      initialWorkoutRecipients.forEach((selection) => {
        const workout = allWorkouts.find((item) => item.id === selection.workoutId);
        if (!workout || workout.registrants.length === 0) {
          return;
        }

        const ids =
          selection.registrationIds && selection.registrationIds.size > 0
            ? new Set(Array.from(selection.registrationIds))
            : new Set(workout.registrants.map((registrant) => registrant.id));

        next.set(workout.id, ids);
      });

      return next;
    });
  }, [open, initialWorkoutRecipients, allWorkouts]);

  const visibleWorkouts = useMemo(() => {
    if (!workoutManagersOnly) {
      return allWorkouts;
    }
    return allWorkouts.map((workout) => ({
      ...workout,
      registrants: workout.registrants.filter((registrant) => registrant.isManager),
    }));
  }, [allWorkouts, workoutManagersOnly]);

  useEffect(() => {
    if (!workoutManagersOnly) {
      return;
    }
    setSelectedWorkoutRegistrantIds((prev) => {
      const next = new Map<string, Set<string>>();
      visibleWorkouts.forEach((workout) => {
        if (workout.registrants.length === 0) {
          return;
        }
        const existingIds = prev.get(workout.id) ?? new Set<string>();
        const allowedIds = new Set(workout.registrants.map((registrant) => registrant.id));
        const filteredIds = new Set(Array.from(existingIds).filter((id) => allowedIds.has(id)));
        if (filteredIds.size > 0) {
          next.set(workout.id, filteredIds);
        }
      });
      return next;
    });
  }, [workoutManagersOnly, visibleWorkouts]);

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

      clearAllRecipients: () => {
        setSelectedGroups(new Map());
        setHierarchicalSelectedIds(new Map()); // Clear hierarchical selections
        setHierarchicalManagersOnly(false); // Reset managers-only toggle
        setSelectedWorkoutRegistrantIds(new Map());
        setSelectedTeamsWantedIds(new Set());
        setSelectedUmpireIds(new Set());
      },

      isContactSelected: (contactId: string): boolean => {
        // Check all group types, not just individuals
        for (const [, groups] of selectedGroups) {
          if (groups && groups.some((group) => group.ids.has(contactId))) {
            return true;
          }
        }
        return false;
      },

      getTotalSelected,
    }),
    [
      getContactDetails,
      isContactInGroup,
      removeFromGroup,
      addToGroup,
      getTotalSelected,
      selectedGroups,
    ],
  );

  const handleToggleAllWorkouts = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedWorkoutRegistrantIds(new Map());
        return;
      }

      const next = new Map<string, Set<string>>();
      visibleWorkouts.forEach((workout) => {
        if (workout.registrants.length > 0) {
          next.set(workout.id, new Set(workout.registrants.map((registrant) => registrant.id)));
        }
      });
      setSelectedWorkoutRegistrantIds(next);
    },
    [visibleWorkouts],
  );

  const handleToggleWorkout = useCallback(
    (workoutId: string, checked: boolean) => {
      setSelectedWorkoutRegistrantIds((prev) => {
        const next = new Map(prev);
        const workout = visibleWorkouts.find((item) => item.id === workoutId);
        if (!workout) {
          return prev;
        }

        if (checked) {
          next.set(workoutId, new Set(workout.registrants.map((registrant) => registrant.id)));
        } else {
          next.delete(workoutId);
        }

        return next;
      });
    },
    [visibleWorkouts],
  );

  const handleToggleRegistrant = useCallback(
    (workoutId: string, registrantId: string, checked: boolean) => {
      setSelectedWorkoutRegistrantIds((prev) => {
        const next = new Map(prev);
        const ids = new Set(next.get(workoutId) ?? []);

        if (checked) {
          ids.add(registrantId);
        } else {
          ids.delete(registrantId);
        }

        if (ids.size > 0) {
          next.set(workoutId, ids);
        } else {
          next.delete(workoutId);
        }

        return next;
      });
    },
    [],
  );

  const handleWorkoutManagersOnlyToggle = useCallback(
    (checked: boolean) => {
      setWorkoutManagersOnly(checked);
      if (checked) {
        setSelectedWorkoutRegistrantIds((prev) => {
          const next = new Map<string, Set<string>>();
          visibleWorkouts.forEach((workout) => {
            if (workout.registrants.length === 0) {
              return;
            }
            const existingIds = prev.get(workout.id) ?? new Set<string>();
            const allowedIds = new Set(
              workout.registrants
                .filter((registrant) => registrant.isManager)
                .map((registrant) => registrant.id),
            );
            const filteredIds = new Set(Array.from(existingIds).filter((id) => allowedIds.has(id)));
            if (filteredIds.size > 0) {
              next.set(workout.id, filteredIds);
            }
          });
          return next;
        });
      }
    },
    [visibleWorkouts],
  );

  const handleToggleAllTeamsWanted = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedTeamsWantedIds(new Set());
        return;
      }
      setSelectedTeamsWantedIds(new Set(teamsWanted.map((item) => item.id)));
    },
    [teamsWanted],
  );

  const handleToggleTeamsWanted = useCallback((classifiedId: string, checked: boolean) => {
    setSelectedTeamsWantedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(classifiedId);
      } else {
        next.delete(classifiedId);
      }
      return next;
    });
  }, []);

  const handleToggleAllUmpires = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedUmpireIds(new Set());
        return;
      }
      // Only select umpires with valid email addresses
      const umpiresWithEmail = umpires.filter((umpire) => umpire.email?.trim());
      setSelectedUmpireIds(new Set(umpiresWithEmail.map((item) => item.id)));
    },
    [umpires],
  );

  const handleToggleUmpire = useCallback((umpireId: string, checked: boolean) => {
    setSelectedUmpireIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(umpireId);
      } else {
        next.delete(umpireId);
      }
      return next;
    });
  }, []);

  const handleOlderWorkoutSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const workoutId = event.target.value;
      setSelectedOlderWorkoutId(workoutId);
      if (workoutId) {
        void loadOlderWorkoutWithRegistrants(workoutId);
      }
    },
    [loadOlderWorkoutWithRegistrants],
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

  const totalWorkoutRegistrants = useMemo(
    () => visibleWorkouts.reduce((sum, workout) => sum + workout.registrants.length, 0),
    [visibleWorkouts],
  );

  const hasWorkouts = useMemo(() => allWorkouts.length > 0, [allWorkouts]);

  // Data availability checks - use server-loaded contacts
  const hasContacts = useMemo(
    () => Array.isArray(currentPageContacts) && currentPageContacts.length > 0,
    [currentPageContacts],
  );
  const hasTeamsWanted = useMemo(() => teamsWanted.length > 0, [teamsWanted]);
  const hasUmpires = useMemo(() => umpires.length > 0, [umpires]);
  const hasAnyData = hasContacts || hasWorkouts || hasTeamsWanted || hasUmpires;

  // Determine overall loading state - include pagination loading
  const isGeneralLoading =
    loading ||
    paginationLoading ||
    workoutsLoading ||
    teamsWantedLoading ||
    Object.values(loadingState).some(Boolean);

  useEffect(() => {
    if (currentTab === 'season' && !seasonId) {
      setCurrentTab(
        hasWorkouts
          ? 'workouts'
          : hasTeamsWanted
            ? 'teamsWanted'
            : hasUmpires
              ? 'umpires'
              : 'contacts',
      );
    } else if (currentTab === 'workouts' && !hasWorkouts) {
      setCurrentTab(
        seasonId ? 'season' : hasTeamsWanted ? 'teamsWanted' : hasUmpires ? 'umpires' : 'contacts',
      );
    } else if (currentTab === 'teamsWanted' && !hasTeamsWanted) {
      setCurrentTab(
        seasonId ? 'season' : hasWorkouts ? 'workouts' : hasUmpires ? 'umpires' : 'contacts',
      );
    } else if (currentTab === 'umpires' && !hasUmpires) {
      setCurrentTab(
        seasonId
          ? 'season'
          : hasWorkouts
            ? 'workouts'
            : hasTeamsWanted
              ? 'teamsWanted'
              : 'contacts',
      );
    }
  }, [currentTab, seasonId, hasWorkouts, hasTeamsWanted, hasUmpires]);

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

    loadActiveWorkouts();
    void loadRecentPastWorkouts();
    void loadOlderWorkoutsOptions();

    showNotification('Retrying...', 'info');
  }, [
    retryCount,
    maxRetries,
    onRetry,
    showNotification,
    loadActiveWorkouts,
    loadRecentPastWorkouts,
    loadOlderWorkoutsOptions,
  ]);

  // Clear specific errors
  const clearError = useCallback((errorType: keyof ErrorState) => {
    setErrorState((prev) => ({ ...prev, [errorType]: null }));
  }, []);

  // Convert hierarchical selections to ContactGroups with priority logic
  const convertHierarchicalSelectionsToContactGroups = useCallback((): Map<
    GroupType,
    ContactGroup[]
  > => {
    if (!hierarchicalData || hierarchicalSelectedIds.size === 0) {
      return new Map();
    }

    // Create hierarchical selection state from the Map format
    const hierarchicalState: HierarchicalSelectionState = {
      selectedSeasonIds: new Set<string>(),
      selectedLeagueIds: new Set<string>(),
      selectedDivisionIds: new Set<string>(),
      selectedTeamIds: new Set<string>(),
      managersOnly: hierarchicalManagersOnly,
    };

    // Convert hierarchical selection map to sets based on item types and selection state
    hierarchicalSelectedIds.forEach((selectionItem, itemId) => {
      // Only include fully selected items (not intermediate/partial selections)
      if (selectionItem.state === 'selected') {
        const itemType = hierarchyMaps.itemTypeMap.get(itemId);

        switch (itemType) {
          case 'season':
            hierarchicalState.selectedSeasonIds.add(itemId);
            break;
          case 'league':
            hierarchicalState.selectedLeagueIds.add(itemId);
            break;
          case 'division':
            hierarchicalState.selectedDivisionIds.add(itemId);
            break;
          case 'team':
            hierarchicalState.selectedTeamIds.add(itemId);
            break;
        }
      }
    });

    // Apply hierarchical priority logic: if a parent is selected, don't include children
    const filteredState: HierarchicalSelectionState = {
      selectedSeasonIds: hierarchicalState.selectedSeasonIds,
      selectedLeagueIds: new Set<string>(),
      selectedDivisionIds: new Set<string>(),
      selectedTeamIds: new Set<string>(),
      managersOnly: hierarchicalState.managersOnly,
    };

    // If season is selected, only include season (highest priority)
    if (hierarchicalState.selectedSeasonIds.size > 0) {
      // Season takes precedence - don't include any child selections
    } else {
      // No season selected, check leagues
      filteredState.selectedLeagueIds = hierarchicalState.selectedLeagueIds;

      // Only include divisions that aren't part of selected leagues
      hierarchicalState.selectedDivisionIds.forEach((divisionId) => {
        const parentLeagueId = hierarchyMaps.parentMap.get(divisionId);
        if (!parentLeagueId || !filteredState.selectedLeagueIds.has(parentLeagueId)) {
          filteredState.selectedDivisionIds.add(divisionId);
        }
      });

      // Only include teams that aren't part of selected leagues or divisions
      hierarchicalState.selectedTeamIds.forEach((teamId) => {
        const parentDivisionId = hierarchyMaps.parentMap.get(teamId);
        const parentLeagueId = parentDivisionId
          ? hierarchyMaps.parentMap.get(parentDivisionId)
          : hierarchyMaps.parentMap.get(teamId);

        const isInSelectedLeague =
          parentLeagueId && filteredState.selectedLeagueIds.has(parentLeagueId);
        const isInSelectedDivision =
          parentDivisionId && filteredState.selectedDivisionIds.has(parentDivisionId);

        if (!isInSelectedLeague && !isInSelectedDivision) {
          filteredState.selectedTeamIds.add(teamId);
        }
      });
    }

    // Use the existing utility function to convert to ContactGroups
    return convertHierarchicalToContactGroups(filteredState, hierarchicalData);
  }, [hierarchicalData, hierarchicalSelectedIds, hierarchicalManagersOnly, hierarchyMaps]);

  // Handle apply selection - UNIFIED SYSTEM ONLY
  const handleApply = useCallback(() => {
    const totalSelected = getTotalSelected();

    const workoutSelections: WorkoutRecipientSelection[] = [];
    selectedWorkoutRegistrantIds.forEach((ids, workoutId) => {
      const workout =
        visibleWorkouts.find((item) => item.id === workoutId) ||
        allWorkouts.find((item) => item.id === workoutId);
      const baseWorkout = allWorkouts.find((item) => item.id === workoutId);
      if (!workout || !baseWorkout) {
        return;
      }

      const totalInScope = workoutManagersOnly
        ? baseWorkout.registrants.filter((registrant) => registrant.isManager).length
        : baseWorkout.registrants.length;
      const shouldOmitRegistrationIds = !workoutManagersOnly && ids.size === totalInScope;

      workoutSelections.push({
        workoutId,
        workoutDesc: workout.workoutDesc,
        workoutDate: workout.workoutDate,
        totalSelected: ids.size,
        managersOnly: workoutManagersOnly,
        registrationIds: shouldOmitRegistrationIds ? undefined : new Set(ids),
      });
    });

    const totalWorkoutSelected = workoutSelections.reduce(
      (sum, selection) => sum + selection.totalSelected,
      0,
    );

    const teamsWantedSelections: TeamsWantedRecipientSelection[] = [];
    selectedTeamsWantedIds.forEach((id) => {
      const classified = teamsWanted.find((item) => item.id === id);
      teamsWantedSelections.push({
        classifiedId: id,
        name: classified?.name,
      });
    });

    const totalTeamsWantedSelected = teamsWantedSelections.length;

    const umpireSelections: UmpireRecipientSelection[] = [];
    selectedUmpireIds.forEach((id) => {
      const umpire = umpires.find((item) => item.id === id);
      umpireSelections.push({
        umpireId: id,
        name: umpire?.displayName,
        email: umpire?.email ?? undefined,
      });
    });

    const totalUmpireSelected = umpireSelections.length;

    // Convert hierarchical selections to ContactGroups and merge with manual selections
    const hierarchicalContactGroups = convertHierarchicalSelectionsToContactGroups();

    // Define which group types are manual (preserved) vs hierarchical (replaced)
    const manualGroupTypes: Set<GroupType> = new Set(['individuals']);
    const hierarchicalGroupTypes: Set<GroupType> = new Set([
      'season',
      'league',
      'division',
      'teams',
    ]);

    // Start with a copy of selectedGroups, but filter out old hierarchical groups
    const mergedContactGroups = new Map<GroupType, ContactGroup[]>();

    // Preserve manual groups from selectedGroups
    selectedGroups.forEach((contactGroups, groupType) => {
      if (manualGroupTypes.has(groupType)) {
        mergedContactGroups.set(groupType, contactGroups);
      }
      // Skip hierarchical groups - they will be replaced with new ones
    });

    // Add/replace hierarchical ContactGroups (replace old hierarchical groups)
    hierarchicalContactGroups.forEach((contactGroups, groupType) => {
      if (contactGroups.length > 0 && hierarchicalGroupTypes.has(groupType)) {
        // Replace any existing hierarchical groups of this type
        mergedContactGroups.set(groupType, contactGroups);
      }
    });

    if (onSelectionAccepted) {
      // New callback pattern - pass merged groups directly
      onSelectionAccepted(mergedContactGroups);
      onClose();
      return;
    }

    if (onApply) {
      // Legacy callback pattern - build contact details and simplified state
      const allSelectedContactDetails: RecipientContact[] = [];
      const allContactIds = new Set<string>();

      // Process all groups in mergedContactGroups (includes both manual and hierarchical)
      mergedContactGroups.forEach((groups) => {
        groups.forEach((group) => {
          group.ids.forEach((contactId) => {
            if (!allContactIds.has(contactId)) {
              allContactIds.add(contactId);

              // Get contact details
              const contact = getContactDetails(contactId);

              // Note: Manager data conversion removed since 'managers' is no longer a group type
              // Managers are handled via the managersOnly flag on hierarchical groups

              if (contact) {
                allSelectedContactDetails.push(contact);
              }
            }
          });
        });
      });

      // Create simplified state for the compose page
      const validContactsCount = allSelectedContactDetails.filter((c) => c.hasValidEmail).length;
      const totalRecipients = allSelectedContactDetails.length + totalWorkoutSelected;
      const validWorkoutCount = totalWorkoutSelected; // assume workout registrants already filtered to valid emails server-side
      const validTeamsWantedCount = totalTeamsWantedSelected; // assume resolved emails will be valid server-side
      const validUmpireCount = totalUmpireSelected; // assume umpire emails are valid
      const simplifiedState: SimplifiedRecipientSelectionState = {
        selectedGroups: mergedContactGroups,
        selectedWorkoutRecipients: workoutSelections,
        selectedTeamsWantedRecipients: teamsWantedSelections,
        selectedUmpireRecipients: umpireSelections,
        workoutManagersOnly,
        totalRecipients: totalRecipients + totalTeamsWantedSelected + totalUmpireSelected,
        validEmailCount:
          validContactsCount + validWorkoutCount + validTeamsWantedCount + validUmpireCount,
        invalidEmailCount:
          totalRecipients +
          totalTeamsWantedSelected +
          totalUmpireSelected -
          (validContactsCount + validWorkoutCount + validTeamsWantedCount + validUmpireCount),
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
    convertHierarchicalSelectionsToContactGroups,
    getTotalSelected,
    getContactDetails,
    showNotification,
    onClose,
    selectedWorkoutRegistrantIds,
    allWorkouts,
    visibleWorkouts,
    workoutManagersOnly,
    selectedTeamsWantedIds,
    teamsWanted,
    selectedUmpireIds,
    umpires,
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
  if (isGeneralLoading && !hasAnyData) {
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
        <DialogTitle
          id="recipient-dialog-error-title"
          sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
        >
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
        <DialogActions
          sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', px: 2, py: 1 }}
        >
          <Button disableElevation onClick={handleCancel}>
            Close
          </Button>
          {onRetry && retryCount < maxRetries && (
            <Button
              disableElevation
              onClick={handleRetry}
              variant="contained"
              startIcon={<RefreshIcon />}
              sx={{
                backgroundImage: 'none',
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark', backgroundImage: 'none' },
              }}
            >
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
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" id="recipient-dialog-title" color="text.primary">
            Advanced Recipient Selection
          </Typography>
          <IconButton onClick={handleCancel} size="small" color="inherit">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, bgcolor: 'background.paper' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<PersonIcon />} label="Contacts" value="contacts" iconPosition="start" />
          {seasonId ? (
            <Tab icon={<GroupsIcon />} label="Season" value="season" iconPosition="start" />
          ) : null}
          {hasWorkouts ? (
            <Tab
              icon={<SportsMartialArtsIcon />}
              label="Workouts"
              value="workouts"
              iconPosition="start"
            />
          ) : null}
          {hasTeamsWanted ? (
            <Tab
              icon={<GroupsIcon />}
              label="Teams Wanted"
              value="teamsWanted"
              iconPosition="start"
            />
          ) : null}
          {hasUmpires ? (
            <Tab icon={<GavelIcon />} label="Umpires" value="umpires" iconPosition="start" />
          ) : null}
        </Tabs>
      </Box>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden', bgcolor: 'background.paper' }}>
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
              There are no contacts, workouts, teams, or roles available for selection. This might
              be because:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <li>No contacts have been added to your account yet</li>
              <li>You do not have permission to view recipient data</li>
              <li>There are no active workouts with registrants available</li>
              <li>The data is still loading</li>
            </Box>
            {onRetry && (
              <Button
                disableElevation
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
          <Stack direction="row" sx={{ height: '100%', bgcolor: 'background.paper' }}>
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

              {/* Season Tab */}
              {currentTab === 'season' && (
                <HierarchicalGroupSelection
                  accountId={accountId}
                  seasonId={seasonId || ''}
                  itemSelectedState={hierarchicalSelectedIds}
                  managersOnly={hierarchicalManagersOnly}
                  onSelectionChange={handleHierarchicalSelectionChange}
                  loading={loadingState.teamGroups}
                />
              )}
              {currentTab === 'workouts' && (
                <Stack spacing={1} sx={{ height: '100%' }}>
                  <Box
                    sx={{
                      px: 2,
                      pt: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Showing upcoming workouts and the past 2 weeks.
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        select
                        size="small"
                        label="Load past workout"
                        value={selectedOlderWorkoutId}
                        onChange={handleOlderWorkoutSelect}
                        sx={{ minWidth: 260 }}
                        disabled={olderWorkoutsLoading || olderWorkoutsOptions.length === 0}
                        helperText={
                          olderWorkoutsError
                            ? olderWorkoutsError
                            : olderWorkoutsOptions.length === 0
                              ? 'No older workouts available'
                              : 'Select a completed workout (older than 2 weeks) to load registrants'
                        }
                      >
                        {olderWorkoutsOptions.map((workout) => (
                          <MenuItem key={workout.id} value={workout.id}>
                            {`${workout.workoutDesc} — ${new Date(workout.workoutDate).toLocaleString()}`}
                          </MenuItem>
                        ))}
                      </TextField>
                      {olderWorkoutsLoading ? <CircularProgress size={18} /> : null}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <WorkoutsTabContent
                      workouts={visibleWorkouts}
                      totalRegistrants={totalWorkoutRegistrants}
                      selectedWorkoutIds={selectedWorkoutRegistrantIds}
                      onToggleAll={handleToggleAllWorkouts}
                      onToggleWorkout={handleToggleWorkout}
                      onToggleRegistrant={handleToggleRegistrant}
                      managersOnly={workoutManagersOnly}
                      onToggleManagersOnly={handleWorkoutManagersOnlyToggle}
                      loading={workoutsLoading || pastWorkoutsLoading}
                      error={workoutsError || pastWorkoutsError}
                    />
                  </Box>
                </Stack>
              )}
              {currentTab === 'teamsWanted' && (
                <TeamsWantedTabContent
                  teamsWanted={teamsWanted}
                  selectedIds={selectedTeamsWantedIds}
                  onToggleAll={handleToggleAllTeamsWanted}
                  onToggle={handleToggleTeamsWanted}
                  loading={teamsWantedLoading}
                  error={teamsWantedError}
                />
              )}
              {currentTab === 'umpires' && (
                <UmpiresTabContent
                  umpires={umpires}
                  selectedIds={selectedUmpireIds}
                  onToggleAll={handleToggleAllUmpires}
                  onToggle={handleToggleUmpire}
                  loading={umpiresLoading}
                  error={umpiresError}
                />
              )}
            </Box>

            {/* Preview Panel removed for simplicity - can be re-added later if needed */}
          </Stack>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
          {/* Selection Controls */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              disableElevation
              size="small"
              variant={getTotalSelected() > 0 ? 'contained' : 'outlined'}
              onClick={unifiedActions.clearAllRecipients}
              disabled={loadingState.applying || getTotalSelected() === 0}
              sx={{
                backgroundImage: 'none',
                ...(getTotalSelected() > 0
                  ? {
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark', backgroundImage: 'none' },
                    }
                  : {}),
              }}
            >
              Clear All
            </Button>
            <Typography variant="body2" color="text.secondary">
              {getTotalSelected()} selected
            </Typography>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              disableElevation
              onClick={handleCancel}
              color="inherit"
              disabled={loadingState.applying}
            >
              Cancel
            </Button>
            <Button
              disableElevation
              onClick={handleApply}
              variant="contained"
              disabled={loadingState.applying}
              startIcon={loadingState.applying ? <CircularProgress size={20} /> : undefined}
              sx={{
                backgroundImage: 'none',
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark', backgroundImage: 'none' },
              }}
            >
              {loadingState.applying ? 'Applying...' : 'Apply Selection'}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

// Workouts Tab Component
interface WorkoutsTabContentProps {
  workouts: WorkoutWithRegistrants[];
  totalRegistrants: number;
  selectedWorkoutIds: Map<string, Set<string>>;
  onToggleAll: (checked: boolean) => void;
  onToggleWorkout: (workoutId: string, checked: boolean) => void;
  onToggleRegistrant: (workoutId: string, registrantId: string, checked: boolean) => void;
  managersOnly: boolean;
  onToggleManagersOnly: (checked: boolean) => void;
  loading: boolean;
  error?: string | null;
}

const WorkoutsTabContent: React.FC<WorkoutsTabContentProps> = ({
  workouts,
  totalRegistrants,
  selectedWorkoutIds,
  onToggleAll,
  onToggleWorkout,
  onToggleRegistrant,
  managersOnly,
  onToggleManagersOnly,
  loading,
  error,
}) => {
  const [rootExpanded, setRootExpanded] = useState(true);
  const [collapsedWorkouts, setCollapsedWorkouts] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((workoutId: string) => {
    setCollapsedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  }, []);

  const selectedCount = useMemo(() => {
    let total = 0;
    selectedWorkoutIds.forEach((ids) => {
      total += ids.size;
    });
    return total;
  }, [selectedWorkoutIds]);

  const allSelected = totalRegistrants > 0 && selectedCount === totalRegistrants;
  const indeterminate = selectedCount > 0 && selectedCount < totalRegistrants;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading workouts...
        </Typography>
      </Box>
    );
  }

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const includeYear = date.getFullYear() !== now.getFullYear();

    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...(includeYear ? { year: 'numeric' } : {}),
    });
  };

  return (
    <Box sx={{ p: 0, overflowY: 'auto', height: '100%' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="h3" color="text.primary">
          Select Workouts & Registrants
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Want to Manage only
          </Typography>
          <Switch
            size="small"
            checked={managersOnly}
            onChange={(event) => onToggleManagersOnly(event.target.checked)}
            inputProps={{ 'aria-label': 'Toggle registrants that would be willing to manager' }}
          />
        </Stack>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.25 }}>
          <IconButton size="small" onClick={() => setRootExpanded((prev) => !prev)}>
            {rootExpanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => onToggleAll(event.target.checked)}
            disabled={totalRegistrants === 0}
            size="small"
            sx={{ p: 0.5 }}
          />
          <GroupsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All displayed workouts
          </Typography>
          <Chip
            label={`${selectedCount}/${totalRegistrants} players`}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>

        {rootExpanded && (
          <>
            {workouts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
                No active workouts with registrants are available.
              </Typography>
            ) : (
              <Stack spacing={0}>
                {workouts.map((workout) => {
                  const selectedIds = selectedWorkoutIds.get(workout.id) ?? new Set<string>();
                  const workoutSelected =
                    selectedIds.size > 0 && selectedIds.size === workout.registrants.length;
                  const workoutIndeterminate =
                    selectedIds.size > 0 && selectedIds.size < workout.registrants.length;
                  const isExpanded = !collapsedWorkouts.has(workout.id);

                  return (
                    <Box key={workout.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 0.5,
                          bgcolor: 'background.default',
                        }}
                      >
                        <IconButton size="small" onClick={() => toggleExpand(workout.id)}>
                          {isExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                        <Checkbox
                          checked={workoutSelected}
                          indeterminate={workoutIndeterminate}
                          onChange={(event) => onToggleWorkout(workout.id, event.target.checked)}
                          size="small"
                        />
                        <GroupsIcon fontSize="small" color="secondary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {workout.workoutDesc}
                        </Typography>
                        <Chip
                          label={`${selectedIds.size}/${workout.registrants.length} players`}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {formatDateTime(workout.workoutDate)}
                        </Typography>
                      </Box>

                      {isExpanded && (
                        <Box sx={{ pl: 9, pr: 2, pb: 1 }}>
                          {workout.registrants.length === 0 ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ pl: 1, py: 0.5 }}
                            >
                              No registrants yet
                            </Typography>
                          ) : (
                            workout.registrants.map((registrant) => (
                              <Box
                                key={registrant.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  py: 0.5,
                                }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={selectedIds.has(registrant.id)}
                                  onChange={(event) =>
                                    onToggleRegistrant(
                                      workout.id,
                                      registrant.id,
                                      event.target.checked,
                                    )
                                  }
                                />
                                <PersonIcon fontSize="small" color="action" />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2">{registrant.name}</Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {registrant.email}
                                  </Typography>
                                </Box>
                              </Box>
                            ))
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

interface TeamsWantedTabContentProps {
  teamsWanted: TeamsWantedPublicClassifiedType[];
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggle: (id: string, checked: boolean) => void;
  loading: boolean;
  error?: string | null;
}

const TeamsWantedTabContent: React.FC<TeamsWantedTabContentProps> = ({
  teamsWanted,
  selectedIds,
  onToggleAll,
  onToggle,
  loading,
  error,
}) => {
  const selectedCount = selectedIds.size;
  const allSelected = teamsWanted.length > 0 && selectedCount === teamsWanted.length;
  const indeterminate = selectedCount > 0 && selectedCount < teamsWanted.length;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading Teams Wanted...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, overflowY: 'auto', height: '100%' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="h3" color="text.primary">
          Select Teams Wanted Registrants
        </Typography>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.25 }}>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => onToggleAll(event.target.checked)}
            disabled={teamsWanted.length === 0}
            size="small"
            sx={{ p: 0.5 }}
          />
          <GroupsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All Teams Wanted
          </Typography>
          <Chip
            label={`${selectedCount}/${teamsWanted.length} players`}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>

        {teamsWanted.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
            No Teams Wanted classifieds are available.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {teamsWanted.map((classified) => (
              <Box
                key={classified.id}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  px: 2,
                  py: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Checkbox
                  size="small"
                  checked={selectedIds.has(classified.id)}
                  onChange={(event) => onToggle(classified.id, event.target.checked)}
                />
                <PersonIcon fontSize="small" color="action" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {classified.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {classified.positionsPlayed}
                  </Typography>
                </Box>
                {classified.age ? (
                  <Chip
                    label={`Age ${classified.age}`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

// Umpires Tab Component
interface UmpiresTabContentProps {
  umpires: UmpireType[];
  selectedIds: Set<string>;
  onToggleAll: (checked: boolean) => void;
  onToggle: (id: string, checked: boolean) => void;
  loading: boolean;
  error?: string | null;
}

const UmpiresTabContent: React.FC<UmpiresTabContentProps> = ({
  umpires,
  selectedIds,
  onToggleAll,
  onToggle,
  loading,
  error,
}) => {
  // Filter to umpires with valid email addresses
  const umpiresWithEmail = useMemo(
    () => umpires.filter((umpire) => umpire.email?.trim()),
    [umpires],
  );
  const selectableCount = umpiresWithEmail.length;
  const selectedCount = selectedIds.size;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;
  const indeterminate = selectedCount > 0 && selectedCount < selectableCount;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading Umpires...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, overflowY: 'auto', height: '100%' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="h3" color="text.primary">
          Select Umpires
        </Typography>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.25 }}>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => onToggleAll(event.target.checked)}
            disabled={selectableCount === 0}
            size="small"
            sx={{ p: 0.5 }}
          />
          <GavelIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            All Umpires
          </Typography>
          <Chip
            label={`${selectedCount}/${selectableCount} umpires`}
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
          {umpires.length > selectableCount && (
            <Chip
              label={`${umpires.length - selectableCount} no email`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>

        {umpires.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
            No umpires are available.
          </Typography>
        ) : (
          <Stack spacing={0}>
            {umpires.map((umpire) => {
              const hasEmail = Boolean(umpire.email?.trim());
              return (
                <Box
                  key={umpire.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    opacity: hasEmail ? 1 : 0.6,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(umpire.id)}
                    onChange={(event) => onToggle(umpire.id, event.target.checked)}
                    disabled={!hasEmail}
                  />
                  <PersonIcon fontSize="small" color="action" />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {umpire.displayName}
                    </Typography>
                    {hasEmail && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {umpire.email}
                      </Typography>
                    )}
                  </Box>
                  {!hasEmail && (
                    <Chip label="No Email" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setSearchContacts([]);
        setSearchError(null);
        return;
      }

      if (!onSearch) {
        return;
      }

      searchTimeoutRef.current = setTimeout(() => {
        onSearch(trimmedQuery).catch((error) => {
          console.error('Search failed:', error);
          setSearchError(error instanceof Error ? error.message : 'Search failed');
        });
      }, 300);
    },
    [onSearch, setSearchContacts],
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSearchContacts([]);
    setSearchError(null);
    setSearchQuery('');
  }, [setSearchContacts]);

  // Handle search query change
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      triggerSearch(query);
    },
    [triggerSearch],
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        selectedContactIds={selectedGroups.get('individuals')?.[0]?.ids || new Set()}
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
