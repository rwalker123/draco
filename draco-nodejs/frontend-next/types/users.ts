// Import context data types
import { League, Team, LeagueSeason } from '../services/contextDataService';

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

// Contact details interface (middleName removed - moved to top-level)
export interface ContactDetails {
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: string | null;
  // ❌ Removed: middlename: string | null;
}

// Named contact interface (matches backend)
export interface NamedContact {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
}

// Base contact interface for common fields
export interface BaseContact extends NamedContact {
  email: string;
  userId: string;
  photoUrl?: string;
  contactDetails?: ContactDetails;
}

// Backend API response types
export interface ContactRole {
  id: string;
  roleId: string;
  roleName?: string;
  roleData: string;
  contextName?: string;
}

// Updated Contact interface (extends BaseContact)
export interface Contact extends BaseContact {
  contactroles?: ContactRole[];
  creatoraccountid?: string;
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

// Updated User interface (extends BaseContact)
export interface User extends BaseContact {
  roles?: UserRole[];
}

export interface UserRole {
  id: string;
  roleId: string;
  roleName: string;
  roleData: string;
  contextName?: string;
}

export interface Role {
  id: string;
  name: string;
}

// API response types
export interface UsersResponse {
  users: User[];
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
  users: User[];
  loading: boolean;
  isInitialLoad?: boolean;
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole: (user: User, role: UserRole) => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
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
  user: User;
  canManageUsers: boolean;
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole: (user: User, role: UserRole) => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
}

export interface UserRoleChipsProps {
  roles: UserRole[];
  canManageUsers: boolean;
  onRemoveRole: (role: UserRole) => void;
  onAssignRole?: (user: User) => Promise<void>;
  user: User;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
}

export interface AssignRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: () => void;
  selectedRole: string;
  newUserContactId: string;
  roles: Role[];
  onUserChange: (contactId: string) => void;
  onRoleChange: (roleId: string) => void;
  loading: boolean;
  accountId: string;
  // Pre-population props
  preselectedUser?: User | null;
  isUserReadonly?: boolean;
  // Context data props
  leagues?: League[];
  teams?: Team[];
  leagueSeasons?: LeagueSeason[];
  selectedLeagueId?: string;
  selectedTeamId?: string;
  onLeagueChange?: (leagueId: string) => void;
  onTeamChange?: (teamId: string) => void;
  contextDataLoading?: boolean;
}

export interface RemoveRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onRemove: () => void;
  selectedUser: User | null;
  selectedRoleToRemove: UserRole | null;
  loading: boolean;
}

export interface EditContactDialogProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSave: (contactData: ContactUpdateData, photoFile?: File | null) => Promise<void>;
  onDeletePhoto?: (contactId: string) => Promise<void>;
  loading?: boolean;
}

export interface ContactUpdateData {
  firstName?: string;
  lastName?: string;
  middleName?: string; // ✅ Updated to use middleName instead of middlename
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetaddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateofbirth?: string | null;
}

export interface UserActionsProps {
  user: User;
  canManageUsers: boolean;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contact: Contact) => void;
}

// Hook return types
export interface UseUserManagementReturn {
  // State
  users: User[];
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
  selectedUser: User | null;
  selectedContactForEdit: Contact | null;
  selectedContactForDelete: Contact | null;
  selectedRole: string;
  selectedRoleToRemove: UserRole | null;
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
  } | null;
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
  openAssignRoleDialog: (user: User) => Promise<void>;
  closeAssignRoleDialog: () => void;
  openRemoveRoleDialog: (user: User, role: UserRole) => void;
  openEditContactDialog: (contact: Contact) => void;
  closeEditContactDialog: () => void;
  handleEditContact: (contactData: ContactUpdateData, photoFile?: File | null) => Promise<void>;
  openCreateContactDialog: () => void;
  closeCreateContactDialog: () => void;
  handleCreateContact: (contactData: ContactUpdateData, photoFile?: File | null) => Promise<void>;
  handleDeleteContactPhoto: (contactId: string) => Promise<void>;
  openDeleteContactDialog: (contact: Contact) => void;
  closeDeleteContactDialog: () => void;
  handleDeleteContact: (contactId: string, force: boolean) => Promise<void>;
  setAssignRoleDialogOpen: (open: boolean) => void;
  setRemoveRoleDialogOpen: (open: boolean) => void;
  setEditContactDialogOpen: (open: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedRole: (role: string) => void;
  setSelectedRoleToRemove: (role: UserRole | null) => void;
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
}
