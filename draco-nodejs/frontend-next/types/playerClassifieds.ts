// Player Classifieds Frontend Types
// These types extend the backend interfaces for frontend-specific needs

// ============================================================================
// CORE DATA INTERFACES
// ============================================================================

// Base interface for Players Wanted classifieds (frontend version)
export interface IPlayersWantedClassified {
  id: string; // Frontend uses string IDs, not bigint
  accountId: string;
  dateCreated: Date | string;
  createdByContactId: string;
  teamEventName: string;
  description: string;
  positionsNeeded: string;
}

// Base interface for Teams Wanted classifieds (frontend version)
export interface ITeamsWantedClassified {
  id: string;
  accountId: string;
  dateCreated: Date | string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  accessCode: string; // UUID for editing
  birthDate: Date | string;
}

// ============================================================================
// INPUT VALIDATION INTERFACES
// ============================================================================

// Players Wanted creation request
export interface IPlayersWantedCreateRequest {
  teamEventName: string;
  description: string;
  positionsNeeded: string;
}

// Teams Wanted creation request (anonymous/public)
export interface ITeamsWantedCreateRequest {
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string;
  birthDate: Date | string;
}

// Update request for Players Wanted
export interface IPlayersWantedUpdateRequest {
  teamEventName?: string;
  description?: string;
  positionsNeeded?: string;
}

// Update request for Teams Wanted (requires access code)
export interface ITeamsWantedUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  experience?: string;
  positionsPlayed?: string;
  birthDate?: Date | string;
  // Access code for security
  accessCode: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

// Base response for classified listings
export interface IClassifiedListResponse<T> {
  data: T[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
  filters: IClassifiedSearchFilters;
}

// Players Wanted response with creator details
export interface IPlayersWantedResponse extends IPlayersWantedClassified {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  account: {
    id: string;
    name: string;
  };
}

// Teams Wanted response (public view)
export interface ITeamsWantedResponse extends Omit<ITeamsWantedClassified, 'accessCode' | 'email'> {
  // Omit sensitive fields for public display
  account: {
    id: string;
    name: string;
  };
}

// Teams Wanted response (owner view with access code)
export interface ITeamsWantedOwnerResponse extends ITeamsWantedClassified {
  account: {
    id: string;
    name: string;
  };
}

// ============================================================================
// SEARCH AND FILTERING INTERFACES
// ============================================================================

// Search parameters for classifieds
export interface IClassifiedSearchParams {
  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'dateCreated' | 'relevance';
  sortOrder?: 'asc' | 'desc';

  // Type filtering
  type?: 'players' | 'teams' | 'all';

  // Content filtering
  searchQuery?: string;
  positions?: string[];
  experience?: string[];

  // Date filtering
  dateFrom?: Date;
  dateTo?: Date;

  // Account context
  accountId: string;
}

// Search filters applied to results
export interface IClassifiedSearchFilters {
  type: 'players' | 'teams' | 'all';
  positions: string[];
  experience: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  searchQuery: string | null;
}

// Search result with relevance scoring
export interface IClassifiedSearchResult {
  classified: IPlayersWantedResponse | ITeamsWantedResponse;
  relevanceScore: number;
  matchReasons: string[];
}

// ============================================================================
// MATCHING ALGORITHM INTERFACES
// ============================================================================

// Match suggestion between Players Wanted and Teams Wanted
export interface IClassifiedMatch {
  playersWantedId: string;
  teamsWantedId: string;
  matchScore: number; // 0.0 to 1.0
  matchReasons: string[];
  positionMatch: boolean;
  experienceMatch: boolean;
  availabilityMatch: boolean;
  proximityMatch: boolean;
}

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
// ADMIN AND MODERATION INTERFACES
// ============================================================================

// Admin view of all classifieds
export interface IAdminClassifiedsResponse {
  playersWanted: Array<IPlayersWantedResponse & { isFlagged: boolean; flagReason?: string }>;
  teamsWanted: Array<ITeamsWantedResponse & { isFlagged: boolean; flagReason?: string }>;
  total: number;
  flagged: number;
}

// ============================================================================
// ANALYTICS AND REPORTING INTERFACES
// ============================================================================

// Usage analytics for an account
export interface IClassifiedAnalytics {
  totalClassifieds: number;
  totalViews: number;
  popularPositions: Array<{
    position: string;
    count: number;
    percentage: number;
  }>;
  postingTrends: Array<{
    date: Date;
    newClassifieds: number;
  }>;
  matchSuccessRate: number;
}

// ============================================================================
// FORM STATE INTERFACES
// ============================================================================

// Form state for Players Wanted creation/editing
export interface IPlayersWantedFormState {
  teamEventName: string;
  description: string;
  positionsNeeded: string[];
}

// Form state for Teams Wanted creation/editing
export interface ITeamsWantedFormState {
  name: string;
  email: string;
  phone: string;
  experience: string;
  positionsPlayed: string[];
  birthDate: Date | null;
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

// Filter state for search and filtering
export interface IClassifiedsFilters {
  positions: string[];
  experience: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  searchQuery: string;
}

// Pagination state
export interface IClassifiedsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  classified: IPlayersWantedResponse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

// Props for Teams Wanted card component
export interface ITeamsWantedCardProps {
  classified: ITeamsWantedOwnerResponse;
  onEdit: (id: string, accessCode: string) => void;
  onDelete: (id: string, accessCode: string) => void;
}

// Props for Teams Wanted card component (public view)
export interface ITeamsWantedCardPublicProps {
  classified: ITeamsWantedResponse;
  onEdit: (id: string, accessCodeRequired: string) => void;
  onDelete: (id: string, accessCodeRequired: string) => void;
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
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IPlayersWantedFormState) => void;
  loading: boolean;
}

// Props for Create Teams Wanted dialog
export interface ICreateTeamsWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ITeamsWantedFormState) => void;
  loading: boolean;
}

// Props for Edit Players Wanted dialog
export interface IEditPlayersWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<IPlayersWantedFormState>) => void;
  loading: boolean;
  classified: IPlayersWantedResponse;
}

// Props for Edit Teams Wanted dialog
export interface IEditTeamsWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<ITeamsWantedFormState>, accessCode: string) => void;
  loading: boolean;
  classified: ITeamsWantedOwnerResponse;
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

// Search and filter handlers
export interface ISearchFilterHandlers {
  onSearch: (term: string) => void;
  onFilterChange: (filters: IClassifiedsFilters) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

// ============================================================================
// HOOK RETURN INTERFACES
// ============================================================================

// Return type for usePlayerClassifieds hook
export interface IUsePlayerClassifiedsReturn {
  // Data
  playersWanted: IPlayersWantedResponse[];
  teamsWanted: ITeamsWantedResponse[];

  // Loading states
  loading: boolean;
  formLoading: boolean;

  // Error state
  error: string | null;

  // UI state
  uiState: IClassifiedsUIState;

  // Actions
  createPlayersWanted: (data: IPlayersWantedFormState) => Promise<void>;
  updatePlayersWanted: (id: string, data: Partial<IPlayersWantedFormState>) => Promise<void>;
  deletePlayersWanted: (id: string) => Promise<void>;
  createTeamsWanted: (data: ITeamsWantedFormState) => Promise<void>;
  updateTeamsWanted: (
    id: string,
    data: Partial<ITeamsWantedFormState>,
    accessCode: string,
  ) => Promise<void>;
  deleteTeamsWanted: (id: string, accessCode: string) => Promise<void>;

  // Search and filtering
  searchClassifieds: (params: IClassifiedSearchParams) => Promise<void>;
  clearSearch: () => void;

  // Refresh data
  refreshData: () => Promise<void>;

  // Error handling
  clearError: () => void;
}

// Return type for useClassifiedsPagination hook
export interface IUseClassifiedsPaginationReturn {
  pagination: IClassifiedsPagination;
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
  canCreatePlayersWanted: boolean;
  canEditPlayersWanted: boolean;
  canDeletePlayersWanted: boolean;
  canCreateTeamsWanted: boolean;
  canEditTeamsWanted: boolean;
  canDeleteTeamsWanted: boolean;
  canSearchClassifieds: boolean;
  canViewClassifieds: boolean;
  canModerateClassifieds: boolean;
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

// Position and experience options for forms
export interface IPositionOption {
  value: string;
  label: string;
  category: string;
}

export interface IExperienceOption {
  value: string;
  label: string;
  description: string;
}

// Form validation errors
export interface IFormValidationErrors {
  [key: string]: string;
}

// API response wrapper
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
