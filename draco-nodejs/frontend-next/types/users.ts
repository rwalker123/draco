// todo: much of this can be deleted once we fully transition to zod schemas and validation

// Import context data types
import {
  CreateContactType,
  ContactType,
  ContactRoleType,
  RoleWithContactType,
  BaseContactType,
  TeamManagerWithTeamsType,
  LeagueSeasonType,
  TeamSeasonType,
  LeagueSeasonWithDivisionTeamsType,
} from '@draco/shared-schemas';

// Contact dependency types
export interface ContactDependency {
  table: string;
  count: number;
  description: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface DependencyCheckResult {
  canDelete: boolean;
  dependencies: ContactDependency[];
  message: string;
  totalDependencies: number;
}

export interface ContactsResponse {
  success: boolean;
  data: {
    contacts: ContactType[];
  };
  pagination?: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Role {
  id: string;
  name: string;
}

// API response types
export interface UsersResponse {
  users: ContactType[];
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserSearchParams {
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  seasonId?: string | null;
  onlyWithRoles?: boolean;
}

// Component prop types
export interface UserTableProps {
  users: ContactType[];
  loading: boolean;
  isInitialLoad?: boolean;
  onAssignRole: (user: ContactType) => Promise<void>;
  onRemoveRole: (user: ContactType, role: ContactRoleType) => Promise<void>;
  onEditContact?: (contact: ContactType) => Promise<void>;
  onDeleteContact?: (contact: ContactType) => Promise<void>;
  canManageUsers: boolean;
  onAutoRegister?: (contact: ContactType) => void;
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  searchTerm?: string;
  hasFilters?: boolean;
}

export interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
}

export interface UserCardProps {
  user: ContactType;
  canManageUsers: boolean;
  onAssignRole: (user: ContactType) => Promise<void>;
  onRemoveRole: (user: ContactType, role: ContactRoleType) => Promise<void>;
  onEditContact?: (contact: ContactType) => Promise<void>;
  onDeleteContact?: (contact: ContactType) => Promise<void>;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
  onAutoRegister?: (contact: ContactType) => void;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
}

export interface UserRoleChipsProps {
  roles: ContactRoleType[];
  canManageUsers: boolean;
  onRemoveRole: (role: ContactRoleType) => Promise<void>;
  onAssignRole?: (user: ContactType) => Promise<void>;
  user: ContactType;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
}

export interface AssignRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { message: string; assignedRole: RoleWithContactType }) => void;
  roles: Role[];
  accountId: string;
  // Pre-population props
  preselectedUser?: ContactType | null;
  isUserReadonly?: boolean;
  // Context data props
  leagues?: LeagueSeasonWithDivisionTeamsType[];
  teams?: TeamSeasonType[];
  leagueSeasons?: LeagueSeasonType[];
  contextDataLoading?: boolean;
}

export interface RemoveRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    message: string;
    removedRole: { contactId: string; roleId: string; id: string };
  }) => void;
  selectedUser: ContactType | null;
  selectedRoleToRemove: ContactRoleType | null;
  accountId: string;
}

export interface EditContactDialogProps {
  open: boolean;
  contact: ContactType | null;
  onClose: () => void;
  onSave: (contactData: CreateContactType, photoFile?: File | null) => Promise<void>;
  onDeletePhoto?: (contactId: string) => Promise<void>;
  loading?: boolean;
}

export interface UserActionsProps {
  user: ContactType;
  canManageUsers: boolean;
  onEditContact?: (contact: ContactType) => void;
  onDeleteContact?: (contact: ContactType) => void;
}

// Feedback state for snackbar notifications
export type FeedbackState = { severity: 'success' | 'error'; message: string } | null;

// Hook return types
export interface UseUserManagementReturn {
  // State
  users: ContactType[];
  roles: Role[];
  loading: boolean;
  isInitialLoad: boolean;
  feedback: FeedbackState;
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  searchTerm: string;
  searchLoading: boolean;
  isShowingSearchResults: boolean;
  onlyWithRoles: boolean;
  isPaginating: boolean;
  currentSeasonId: string | null;

  // Dialog states
  deleteContactDialogOpen: boolean;
  selectedUser: ContactType | null;
  selectedContactForDelete: ContactType | null;

  // Context data states
  leagues: LeagueSeasonWithDivisionTeamsType[];
  teams: TeamSeasonType[];
  leagueSeasons: LeagueSeasonType[];
  contextDataLoading: boolean;

  // Automatic role holders states
  accountOwner: BaseContactType | null; // Nullable during initialization, but API guarantees account owner exists
  teamManagers: TeamManagerWithTeamsType[];
  automaticRolesLoading: boolean;

  // Actions
  handleSearch: () => void;
  handleClearSearch: () => void;
  handleFilterToggle: (filterValue: boolean) => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handleRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openDeleteContactDialog: (contact: ContactType) => void;
  closeDeleteContactDialog: () => void;
  setSelectedUser: (user: ContactType | null) => void;
  setSearchTerm: (term: string) => void;
  setFeedback: (feedback: FeedbackState) => void;
  loadContextData: () => Promise<void>;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  handleRoleAssigned: (assignedRole: RoleWithContactType) => void;
  handleRoleRemoved: (contactId: string, roleId: string) => void;
  handleContactUpdated: (contact: ContactType, isCreate: boolean) => void;
  handlePhotoDeleted: (contactId: string) => void;
  handleRegistrationRevoked: (contactId: string) => void;
  handleRegistrationLinked: (contactId: string, userId: string) => void;
  handleContactDeleted: (contactId: string) => void;
}
