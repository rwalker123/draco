// todo: much of this can be deleted once we fully transition to zod schemas and validation

// Import context data types
import { League, Team, LeagueSeason } from '../services/contextDataService';
import {
  Contact,
  CreateContactType,
  ContactType,
  ContactRoleType,
  RoleWithContactType,
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
    contacts: Contact[];
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
  onEditContact?: (contact: Contact) => Promise<void>;
  onDeleteContact?: (contact: Contact) => Promise<void>;
  onAddUser?: () => void;
  canManageUsers: boolean;
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
  onEditContact?: (contact: Contact) => Promise<void>;
  onDeleteContact?: (contact: Contact) => Promise<void>;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
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
  onError?: (error: string) => void;
  roles: Role[];
  accountId: string;
  // Pre-population props
  preselectedUser?: ContactType | null;
  isUserReadonly?: boolean;
  // Context data props
  leagues?: League[];
  teams?: Team[];
  leagueSeasons?: LeagueSeason[];
  contextDataLoading?: boolean;
}

export interface RemoveRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  selectedUser: ContactType | null;
  selectedRoleToRemove: ContactRoleType | null;
  loading: boolean;
}

export interface EditContactDialogProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSave: (contactData: CreateContactType, photoFile?: File | null) => Promise<void>;
  onDeletePhoto?: (contactId: string) => Promise<void>;
  loading?: boolean;
}

export interface UserActionsProps {
  user: ContactType;
  canManageUsers: boolean;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
}

// Hook return types
export interface UseUserManagementReturn {
  // State
  users: ContactType[];
  roles: Role[];
  loading: boolean;
  isInitialLoad: boolean;
  error: string | null;
  success: string | null;
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  searchTerm: string;
  searchLoading: boolean;
  isShowingSearchResults: boolean;
  onlyWithRoles: boolean;
  isPaginating: boolean;

  // Dialog states
  assignRoleDialogOpen: boolean;
  removeRoleDialogOpen: boolean;
  editContactDialogOpen: boolean;
  deleteContactDialogOpen: boolean;
  createContactDialogOpen: boolean;
  selectedUser: ContactType | null;
  selectedContactForEdit: Contact | null;
  selectedContactForDelete: Contact | null;
  selectedRole: string;
  selectedRoleToRemove: ContactRoleType | null;
  newUserContactId: string;
  formLoading: boolean;

  // Context data states
  leagues: League[];
  teams: Team[];
  leagueSeasons: LeagueSeason[];
  selectedLeagueId: string;
  selectedTeamId: string;
  contextDataLoading: boolean;

  // Automatic role holders states
  accountOwner: {
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
  } | null; // Nullable during initialization, but API guarantees account owner exists
  teamManagers: Array<{
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
    teams: Array<{
      teamSeasonId: string;
      teamName: string;
    }>;
  }>;
  automaticRolesLoading: boolean;

  // Actions
  handleSearch: () => void;
  handleClearSearch: () => void;
  handleFilterToggle: (filterValue: boolean) => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handleRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAssignRole: () => void;
  handleRemoveRole: () => void;
  openAssignRoleDialog: (user: ContactType) => Promise<void>;
  closeAssignRoleDialog: () => void;
  openRemoveRoleDialog: (user: ContactType, role: ContactRoleType) => void;
  openEditContactDialog: (contact: Contact) => void;
  closeEditContactDialog: () => void;
  handleEditContact: (
    contactData: CreateContactType | null,
    photoFile?: File | null,
  ) => Promise<void>;
  openCreateContactDialog: () => void;
  closeCreateContactDialog: () => void;
  handleCreateContact: (
    contactData: CreateContactType | null,
    photoFile?: File | null,
  ) => Promise<void>;
  handleDeleteContactPhoto: (contactId: string) => Promise<void>;
  openDeleteContactDialog: (contact: Contact) => void;
  closeDeleteContactDialog: () => void;
  handleDeleteContact: (contactId: string, force: boolean) => Promise<void>;
  handleRevokeRegistration: (contactId: string) => Promise<void> | void;
  setAssignRoleDialogOpen: (open: boolean) => void;
  setRemoveRoleDialogOpen: (open: boolean) => void;
  setEditContactDialogOpen: (open: boolean) => void;
  setSelectedUser: (user: ContactType | null) => void;
  setSelectedRole: (role: string) => void;
  setSelectedRoleToRemove: (role: ContactRoleType | null) => void;
  setNewUserContactId: (contactId: string) => void;
  setSelectedLeagueId: (leagueId: string) => void;
  setSelectedTeamId: (teamId: string) => void;
  setSearchTerm: (term: string) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  loadContextData: () => Promise<void>;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  handleRoleAssigned: (assignedRole: RoleWithContactType) => void;
}
