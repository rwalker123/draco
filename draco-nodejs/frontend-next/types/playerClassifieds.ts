// Player Classifieds Frontend Types
// These types extend the backend interfaces for frontend-specific needs
import { PlayerClassifiedSearchQuery } from '@draco/shared-api-client';
import {
  UpsertPlayersWantedClassifiedType,
  UpsertTeamsWantedClassifiedType,
  PaginationWithTotalType,
  PlayersWantedClassifiedType,
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedType,
} from '@draco/shared-schemas';

// ============================================================================
// EMAIL NOTIFICATION INTERFACES
// ============================================================================

// Email verification for Teams Wanted
export interface IEmailVerificationRequest {
  classifiedId: string;
  email: string;
  accessCode: string;
}

// Email verification result
export interface IEmailVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  accessCode?: string;
}

// ============================================================================
// UI STATE INTERFACES
// ============================================================================

// Main UI state for the classifieds page
export interface IClassifiedsUIState {
  loading: boolean;
  error: string | null;
  success: string | null;
  searchTerm: string;
  selectedPositions: string[];
  selectedExperience: string;
  sortBy: 'dateCreated' | 'relevance';
  viewMode: 'grid' | 'list';
}

// Search state
export interface IClassifiedsSearchState {
  searchTerm: string;
  isSearching: boolean;
  hasSearchResults: boolean;
  searchHistory: string[];
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

// Props for the main Players Wanted component
export interface IPlayersWantedProps {
  accountId: string;
}

// Props for the main Teams Wanted component
export interface ITeamsWantedProps {
  accountId: string;
}

// Props for Players Wanted card component
export interface IPlayersWantedCardProps {
  classified: PlayersWantedClassifiedType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canEdit: (classified: PlayersWantedClassifiedType) => boolean;
  canDelete: (classified: PlayersWantedClassifiedType) => boolean;
}

// Props for Teams Wanted card component
export interface ITeamsWantedCardProps {
  classified: TeamsWantedOwnerClassifiedType;
  onEdit: (id: string, accessCode: string) => void;
  onDelete: (id: string, accessCode: string) => void;
}

// Props for Teams Wanted card component (public view)
export interface ITeamsWantedCardPublicProps {
  classified: TeamsWantedPublicClassifiedType;
  onEdit: (id: string, accessCodeRequired: string) => void;
  onDelete: (id: string, accessCodeRequired: string) => void;
  canEdit: (classified: TeamsWantedPublicClassifiedType) => boolean;
  canDelete: (classified: TeamsWantedPublicClassifiedType) => boolean;
  isAuthenticated: boolean;
  accessCode?: string; // Optional access code for contact info authentication
}

// Props for the Classifieds Header component
export interface IClassifiedsHeaderProps {
  accountId: string;
  onSearch: (term: string) => void;
  searchTerm: string;
  onCreatePlayersWanted: () => void;
  onCreateTeamsWanted: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  viewMode: 'grid' | 'list';
}

// ============================================================================
// DIALOG PROPS INTERFACES
// ============================================================================

// Props for Create Players Wanted dialog
export interface ICreatePlayersWantedDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  editMode?: boolean;
  initialData?: UpsertPlayersWantedClassifiedType;
  onSuccess?: (classified: PlayersWantedClassifiedType) => void;
  onError?: (message: string) => void;
}

// Props for Create Teams Wanted dialog
export interface ICreateTeamsWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpsertTeamsWantedClassifiedType) => void;
  loading: boolean;
}

// Props for Edit Players Wanted dialog
export interface IEditPlayersWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<UpsertPlayersWantedClassifiedType>) => void;
  loading: boolean;
  classified: PlayersWantedClassifiedType;
}

// Props for Edit Teams Wanted dialog
export interface IEditTeamsWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    id: string,
    data: Partial<UpsertTeamsWantedClassifiedType>,
    accessCode: string,
  ) => void;
  loading: boolean;
  classified: TeamsWantedOwnerClassifiedType;
}

// Props for Delete confirmation dialog
export interface IDeleteClassifiedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  classifiedType: 'players' | 'teams';
  classifiedTitle: string;
}

// Props for Access Code dialog
export interface IAccessCodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (accessCode: string) => void;
  loading: boolean;
  classifiedType: 'players' | 'teams';
  classifiedTitle: string;
}

// ============================================================================
// EVENT HANDLER INTERFACES
// ============================================================================

// Event handlers for Players Wanted actions
export interface IPlayersWantedHandlers {
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onContact: (id: string) => void;
}

// Event handlers for Teams Wanted actions
export interface ITeamsWantedHandlers {
  onCreate: () => void;
  onEdit: (id: string, accessCode: string) => void;
  onDelete: (id: string, accessCode: string) => void;
  onView: (id: string) => void;
  onContact: (id: string) => void;
}

// ============================================================================
// HOOK RETURN INTERFACES
// ============================================================================

// Return type for usePlayerClassifieds hook
export interface IUsePlayerClassifiedsReturn {
  // Data
  playersWanted: PlayersWantedClassifiedType[];
  teamsWanted: TeamsWantedPublicClassifiedType[];

  // Loading states
  loading: boolean;
  paginationLoading: boolean;
  formLoading: boolean;

  // Error state
  error: string | null;

  // UI state
  uiState: IClassifiedsUIState;

  // Pagination info
  paginationInfo: {
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Actions
  createPlayersWanted: (data: UpsertPlayersWantedClassifiedType) => Promise<void>;
  updatePlayersWanted: (id: string, data: UpsertPlayersWantedClassifiedType) => Promise<void>;
  deletePlayersWanted: (id: string) => Promise<void>;
  createTeamsWanted: (data: UpsertTeamsWantedClassifiedType) => Promise<void>;
  updateTeamsWanted: (
    id: string,
    data: UpsertTeamsWantedClassifiedType,
    accessCode: string,
  ) => Promise<TeamsWantedOwnerClassifiedType>;
  deleteTeamsWanted: (
    id: string,
    accessCode: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Pagination methods
  loadTeamsWantedPage: (page: number, limit: number) => Promise<void>;
  clearTeamsWantedState: () => void;

  // Refresh data
  refreshData: () => Promise<void>;

  // Error handling
  clearError: () => void;
}

// Return type for useClassifiedsPagination hook
export interface IUseClassifiedsPaginationReturn {
  pagination: PaginationWithTotalType & { totalPages: number };
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

// Return type for useClassifiedsSearch hook
export interface IUseClassifiedsSearchReturn {
  searchState: IClassifiedsSearchState;
  handleSearchInput: (term: string) => void;
  handleSearchSubmit: (term?: string) => void;
  handleClearSearch: () => void;
  handleSearchHistorySelect: (term: string) => void;
  clearSearchHistory: () => void;
}

// Return type for useClassifiedsPermissions hook
export interface IUseClassifiedsPermissionsReturn {
  // Basic permissions
  canCreatePlayersWanted: boolean;
  canCreateTeamsWanted: boolean;
  canEditTeamsWanted: boolean;
  canDeleteTeamsWanted: boolean;
  canSearchClassifieds: boolean;
  canViewClassifieds: boolean;
  canModerateClassifieds: boolean;

  // Enhanced permission checking with ownership
  canEditPlayersWantedById: (classified: PlayersWantedClassifiedType) => boolean;
  canDeletePlayersWantedById: (classified: PlayersWantedClassifiedType) => boolean;
  canEditTeamsWantedById: (classified: TeamsWantedPublicClassifiedType) => boolean;
  canDeleteTeamsWantedById: (classified: TeamsWantedPublicClassifiedType) => boolean;

  // Access code verification state
  verifiedAccessCodes: Set<string>;
  verifyAccessCode: (classifiedId: string, accessCode: string) => Promise<boolean>;
  clearVerifiedAccessCode: (classifiedId: string) => void;
  clearAllVerifiedAccessCodes: () => void;
}
