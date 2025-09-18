// Recipient selection types for email composition
import { Contact } from '@draco/shared-schemas';

// Enhanced recipient interface for frontend display
export interface RecipientContact extends Contact {
  displayName: string;
  hasValidEmail: boolean;
}

// Base group interface for common properties
interface BaseGroup {
  id: string;
  name: string;
  description?: string;
  members: RecipientContact[];
  memberCount: number;
}

// Season-wide broadcast group (mutually exclusive with other selections)
export interface SeasonWideGroup extends BaseGroup {
  type: 'season-wide';
  seasonId: string;
  seasonName: string;
  isExclusive: true; // Always true for season-wide
}

// League division interface
export interface LeagueDivision {
  id: string;
  name: string;
  teams: TeamInfo[];
  teamCount: number;
  totalPlayers: number;
}

// League with divisions structure
export interface League {
  id: string;
  name: string;
  divisions: LeagueDivision[];
  teamCount: number;
  totalPlayers: number;
  seasonId: string;
  seasonName: string;
}

// Team information for selection
export interface TeamInfo {
  id: string;
  name: string;
  playerCount: number;
  leagueId: string;
  leagueName: string;
  divisionId: string;
  divisionName: string;
}

// League-specific communication group (updated)
export interface LeagueSpecificGroup extends BaseGroup {
  type: 'league-specific';
  leagues: League[];
  selectedLeagues: Set<string>;
  selectedDivisions: Set<string>;
  selectedTeams: Set<string>;
}

// League team interface for manager context
export interface LeagueTeam {
  leagueSeasonId: string;
  teamSeasonId: string;
}

// League names mapping
export interface LeagueNames {
  [leagueSeasonId: string]: string;
}

// Team names mapping
export interface TeamNames {
  [teamSeasonId: string]: string;
}

// Manager information (updated for Phase 3)
export interface ManagerInfo {
  id: string;
  name: string;
  email: string | null;
  phone1: string;
  phone2: string;
  phone3: string;
  allTeams: LeagueTeam[]; // All teams this manager manages in current season
  hasValidEmail: boolean;
}

// Manager role information
export interface ManagerRole {
  id: string;
  name: string;
  managerCount: number;
}

// Team management group (managers, coaches, etc.) - updated
export interface TeamManagementGroup extends BaseGroup {
  type: 'team-management';
  roles: ManagerRole[];
  managers: ManagerInfo[];
  selectedRoles: Set<string>;
  selectedManagers: Set<string>;
  allManagersSelected: boolean; // Default state
}

// System role group (AccountAdmin, LeagueAdmin, etc.)
export interface SystemRoleGroup extends BaseGroup {
  type: 'system-role';
  roleType: string;
  roleId: string;
  permissions: string[];
  context: 'global' | 'account' | 'league' | 'team';
}

// Individual team group
export interface IndividualTeamGroup extends BaseGroup {
  type: 'individual-team';
  teamId: string;
  teamName: string;
  leagueId: string;
  leagueName: string;
  seasonId: string;
  seasonName: string;
}

// ===== SEPARATED INTERFACES FOR SOLID PRINCIPLES =====

// Individual contact selection actions
export interface ContactSelectionActions {
  selectContact: (contactId: string) => void;
  deselectContact: (contactId: string) => void;
  toggleContact: (contactId: string) => void;
  selectContactRange: (fromId: string, toId: string) => void;
  isContactSelected: (contactId: string) => boolean;
  getSelectedContacts: () => RecipientContact[];
}

// Season participants actions
export interface SeasonParticipantsActions {
  toggleSeasonParticipants: () => void;
}

// League selection actions
export interface LeagueSelectionActions {
  toggleLeagueSelection: (leagueId: string) => void;
  toggleDivisionSelection: (divisionId: string) => void;
  toggleTeamSelection: (teamId: string) => void;
  selectAllLeagues: () => void;
  deselectAllLeagues: () => void;
}

// Team selection actions
export interface TeamSelectionActions {
  toggleTeamSelectionLeague: (leagueId: string) => void;
  toggleTeamSelectionDivision: (divisionId: string) => void;
  toggleTeamSelectionTeam: (teamId: string) => void;
  selectAllTeams: () => void;
  deselectAllTeams: () => void;
}

// Manager selection actions
export interface ManagerSelectionActions {
  toggleManagerSelection: (managerId: string) => void;
  toggleManagerLeagueSelection: (leagueId: string) => void;
  toggleManagerTeamSelection: (teamId: string) => void;
  selectAllManagers: () => void;
  deselectAllManagers: () => void;
  setManagerSearchQuery: (query: string) => void;
}

// Search and filter actions
export interface SearchActions {
  setSearchQuery: (query: string) => void;
  setGroupSearchQuery: (groupType: string, query: string) => void;
}

// UI state actions
export interface UIStateActions {
  setActiveTab: (tab: RecipientSelectionTab) => void;
  toggleSectionExpansion: (section: string) => void;
  isSectionExpanded: (section: string) => boolean;
}

// Pagination actions
export interface PaginationActions {
  goToNextPage?: () => Promise<void>;
  goToPrevPage?: () => Promise<void>;
}

// Utility actions
export interface UtilityActions {
  clearAll: () => void;
  getEffectiveRecipients: () => RecipientContact[];
  updateSelectedGroups: (groups: Map<GroupType, ContactGroup[]>) => void;
}

// Combined actions interface (for backward compatibility)
export interface RecipientSelectionActions
  extends ContactSelectionActions,
    SeasonParticipantsActions,
    LeagueSelectionActions,
    TeamSelectionActions,
    ManagerSelectionActions,
    SearchActions,
    UIStateActions,
    PaginationActions,
    UtilityActions {}

// ===== UNIFIED GROUP ARCHITECTURE =====

// Group types for unified architecture
export type GroupType = 'individuals' | 'season' | 'league' | 'division' | 'teams';

// ===== HIERARCHICAL SELECTION INTERFACES =====

// Hierarchical selection state for the new tree-based UI
export interface HierarchicalSelectionState {
  selectedSeasonIds: Set<string>;
  selectedLeagueIds: Set<string>;
  selectedDivisionIds: Set<string>;
  selectedTeamIds: Set<string>;
  managersOnly: boolean;
}

// Hierarchical team structure for UI display
export interface HierarchicalTeam {
  id: string;
  name: string;
  playerCount?: number;
  managerCount?: number;
}

export interface HierarchicalDivision {
  id: string;
  name: string;
  teams: HierarchicalTeam[];
  totalPlayers?: number;
  totalManagers?: number;
}

export interface HierarchicalLeague {
  id: string;
  name: string;
  divisions: HierarchicalDivision[];
  unassignedTeams?: HierarchicalTeam[];
  totalPlayers?: number;
  totalManagers?: number;
}

export interface HierarchicalSeason {
  id: string;
  name: string;
  leagues: HierarchicalLeague[];
  totalPlayers?: number;
  totalManagers?: number;
}

// Hierarchical group selection actions
export interface HierarchicalGroupSelectionActions {
  toggleSeason: (seasonId: string) => void;
  toggleLeague: (leagueId: string) => void;
  toggleDivision: (divisionId: string) => void;
  toggleTeam: (teamId: string) => void;
  toggleManagersOnly: () => void;
  clearAllSelections: () => void;
  isSeasonSelected: (seasonId: string) => boolean;
  isLeagueSelected: (leagueId: string) => boolean;
  isDivisionSelected: (divisionId: string) => boolean;
  isTeamSelected: (teamId: string) => boolean;
  getSelectedContactIds: () => Set<string>;
  getEffectiveRecipients: () => RecipientContact[];
}

// Enhanced selection state item for hierarchical selection
export interface HierarchicalSelectionItem {
  state: 'selected' | 'intermediate' | 'unselected';
  playerCount: number;
}

// Props for hierarchical group selection component
export interface HierarchicalGroupSelectionProps {
  accountId: string;
  seasonId: string;
  itemSelectedState: Map<string, HierarchicalSelectionItem>;
  managersOnly: boolean;
  onSelectionChange: (
    itemSelectedState: Map<string, HierarchicalSelectionItem>,
    managersOnly: boolean,
  ) => void;
  loading?: boolean;
}

// Utility function types for hierarchical selection
export interface HierarchicalSelectionUtils {
  convertToContactGroups: (
    state: HierarchicalSelectionState,
    seasonData: HierarchicalSeason,
  ) => Map<GroupType, ContactGroup[]>;
  extractHierarchicalState: (
    selectedGroups: Map<GroupType, ContactGroup[]>,
  ) => HierarchicalSelectionState;
  validateHierarchicalSelection: (state: HierarchicalSelectionState) => {
    isValid: boolean;
    errors: string[];
  };
}

// Unified contact group interface
export interface ContactGroup {
  groupType: GroupType;
  groupName: string; // "Individual Selections", "All Managers", "Team: Eagles", etc.
  ids: Set<string>; // Unified IDs - contactIds for individuals, teamIds/leagueIds/etc for groups
  totalCount: number; // Display count
  managersOnly: boolean; // Always false for 'individuals' group type
}

// ===== STATE STRUCTURES =====

// Individual contact selection state
export interface ContactSelectionState {
  selectedContactIds: Set<string>;
  lastSelectedContactId?: string;
}

// Season participants state
export interface SeasonParticipantsState {
  selected: boolean;
  totalPlayers: number;
}

// League selection state
export interface LeagueSelectionState {
  selectedLeagues: Set<string>;
  selectedDivisions: Set<string>;
  selectedTeams: Set<string>;
  totalPlayers: number;
}

// Team selection state
export interface TeamSelectionState {
  selectedLeagues: Set<string>;
  selectedDivisions: Set<string>;
  selectedTeams: Set<string>;
  totalPlayers: number;
}

// Manager communications state
export interface ManagerCommunicationsState {
  selectedManagers: Set<string>;
  selectedLeagues: Set<string>;
  selectedTeams: Set<string>;
  allManagersSelected: boolean;
  totalManagers: number;
}

// Search state
export interface SearchState {
  searchQuery: string;
  groupSearchQueries: Record<string, string>;
  searchLoading?: boolean;
  searchError?: string | null;
}

// Pagination state
export interface PaginationState {
  currentPage?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  contactsLoading?: boolean;
  contactsError?: string | null;
}

// UI state
export interface UIState {
  activeTab: RecipientSelectionTab;
  expandedSections: Set<string>;
}

// Computed properties
export interface ComputedState {
  totalRecipients: number;
  validEmailCount: number;
  invalidEmailCount: number;
}

// Combined state interface (maintaining backward compatibility)
export interface RecipientSelectionState {
  // Unified group-based selection system
  selectedGroups?: Map<GroupType, ContactGroup[]>;

  // Computed properties
  totalRecipients: number;
  validEmailCount: number;
  invalidEmailCount: number;

  // UI state
  searchQuery: string;
  activeTab: RecipientSelectionTab;
  expandedSections: Set<string>;

  // Search state
  searchLoading?: boolean;
  searchError?: string | null;
  groupSearchQueries: Record<string, string>;

  // Pagination state
  currentPage?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  contactsLoading?: boolean;
  contactsError?: string | null;
}

// ===== FACTORY FUNCTIONS FOR DRY PRINCIPLE =====

/**
 * Creates default manager communications state
 * Follows DRY principle by centralizing state creation
 */
export const createDefaultManagerCommunicationsState = (): ManagerCommunicationsState => ({
  selectedManagers: new Set<string>(),
  selectedLeagues: new Set<string>(),
  selectedTeams: new Set<string>(),
  allManagersSelected: true, // Default state
  totalManagers: 0,
});

/**
 * Creates default season participants state
 */
export const createDefaultSeasonParticipantsState = (): SeasonParticipantsState => ({
  selected: false,
  totalPlayers: 0,
});

/**
 * Creates default league selection state
 */
export const createDefaultLeagueSelectionState = (): LeagueSelectionState => ({
  selectedLeagues: new Set<string>(),
  selectedDivisions: new Set<string>(),
  selectedTeams: new Set<string>(),
  totalPlayers: 0,
});

/**
 * Creates default team selection state
 */
export const createDefaultTeamSelectionState = (): TeamSelectionState => ({
  selectedLeagues: new Set<string>(),
  selectedDivisions: new Set<string>(),
  selectedTeams: new Set<string>(),
  totalPlayers: 0,
});

/**
 * Creates default search state
 */
export const createDefaultSearchState = (): SearchState => ({
  searchQuery: '',
  groupSearchQueries: {},
  searchLoading: false,
  searchError: null,
});

/**
 * Creates default pagination state
 */
export const createDefaultPaginationState = (): PaginationState => ({
  currentPage: 1,
  hasNextPage: false,
  hasPrevPage: false,
  contactsLoading: false,
  contactsError: null,
});

/**
 * Creates default UI state
 */
export const createDefaultUIState = (): UIState => ({
  activeTab: 'contacts',
  expandedSections: new Set<string>(),
});

/**
 * Creates default computed state
 */
export const createDefaultComputedState = (): ComputedState => ({
  totalRecipients: 0,
  validEmailCount: 0,
  invalidEmailCount: 0,
});

// ===== UNIFIED GROUP UTILITY FUNCTIONS =====

/**
 * Creates a new contact group
 */
export const createContactGroup = (
  groupType: GroupType,
  groupName: string,
  ids: Set<string>,
  totalCount: number,
  managersOnly: boolean = false,
): ContactGroup => ({
  groupType,
  groupName,
  ids,
  totalCount,
  managersOnly,
});

/**
 * Converts legacy state to unified group structure
 * This function migrates from old mixed selection approach to unified groups
 * NOTE: This function is currently a stub since the legacy fields have been removed.
 * It should be updated when backend integration provides the necessary data.
 */
export const convertLegacyStateToGroups = (
  state: RecipientSelectionState,
): Map<GroupType, ContactGroup[]> => {
  const selectedGroups = new Map<GroupType, ContactGroup[]>();

  // TODO: This function needs to be updated when backend integration is ready
  // The legacy fields (selectedContactIds, seasonParticipants, leagueSpecific, etc.)
  // have been removed from RecipientSelectionState and replaced with selectedGroups

  // For now, return the existing selectedGroups if available
  if (state.selectedGroups) {
    return state.selectedGroups;
  }

  // Return empty map as fallback
  return selectedGroups;
};

/**
 * Gets all contact IDs from selected groups (flattened and deduplicated)
 */
export const getContactIdsFromGroups = (
  selectedGroups: Map<GroupType, ContactGroup[]>,
): Set<string> => {
  const allContactIds = new Set<string>();

  selectedGroups.forEach((groups) => {
    groups.forEach((group) => {
      group.ids.forEach((id) => {
        allContactIds.add(id);
      });
    });
  });

  return allContactIds;
};

/**
 * Calculates total recipient count from selected groups
 */
export const getTotalRecipientsFromGroups = (
  selectedGroups: Map<GroupType, ContactGroup[]>,
): number => {
  return getContactIdsFromGroups(selectedGroups).size;
};

/**
 * Creates complete default recipient selection state
 * Follows DRY principle by using factory functions
 */
export const createDefaultRecipientSelectionState = (): RecipientSelectionState => ({
  // Unified group-based selection system
  selectedGroups: new Map<GroupType, ContactGroup[]>(),

  // Computed properties
  totalRecipients: 0,
  validEmailCount: 0,
  invalidEmailCount: 0,

  // UI state
  searchQuery: '',
  activeTab: 'contacts',
  expandedSections: new Set<string>(),

  // Search state
  searchLoading: false,
  searchError: null,
  groupSearchQueries: {},

  // Pagination state
  currentPage: 1,
  hasNextPage: false,
  hasPrevPage: false,
  contactsLoading: false,
  contactsError: null,
});

// Tab types for the recipient selector
export type RecipientSelectionTab = 'contacts' | 'groups';

// Group section types for the groups tab (updated)
export type GroupSectionType =
  | 'season-participants'
  | 'league-specific'
  | 'team-selection'
  | 'manager-communications';

// Selection configuration
export interface RecipientSelectionConfig {
  // New configuration
  allowSeasonParticipants: boolean;
  allowLeagueSpecific: boolean;
  allowTeamSelection: boolean;
  allowManagerCommunications: boolean;

  // General settings
  maxRecipients?: number;
  requireValidEmails: boolean;
  showRecipientCount: boolean;
}

// Selection validation result
export interface RecipientValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRecipients: number;
  validEmailCount: number;
  invalidEmailCount: number;
}

// Provider props
export interface RecipientSelectionProviderProps {
  children: React.ReactNode;
  contacts: RecipientContact[];

  // New group data
  seasonWideGroup?: SeasonWideGroup;
  leagueSpecificGroups?: LeagueSpecificGroup[];
  teamManagementGroups?: TeamManagementGroup[];
  systemRoleGroups?: SystemRoleGroup[];
  individualTeamGroups?: IndividualTeamGroup[];

  config?: Partial<RecipientSelectionConfig>;
  onSelectionChange?: (selection: RecipientSelectionState) => void;
  accountId?: string; // For server-side search functionality
  seasonId?: string; // For search context
  initialHasMoreContacts?: boolean; // Initial pagination state from parent
}

// Context value
export interface RecipientSelectionContextValue {
  state: RecipientSelectionState;
  actions: RecipientSelectionActions;
  validation: RecipientValidationResult;
  config: RecipientSelectionConfig;
  contacts: RecipientContact[];

  // New group data
  seasonWideGroup?: SeasonWideGroup;
  leagueSpecificGroups: LeagueSpecificGroup[];
  teamManagementGroups: TeamManagementGroup[];
  systemRoleGroups: SystemRoleGroup[];
  individualTeamGroups: IndividualTeamGroup[];
}

// Group section configuration
export interface GroupSectionConfig {
  id: GroupSectionType;
  title: string;
  icon: string;
  description: string;
  allowMultiple: boolean;
  isExclusive: boolean;
}

// Default group section configurations
export const DEFAULT_GROUP_SECTIONS: Record<GroupSectionType, GroupSectionConfig> = {
  'season-participants': {
    id: 'season-participants',
    title: 'Season Participants',
    icon: '🌐',
    description: 'All current players in the season',
    allowMultiple: false,
    isExclusive: true,
  },
  'league-specific': {
    id: 'league-specific',
    title: 'League-specific Communications',
    icon: '🏆',
    description: 'All teams/players in specific leagues',
    allowMultiple: true,
    isExclusive: false,
  },
  'team-selection': {
    id: 'team-selection',
    title: 'Team Selection',
    icon: '🏃‍♂️',
    description: 'Select specific teams or entire divisions/leagues',
    allowMultiple: true,
    isExclusive: false,
  },
  'manager-communications': {
    id: 'manager-communications',
    title: 'Manager Communications',
    icon: '👥',
    description: 'Team managers, coaches, and administrators',
    allowMultiple: true,
    isExclusive: false,
  },
};

// ===== HIERARCHICAL SELECTION UTILITY FUNCTIONS =====

/**
 * Creates default hierarchical selection state
 */
export const createDefaultHierarchicalSelectionState = (): HierarchicalSelectionState => ({
  selectedSeasonIds: new Set<string>(),
  selectedLeagueIds: new Set<string>(),
  selectedDivisionIds: new Set<string>(),
  selectedTeamIds: new Set<string>(),
  managersOnly: false,
});

/**
 * Converts hierarchical selection state to unified ContactGroup structure
 */
export const convertHierarchicalToContactGroups = (
  state: HierarchicalSelectionState,
  seasonData: HierarchicalSeason,
): Map<GroupType, ContactGroup[]> => {
  const groupsMap = new Map<GroupType, ContactGroup[]>();

  // Season-level selection takes precedence
  if (state.selectedSeasonIds.size > 0) {
    const seasonGroup: ContactGroup = {
      groupType: 'season',
      groupName: `${seasonData.name} Season`,
      ids: new Set([seasonData.id]), // Season ID
      totalCount: state.managersOnly ? seasonData.totalManagers || 0 : seasonData.totalPlayers || 0,
      managersOnly: state.managersOnly,
    };
    groupsMap.set('season', [seasonGroup]);
    return groupsMap;
  }

  // League-level selections
  if (state.selectedLeagueIds.size > 0) {
    const leagueGroups: ContactGroup[] = [];
    state.selectedLeagueIds.forEach((leagueId) => {
      const league = seasonData.leagues.find((l) => l.id === leagueId);
      if (league) {
        const leagueGroup: ContactGroup = {
          groupType: 'league',
          groupName: `League: ${league.name}`,
          ids: new Set([leagueId]), // League ID
          totalCount: state.managersOnly ? league.totalManagers || 0 : league.totalPlayers || 0,
          managersOnly: state.managersOnly,
        };
        leagueGroups.push(leagueGroup);
      }
    });
    if (leagueGroups.length > 0) {
      groupsMap.set('league', leagueGroups);
    }
  }

  // Division-level selections (only include divisions not already covered by league selections)
  if (state.selectedDivisionIds.size > 0) {
    const divisionGroups: ContactGroup[] = [];
    state.selectedDivisionIds.forEach((divisionId) => {
      // Find division in hierarchy to get details
      let divisionDetails: HierarchicalDivision | null = null;
      let parentLeagueId: string | null = null;

      for (const league of seasonData.leagues) {
        const division = league.divisions.find((d) => d.id === divisionId);
        if (division) {
          divisionDetails = division;
          parentLeagueId = league.id;
          break;
        }
      }

      // Only include this division if its parent league is not already selected
      if (divisionDetails && parentLeagueId && !state.selectedLeagueIds.has(parentLeagueId)) {
        const divisionGroup: ContactGroup = {
          groupType: 'division',
          groupName: `Division: ${divisionDetails.name}`,
          ids: new Set([divisionId]), // Division ID
          totalCount: state.managersOnly
            ? divisionDetails.totalManagers || 0
            : divisionDetails.totalPlayers || 0,
          managersOnly: state.managersOnly,
        };
        divisionGroups.push(divisionGroup);
      }
    });
    if (divisionGroups.length > 0) {
      groupsMap.set('division', divisionGroups);
    }
  }

  // Team-level selections (only include teams not already covered by league/division selections)
  if (state.selectedTeamIds.size > 0) {
    const teamGroups: ContactGroup[] = [];
    state.selectedTeamIds.forEach((teamId) => {
      // Find team in hierarchy to get details
      let teamDetails: HierarchicalTeam | null = null;
      let parentLeagueId: string | null = null;
      let parentDivisionId: string | null = null;

      // Search in divisions
      for (const league of seasonData.leagues) {
        for (const division of league.divisions) {
          const team = division.teams.find((t) => t.id === teamId);
          if (team) {
            teamDetails = team;
            parentLeagueId = league.id;
            parentDivisionId = division.id;
            break;
          }
        }
        if (teamDetails) break;

        // Search in unassigned teams
        const unassignedTeam = league.unassignedTeams?.find((t) => t.id === teamId);
        if (unassignedTeam) {
          teamDetails = unassignedTeam;
          parentLeagueId = league.id;
          // No parent division for unassigned teams
          break;
        }
      }

      // Only include this team if its parent league/division is not already selected
      const isParentLeagueSelected = parentLeagueId && state.selectedLeagueIds.has(parentLeagueId);
      const isParentDivisionSelected =
        parentDivisionId && state.selectedDivisionIds.has(parentDivisionId);

      if (teamDetails && !isParentLeagueSelected && !isParentDivisionSelected) {
        const teamGroup: ContactGroup = {
          groupType: 'teams',
          groupName: `Team: ${teamDetails.name}`,
          ids: new Set([teamId]), // Team ID
          totalCount: state.managersOnly
            ? teamDetails.managerCount || 0
            : teamDetails.playerCount || 0,
          managersOnly: state.managersOnly,
        };
        teamGroups.push(teamGroup);
      }
    });
    if (teamGroups.length > 0) {
      groupsMap.set('teams', teamGroups);
    }
  }

  return groupsMap;
};

/**
 * Extracts hierarchical selection state from unified ContactGroup structure
 */
export const extractHierarchicalSelectionState = (
  selectedGroups: Map<GroupType, ContactGroup[]>,
): HierarchicalSelectionState => {
  const state = createDefaultHierarchicalSelectionState();

  selectedGroups.forEach((groups, groupType) => {
    groups.forEach((group) => {
      if (groupType === 'season') {
        group.ids.forEach((id) => state.selectedSeasonIds.add(id));
        state.managersOnly = group.managersOnly;
      } else if (groupType === 'league') {
        group.ids.forEach((id) => state.selectedLeagueIds.add(id));
        state.managersOnly = group.managersOnly;
      } else if (groupType === 'division') {
        group.ids.forEach((id) => state.selectedDivisionIds.add(id));
        state.managersOnly = group.managersOnly;
      } else if (groupType === 'teams') {
        group.ids.forEach((id) => state.selectedTeamIds.add(id));
        state.managersOnly = group.managersOnly;
      }
      // 'managers' is no longer a group type - handled via managersOnly flag
    });
  });

  return state;
};

/**
 * Validates hierarchical selection state for consistency
 */
export const validateHierarchicalSelection = (
  state: HierarchicalSelectionState,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for conflicting selections (season + league, season + team, etc.)
  if (state.selectedSeasonIds.size > 0) {
    if (state.selectedLeagueIds.size > 0) {
      errors.push('Cannot select both season and specific leagues');
    }
    if (state.selectedTeamIds.size > 0) {
      errors.push('Cannot select both season and specific teams');
    }
  }

  if (state.selectedLeagueIds.size > 0 && state.selectedTeamIds.size > 0) {
    errors.push('Cannot select both specific leagues and specific teams');
  }

  // Check for multiple season selections (should not happen in UI)
  if (state.selectedSeasonIds.size > 1) {
    errors.push('Cannot select multiple seasons');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
