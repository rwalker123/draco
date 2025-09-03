import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  RecipientContact,
  RecipientSelectionState,
  RecipientSelectionActions,
  SeasonWideGroup,
  LeagueSpecificGroup,
  TeamManagementGroup,
  SystemRoleGroup,
  IndividualTeamGroup,
  RecipientGroup,
  GroupSelectionType,
  TeamGroup,
  RoleGroup,
  ManagerInfo,
  // ManagerInfo is used in the manager state hook
} from '../types/emails/recipients';
import { useManagerStateContext } from '../components/emails/recipients/context/ManagerStateContext';

export interface RecipientGroupsData {
  seasonWideGroup?: SeasonWideGroup;
  leagueSpecificGroups: LeagueSpecificGroup[];
  teamManagementGroups: TeamManagementGroup[];
  systemRoleGroups: SystemRoleGroup[];
  individualTeamGroups: IndividualTeamGroup[];
}

export interface UseNewRecipientSelectionProps {
  accountId: string;
  seasonId?: string;
  initialContacts?: RecipientContact[];
  onSelectionChange?: (state: RecipientSelectionState) => void;
  enabled?: boolean; // Only initialize when enabled
}

export interface UseNewRecipientSelectionReturn {
  state: RecipientSelectionState;
  actions: RecipientSelectionActions;
  groups: RecipientGroupsData;
  loading: boolean;
  error: string | null;
  managerState: ReturnType<typeof useManagerStateContext>['state'];
  managerActions: ReturnType<typeof useManagerStateContext>['actions'];
}

/**
 * Hook for managing new recipient selection state with categorized groups
 */
export const useNewRecipientSelection = ({
  initialContacts = [],
  onSelectionChange,
}: UseNewRecipientSelectionProps): UseNewRecipientSelectionReturn => {
  // Core selection state
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<RecipientGroup[]>([]);
  const [seasonWideSelected, setSeasonWideSelected] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['season-wide', 'league-specific']),
  );
  const [groupSearchQueries, setGroupSearchQueries] = useState<Record<string, string>>({});

  // Group type selection state
  const [activeGroupType, setActiveGroupType] = useState<GroupSelectionType | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups'>('contacts');

  // Manager state management - use shared context
  const { state: managerStateHook, actions: managerActionsHook } = useManagerStateContext();

  // Use refs to maintain stable references to manager actions
  const managerActionsRef = useRef(managerActionsHook);
  managerActionsRef.current = managerActionsHook;

  // Groups data (this would come from API in real implementation)
  const [groups] = useState<RecipientGroupsData>({
    seasonWideGroup: undefined,
    leagueSpecificGroups: [],
    teamManagementGroups: [],
    systemRoleGroups: [],
    individualTeamGroups: [],
  });

  // Loading and error states
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Computed state
  const state: RecipientSelectionState = useMemo(
    () => ({
      selectedContactIds,

      // Mutually exclusive group selection
      activeGroupType: activeGroupType,

      // Group-specific selection states
      seasonParticipants: {
        selected: seasonWideSelected,
        totalPlayers: groups.seasonWideGroup?.memberCount || 0,
      },

      leagueSpecific: {
        selectedLeagues: new Set<string>(),
        selectedDivisions: new Set<string>(),
        selectedTeams: new Set<string>(),
        totalPlayers: 0,
      },

      teamSelection: {
        selectedLeagues: new Set<string>(),
        selectedDivisions: new Set<string>(),
        selectedTeams: new Set<string>(),
        totalPlayers: 0,
      },

      managerCommunications: {
        selectedLeagues: new Set<string>(),
        selectedTeams: new Set<string>(),
        selectedManagers: selectedContactIds, // Use the same contact selection for managers
        allManagersSelected:
          managerStateHook.managers.length > 0 &&
          managerStateHook.managers.every((manager: ManagerInfo) =>
            selectedContactIds.has(manager.id),
          ),
        totalManagers: managerStateHook.managers.length,
      },

      // Legacy group selections (deprecated - for backward compatibility)
      allContacts: false, // Legacy - not used in new design
      selectedTeamGroups: [], // Legacy - not used in new design
      selectedRoleGroups: [], // Legacy - not used in new design

      // Computed properties
      totalRecipients: 0,
      validEmailCount: 0,
      invalidEmailCount: 0,

      // UI state
      lastSelectedContactId: undefined,
      searchQuery,
      activeTab,

      // Search state
      searchLoading: false,
      searchError: null,

      // Pagination state
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
      contactsLoading: false,
      contactsError: null,

      // Group-specific UI state
      groupSearchQueries,
      expandedSections: new Set<string>(),
    }),
    [
      selectedContactIds,
      seasonWideSelected,
      groups.seasonWideGroup?.memberCount,
      searchQuery,
      activeTab,
      groupSearchQueries,
      activeGroupType,
      managerStateHook.managers, // Add manager state dependencies
    ],
  );

  // Calculate effective recipients
  const getEffectiveRecipients = useCallback((): RecipientContact[] => {
    const recipients = new Map<string, RecipientContact>();

    // If season participants is selected, include all season participants
    if (state.seasonParticipants.selected && groups.seasonWideGroup) {
      groups.seasonWideGroup.members.forEach((contact) => {
        recipients.set(contact.id, contact);
      });
      return Array.from(recipients.values());
    }

    // Add individually selected contacts
    selectedContactIds.forEach((contactId) => {
      const contact = initialContacts.find((c) => c.id === contactId);
      if (contact) {
        recipients.set(contact.id, contact);
      }
    });

    // TODO: Add group members from new group selection system
    // This will be implemented when we add the actual group selection logic

    return Array.from(recipients.values());
  }, [
    state.selectedContactIds,
    state.seasonParticipants.selected,
    initialContacts,
    groups.seasonWideGroup,
  ]);

  // Notify parent of changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(state);
    }
  }, [state, onSelectionChange]);

  // Actions
  const actions: RecipientSelectionActions = useMemo(
    () => ({
      // Individual contact actions
      selectContact: (contactId: string) => {
        if (seasonWideSelected) return; // Disabled when season-wide is selected
        setSelectedContactIds((prev) => new Set([...prev, contactId]));
      },
      deselectContact: (contactId: string) => {
        setSelectedContactIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(contactId);
          return newSet;
        });
      },
      toggleContact: (contactId: string) => {
        if (seasonWideSelected) return; // Disabled when season-wide is selected
        setSelectedContactIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(contactId)) {
            newSet.delete(contactId);
          } else {
            newSet.add(contactId);
          }
          return newSet;
        });
      },
      selectContactRange: (_fromId: string, _toId: string) => {
        if (seasonWideSelected) return; // Disabled when season-wide is selected
        // Implementation for range selection
      },

      // Group type selection (mutually exclusive)
      updateActiveGroupType: (groupType: GroupSelectionType | null) => {
        setActiveGroupType(groupType);
      },

      // Season participants actions
      toggleSeasonParticipants: () => {
        // TODO: Implement season participants toggle
      },

      // League-specific actions
      toggleLeagueSelection: (_leagueId: string) => {
        // TODO: Implement league selection toggle
      },
      toggleDivisionSelection: (_divisionId: string) => {
        // TODO: Implement division selection toggle
      },
      toggleTeamSelection: (_teamId: string) => {
        // TODO: Implement team selection toggle
      },
      selectAllLeagues: () => {
        // TODO: Implement select all leagues
      },
      deselectAllLeagues: () => {
        // TODO: Implement deselect all leagues
      },

      // Team selection actions
      toggleTeamSelectionLeague: (_leagueId: string) => {
        // TODO: Implement team selection league toggle
      },
      toggleTeamSelectionDivision: (_divisionId: string) => {
        // TODO: Implement team selection division toggle
      },
      toggleTeamSelectionTeam: (_teamId: string) => {
        // TODO: Implement team selection team toggle
      },
      selectAllTeams: () => {
        // TODO: Implement select all teams
      },
      deselectAllTeams: () => {
        // TODO: Implement deselect all teams
      },

      // Manager communications actions
      toggleManagerSelection: (managerId: string) => {
        // Update the manager selection state
        setSelectedContactIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(managerId)) {
            newSet.delete(managerId);
          } else {
            newSet.add(managerId);
          }
          return newSet;
        });
      },
      toggleManagerLeagueSelection: (_leagueId: string) => {
        // TODO: Implement manager league selection toggle
        // This would need to be integrated with the manager state to get all managers in the league
      },
      toggleManagerTeamSelection: (_teamId: string) => {
        // TODO: Implement manager team selection toggle
        // This would need to be integrated with the manager state to get all managers for the team
      },
      selectAllManagers: () => {
        // Select all managers from the manager state
        const allManagerIds = managerStateHook.managers.map((manager: ManagerInfo) => manager.id);
        setSelectedContactIds((prev) => {
          const newSet = new Set([...prev, ...allManagerIds]);
          return newSet;
        });
      },
      deselectAllManagers: () => {
        // Deselect all managers
        const allManagerIds = managerStateHook.managers.map((manager: ManagerInfo) => manager.id);
        setSelectedContactIds((prev) => {
          const newSet = new Set(prev);
          allManagerIds.forEach((id: string) => newSet.delete(id));
          return newSet;
        });
      },
      setManagerSearchQuery: (query: string) => {
        // Use manager state hook for search via ref
        managerActionsRef.current.setSearchQuery(query);
      },

      // Legacy actions (stubs for compatibility)
      selectAllContacts: () => {
        if (seasonWideSelected) return;
        // Implementation for selecting all contacts
      },
      deselectAllContacts: () => {
        // Implementation for deselecting all contacts
      },
      selectTeamGroup: (_team: TeamGroup) => {
        if (seasonWideSelected) return;
        // Legacy implementation
      },
      deselectTeamGroup: (_teamId: string) => {
        // Legacy implementation
      },
      selectRoleGroup: (_role: RoleGroup) => {
        if (seasonWideSelected) return;
        // Legacy implementation
      },
      deselectRoleGroup: (_roleId: string) => {
        // Legacy implementation
      },

      // Utility actions
      clearAll: () => {
        setSelectedContactIds(new Set());
        setSelectedGroups([]);
        setSeasonWideSelected(false);
      },
      isContactSelected: (contactId: string) => selectedContactIds.has(contactId),
      isGroupSelected: (groupId: string) => selectedGroups.some((g) => g.id === groupId),
      getSelectedContacts: () =>
        Array.from(selectedContactIds)
          .map((id) => initialContacts.find((c) => c.id === id))
          .filter(Boolean) as RecipientContact[],
      getEffectiveRecipients,

      // Search and filter
      setSearchQuery,
      setGroupSearchQuery: (section: string, query: string) => {
        setGroupSearchQueries((prev) => ({ ...prev, [section]: query }));
      },
      setActiveTab,

      // UI state management
      toggleSectionExpansion: (section: string) => {
        setExpandedSections((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(section)) {
            newSet.delete(section);
          } else {
            newSet.add(section);
          }
          return newSet;
        });
      },
      isSectionExpanded: (section: string) => expandedSections.has(section),

      // Pagination (stubs for compatibility)
      goToNextPage: async () => {},
      goToPrevPage: async () => {},
    }),
    [
      selectedContactIds,
      selectedGroups,
      seasonWideSelected,
      initialContacts,
      expandedSections,
      groupSearchQueries,
      getEffectiveRecipients,
    ],
  );

  return {
    state,
    actions,
    groups,
    loading,
    error,
    managerState: managerStateHook,
    managerActions: managerActionsHook,
  };
};
