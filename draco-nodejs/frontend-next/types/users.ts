// Import context data types
import { League, Team, LeagueSeason } from '../services/contextDataService';

// Contact details interface
export interface ContactDetails {
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: string | null;
  middlename: string | null;
}

// Backend API response types
export interface ContactRole {
  id: string;
  roleId: string;
  roleName?: string;
  roleData: string;
  contextName?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  contactDetails?: ContactDetails;
  contactroles?: ContactRole[];
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

// Core user management types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  contactDetails?: ContactDetails;
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
  onAssignRole: (user: User) => Promise<void>;
  onRemoveRole: (user: User, role: UserRole) => void;
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

export interface UserActionsProps {
  user: User;
  canManageUsers: boolean;
  onAssignRole: (user: User) => Promise<void>;
}

// Hook return types
export interface UseUserManagementReturn {
  // State
  users: User[];
  roles: Role[];
  loading: boolean;
  error: string | null;
  success: string | null;
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  searchTerm: string;
  searchLoading: boolean;
  onlyWithRoles: boolean;

  // Dialog states
  assignRoleDialogOpen: boolean;
  removeRoleDialogOpen: boolean;
  selectedUser: User | null;
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
  setAssignRoleDialogOpen: (open: boolean) => void;
  setRemoveRoleDialogOpen: (open: boolean) => void;
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
