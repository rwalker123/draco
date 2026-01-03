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
  Gavel as GavelIcon,
} from '@mui/icons-material';

import { useNotifications } from '../../../hooks/useNotifications';
import { useHierarchicalData } from '../../../hooks/useHierarchicalData';
import { useHierarchicalMaps } from '../../../hooks/useHierarchicalMaps';
import HierarchicalGroupSelection from './HierarchicalGroupSelection';
import { ManagerStateProvider } from './context/ManagerStateContext';
import {
  WorkoutsTabContent,
  TeamsWantedTabContent,
  UmpiresTabContent,
  ContactsTabContent,
} from './tabs';
import {
  useWorkoutSelection,
  useTeamsWantedSelection,
  useUmpireSelection,
  useContactFetching,
} from './hooks';
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
import { normalizeError, createEmailRecipientError } from '../../../utils/errorHandling';
import { useAuth } from '../../../context/AuthContext';
import { useUmpireService } from '../../../hooks/useUmpireService';

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
  initialIndividualContactDetails?: Map<string, RecipientContact>;
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
  initialIndividualContactDetails,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotifications();
  const { token } = useAuth();
  const { listUmpires } = useUmpireService(accountId);

  // Workout selection hook
  const workoutHook = useWorkoutSelection({
    accountId,
    token,
    initialWorkoutRecipients,
    initialWorkoutManagersOnly,
  });

  // Teams Wanted selection hook
  const teamsWantedHook = useTeamsWantedSelection({
    accountId,
    token,
    initialTeamsWantedRecipients,
  });

  // Umpire selection hook
  const umpireHook = useUmpireSelection({
    accountId,
    token,
    listUmpires,
    initialUmpireRecipients,
  });

  // Hierarchical data for converting hierarchical selections to ContactGroups
  const { hierarchicalData, loadHierarchicalData } = useHierarchicalData();

  // Hierarchy mapping
  const hierarchyMaps = useHierarchicalMaps(hierarchicalData, seasonId || '');

  // UNIFIED GROUP SYSTEM - Single source of truth for all selections
  const [selectedGroups, setSelectedGroups] = useState<Map<GroupType, ContactGroup[]>>(
    () => initialSelectedGroups || new Map(),
  );

  // Workout state from hook
  const {
    olderWorkoutsOptions,
    selectedWorkoutRegistrantIds,
    workoutManagersOnly,
    selectedOlderWorkoutId,
    loadingState: workoutLoadingState,
    errorState: workoutErrorState,
    allWorkouts,
    visibleWorkouts,
    workoutSelectionCount,
    totalWorkoutRegistrants,
    loadActiveWorkouts,
    loadRecentPastWorkouts,
    loadOlderWorkoutsOptions,
    handleToggleAllWorkouts,
    handleToggleWorkout,
    handleToggleRegistrant,
    handleWorkoutManagersOnlyToggle,
    handleOlderWorkoutSelect,
    clearWorkoutSelections,
  } = workoutHook;
  // Teams Wanted state from hook
  const {
    teamsWanted,
    selectedTeamsWantedIds,
    teamsWantedLoading,
    teamsWantedError,
    teamsWantedSelectionCount,
    hasTeamsWanted,
    loadTeamsWanted,
    handleToggleAllTeamsWanted,
    handleToggleTeamsWanted,
    clearTeamsWantedSelections,
    getTeamsWantedSelections,
  } = teamsWantedHook;

  // Umpire state from hook
  const {
    umpires,
    selectedUmpireIds,
    umpiresLoading,
    umpiresError,
    umpireSelectionCount,
    hasUmpires,
    loadUmpires,
    handleToggleAllUmpires,
    handleToggleUmpire,
    clearUmpireSelections,
    getUmpireSelections,
  } = umpireHook;

  // Hierarchical selection state for shared data model
  const [hierarchicalSelectedIds, setHierarchicalSelectedIds] = useState<
    Map<string, HierarchicalSelectionItem>
  >(new Map());
  const [hierarchicalManagersOnly, setHierarchicalManagersOnly] = useState<boolean>(false);

  // Contact fetching hook
  const contactFetching = useContactFetching({
    accountId,
    token,
    seasonId,
    showNotification,
  });

  const {
    currentPageContacts,
    paginationLoading,
    paginationError,
    searchContacts,
    setSearchContacts,
    fetchContactsPage,
    handleSearch,
    getContactDetails,
    hasContacts,
    currentPage,
    rowsPerPage,
    searchCurrentPage,
    isInSearchMode,
    paginationState,
    paginationHandlers,
    cacheSelectedContact,
    uncacheSelectedContact,
    getSelectedContactsFromCache,
    clearSelectedContactsCache,
  } = contactFetching;

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
              team: 'Teams',
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

  const getTotalSelected = useCallback((): number => {
    let total = 0;

    // Add counts from selectedGroups (individual/manual selections)
    selectedGroups.forEach((groups) => {
      groups.forEach((group) => {
        total += group.totalCount;
      });
    });

    // Add counts from hierarchical selections - ONLY use season-level count
    // The season level already contains the accurate rolled-up total of all selected players/managers
    if (seasonId) {
      const seasonSelection = hierarchicalSelectedIds.get(seasonId);
      if (
        seasonSelection &&
        (seasonSelection.state === 'selected' || seasonSelection.state === 'intermediate')
      ) {
        total += hierarchicalManagersOnly
          ? seasonSelection.managerCount
          : seasonSelection.playerCount;
      }
    }

    total += workoutSelectionCount;
    total += teamsWantedSelectionCount;
    total += umpireSelectionCount;

    return total;
  }, [
    selectedGroups,
    hierarchicalSelectedIds,
    hierarchicalManagersOnly,
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

  // Sync internal state with props when dialog opens
  // This is a legitimate one-time sync to reset dialog state from parent props
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect -- legitimate prop-to-state sync on dialog open */
      // Reset selectedGroups to match parent state
      setSelectedGroups(initialSelectedGroups || new Map());

      // Clear hierarchical selections - they are transient dialog state
      // The parent only stores the final ContactGroups, not intermediate hierarchical state
      setHierarchicalSelectedIds(new Map());
      setHierarchicalManagersOnly(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, initialSelectedGroups]);

  // Track whether we've populated the cache for the current dialog session
  const cachePopulatedRef = useRef(false);

  // Reset the ref when dialog closes
  useEffect(() => {
    if (!open) {
      cachePopulatedRef.current = false;
    }
  }, [open]);

  // Populate contact cache from initial individual contact details when dialog opens
  // This enables "Show Selected" to display contacts that were converted from hierarchical selections
  useEffect(() => {
    if (
      open &&
      !cachePopulatedRef.current &&
      initialIndividualContactDetails &&
      initialIndividualContactDetails.size > 0
    ) {
      cachePopulatedRef.current = true;
      initialIndividualContactDetails.forEach((contact) => {
        cacheSelectedContact(contact);
      });
    }
  }, [open, initialIndividualContactDetails, cacheSelectedContact]);

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

  // User's requested tab - what they clicked on
  const [requestedTab, setRequestedTab] = useState<TabValue>('contacts');

  // State for loading and error handling
  const [loadingState] = useState<LoadingState>({
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
          uncacheSelectedContact(contactId);
        } else {
          addToGroup('individuals', contactId, contact);
          cacheSelectedContact(contact);
        }
      },

      clearAllRecipients: () => {
        setSelectedGroups(new Map());
        setHierarchicalSelectedIds(new Map()); // Clear hierarchical selections
        setHierarchicalManagersOnly(false); // Reset managers-only toggle
        clearWorkoutSelections();
        clearTeamsWantedSelections();
        clearUmpireSelections();
        clearSelectedContactsCache();
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
      clearWorkoutSelections,
      clearTeamsWantedSelections,
      clearUmpireSelections,
      cacheSelectedContact,
      uncacheSelectedContact,
      clearSelectedContactsCache,
    ],
  );

  const hasWorkouts = useMemo(() => allWorkouts.length > 0, [allWorkouts]);
  const hasAnyData = hasContacts || hasWorkouts || hasTeamsWanted || hasUmpires;

  // Compute individual selection count for the Contacts tab
  const individualSelectionCount = useMemo(() => {
    const individualsGroups = selectedGroups.get('individuals');
    if (!individualsGroups) return 0;
    return individualsGroups.reduce((sum, group) => sum + group.totalCount, 0);
  }, [selectedGroups]);

  // Get cached selected contacts for "Show Selected Only" mode
  const selectedContactsFromCache = useMemo(
    () => getSelectedContactsFromCache(),
    [getSelectedContactsFromCache],
  );

  // Determine overall loading state - include pagination loading
  const isGeneralLoading =
    loading ||
    paginationLoading ||
    workoutLoadingState.active ||
    teamsWantedLoading ||
    Object.values(loadingState).some(Boolean);

  // Compute effective current tab - falls back when requested tab's data is unavailable
  const currentTab = useMemo((): TabValue => {
    // Helper to get fallback tab when a tab's data isn't available
    const getFallbackTab = (): TabValue => {
      if (seasonId) return 'season';
      if (hasWorkouts) return 'workouts';
      if (hasTeamsWanted) return 'teamsWanted';
      if (hasUmpires) return 'umpires';
      return 'contacts';
    };

    // Check if requested tab is valid given current data availability
    switch (requestedTab) {
      case 'season':
        return seasonId ? 'season' : getFallbackTab();
      case 'workouts':
        return hasWorkouts ? 'workouts' : getFallbackTab();
      case 'teamsWanted':
        return hasTeamsWanted ? 'teamsWanted' : getFallbackTab();
      case 'umpires':
        return hasUmpires ? 'umpires' : getFallbackTab();
      case 'contacts':
      default:
        return 'contacts';
    }
  }, [requestedTab, seasonId, hasWorkouts, hasTeamsWanted, hasUmpires]);

  // Handle tab changes
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: TabValue) => {
    setRequestedTab(newValue);
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

    const teamsWantedSelections = getTeamsWantedSelections();
    const totalTeamsWantedSelected = teamsWantedSelections.length;

    const umpireSelections = getUmpireSelections();
    const totalUmpireSelected = umpireSelections.length;

    // Convert hierarchical selections to ContactGroups and merge with manual selections
    const hierarchicalContactGroups = convertHierarchicalSelectionsToContactGroups();

    // Define which group types are manual (preserved) vs hierarchical (replaced)
    const manualGroupTypes: Set<GroupType> = new Set(['individuals']);
    const hierarchicalGroupTypes: Set<GroupType> = new Set([
      'season',
      'league',
      'division',
      'team',
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
    getTeamsWantedSelections,
    getUmpireSelections,
  ]);

  // Derive external error as EmailRecipientError (computed, not synced via effect)
  const externalError = useMemo((): EmailRecipientError | null => {
    if (!error) return null;
    return typeof error === 'string'
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
  }, [error]);

  // Combine internal errorState with external error prop
  const combinedErrorState = useMemo(
    (): ErrorState => ({
      ...errorState,
      general: errorState.general || externalError,
    }),
    [errorState, externalError],
  );

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
  if (combinedErrorState.general && !hasAnyData) {
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
            {combinedErrorState.general.userMessage || combinedErrorState.general.message}
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
        {combinedErrorState.general && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              onClose={() => clearError('general')}
              action={
                onRetry && retryCount < maxRetries && combinedErrorState.general?.retryable ? (
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
              {combinedErrorState.general.userMessage || combinedErrorState.general.message}
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
                  selectedContactsFromCache={selectedContactsFromCache}
                  totalSelectedCount={individualSelectionCount}
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
                        disabled={workoutLoadingState.older || olderWorkoutsOptions.length === 0}
                        helperText={
                          workoutErrorState.older
                            ? workoutErrorState.older
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
                      {workoutLoadingState.older ? <CircularProgress size={18} /> : null}
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
                      loading={workoutLoadingState.active || workoutLoadingState.pastRecent}
                      error={workoutErrorState.active || workoutErrorState.pastRecent}
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

export default AdvancedRecipientDialogWithProvider;
