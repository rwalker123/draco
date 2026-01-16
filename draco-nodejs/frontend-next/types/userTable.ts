import { ContactType, ContactRoleType } from '@draco/shared-schemas';
import { UserTableProps } from './users';
import { UserFilterState, UserSortState } from './userFilters';

// Enhanced user interface with computed properties for the modern table
export interface EnhancedUser extends ContactType {
  // Computed display properties
  displayName: string;
  fullAddress: string;
  primaryPhone: string;
  roleCount: number;
  lastActivity?: Date;
  avatar?: string;

  // Selection state
  selected?: boolean;
  selectable?: boolean;

  // Additional metadata for enhanced functionality
  hasContactInfo: boolean;
  activeRoleNames: string[];
}

// View modes for the modern table
export type ViewMode = 'table' | 'card';
export type CardSize = 'compact' | 'comfortable' | 'spacious';
export type SelectionMode = 'none' | 'single' | 'multiple';
export type SortDirection = 'asc' | 'desc';

// Selection management state
export interface UserSelectionState {
  selectedIds: Set<string>;
  selectAll: boolean;
  indeterminate: boolean;
  totalSelected: number;
  lastSelectedId?: string;
}

// Selection management actions
export interface UserSelectionActions {
  selectUser: (userId: string) => void;
  deselectUser: (userId: string) => void;
  toggleUser: (userId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectAll: () => void;
  selectRange: (fromId: string, toId: string) => void;
  isSelected: (userId: string) => boolean;
  getSelectedUsers: () => EnhancedUser[];
  canSelectUser: (user: EnhancedUser) => boolean;
}

// Selection configuration
export interface UserSelectionConfig {
  mode: SelectionMode;
  maxSelection?: number;
  disabled?: (user: EnhancedUser) => boolean;
  onSelectionChange?: (selection: UserSelectionState, users: EnhancedUser[]) => void;
  validateSelection?: (users: EnhancedUser[]) => boolean;
}

// Bulk action definition
export interface UserTableAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  handler: (users: EnhancedUser[]) => Promise<void> | void;
  disabled?: (users: EnhancedUser[]) => boolean;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  requiresPermission?: string;
  confirmMessage?: string;
  destructive?: boolean;
}

// Card-specific action interface extending the table action
export interface UserCardAction extends Omit<UserTableAction, 'handler'> {
  handler?: (users: EnhancedUser[]) => Promise<void> | void;
  enabled: boolean;
  category?: 'primary' | 'secondary' | 'destructive';
  shortcut?: string;
  tooltip?: string;
}

// Sorting configuration
export interface UserSortOption {
  field: keyof EnhancedUser | string;
  label: string;
  defaultOrder?: SortDirection;
  sortFn?: (a: EnhancedUser, b: EnhancedUser, direction: SortDirection) => number;
}

// View configuration
export interface UserViewConfig {
  defaultView: ViewMode;
  availableViews: ViewMode[];
  cardSizes: CardSize[];
  defaultCardSize: CardSize;
  enableViewSwitching: boolean;

  // Grid configuration for card view
  gridBreakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  // List configuration
  listDensity: 'compact' | 'comfortable' | 'spacious';
  showAvatars: boolean;
  showContactInfo: boolean;
  enableQuickActions: boolean;

  // Table configuration
  stickyHeader: boolean;
  resizableColumns: boolean;
  sortableColumns: string[];
  defaultSortField?: string;
  defaultSortDirection?: SortDirection;
}

// Enhanced table props extending the original
export interface ModernUserTableProps extends UserTableProps {
  // Keep original users array - will be enhanced internally

  // View and display options
  viewMode?: ViewMode;
  cardSize?: CardSize;
  viewConfig?: Partial<UserViewConfig>;

  // Selection and bulk operations
  selectionMode?: SelectionMode;
  customActions?: UserTableAction[];
  maxSelection?: number;

  // Filtering and search
  onlyWithRoles?: boolean;
  sortOptions?: UserSortOption[];
  enableAdvancedFilters?: boolean;

  // Performance options
  lazyLoadImages?: boolean;

  // Enhanced callbacks
  onSelectionChange?: (selectionState: UserSelectionState, selectedUsers: EnhancedUser[]) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onCardSizeChange?: (size: CardSize) => void;
  onBulkAction?: (action: UserTableAction, users: EnhancedUser[]) => Promise<void> | void;
  onOnlyWithRolesChange?: (onlyWithRoles: boolean) => void;
  onSortChange?: (field: string, direction: SortDirection) => void;

  // Accessibility and customization
  tableId?: string;
  ariaLabel?: string;
  className?: string;
  sx?: object;
}

// Component-specific prop interfaces
export interface UserTableHeaderProps {
  users: EnhancedUser[];
  viewMode: ViewMode;
  sortField?: string;
  sortDirection?: SortDirection;
  selectionMode: SelectionMode;
  selectionState: UserSelectionState;
  selectionActions: UserSelectionActions;
  canManageUsers: boolean;
  onSortChange: (field: string, direction: SortDirection) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  columns: TableColumn[];
}

export interface UserTableSearchProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearch?: () => void;
  onClearSearch?: () => void;
  searchLoading?: boolean;
}

export interface UserTableToolbarProps {
  userCount: number;
  selectedUsers: EnhancedUser[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  isShowingSearchResults?: boolean;
  onlyWithRoles?: boolean;
  onOnlyWithRolesChange?: (onlyWithRoles: boolean) => void;
  customActions: UserTableAction[];
  onBulkAction: (action: UserTableAction, users: EnhancedUser[]) => void;
  canManageUsers: boolean;
  enableAdvancedFilters: boolean;
  loading?: boolean;
  onExport?: () => void;
  filter?: UserFilterState;
  onFilterChange?: (filter: UserFilterState) => void;
  onApplyFilter?: () => void;
  onClearFilter?: () => void;
  hasActiveFilter?: boolean;
}

export interface UserTableRowProps {
  user: EnhancedUser;
  selected: boolean;
  selectable: boolean;
  onToggleSelect: (userId: string) => void;
  onAssignRole: (user: ContactType) => Promise<void>;
  onRemoveRole: (user: ContactType, role: ContactRoleType) => void;
  canManageUsers: boolean;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  showCheckbox: boolean;
  columns: TableColumn[];
}

export interface UserDisplayCardProps {
  user: EnhancedUser;
  cardSize: CardSize;
  onAssignRole: (user: ContactType) => Promise<void>;
  onRemoveRole: (user: ContactType, role: ContactRoleType) => void;
  onEditContact?: (contact: ContactType) => void;
  onDeleteContact?: (contact: ContactType) => void;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
  onAutoRegister?: (contact: ContactType) => void;
  canManageUsers: boolean;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;
  showActions?: boolean;
}

// Table column configuration
export interface TableColumn {
  id: string;
  label: string;
  field: keyof EnhancedUser | string;
  sortable: boolean;
  width?: number | string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: unknown, user: EnhancedUser) => React.ReactNode;
  hidden?: boolean;
}

// Default configurations
export const DEFAULT_VIEW_CONFIG: UserViewConfig = {
  defaultView: 'table',
  availableViews: ['table', 'card'],
  cardSizes: ['compact', 'comfortable', 'spacious'],
  defaultCardSize: 'comfortable',
  enableViewSwitching: true,
  gridBreakpoints: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
  listDensity: 'comfortable',
  showAvatars: true,
  showContactInfo: true,
  enableQuickActions: true,
  stickyHeader: true,
  resizableColumns: false,
  sortableColumns: ['displayName', 'email', 'roleCount', 'lastActivity'],
  defaultSortField: 'displayName',
  defaultSortDirection: 'asc',
};

export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  {
    id: 'name',
    label: 'Name',
    field: 'displayName',
    sortable: true,
    minWidth: 200,
  },
  {
    id: 'contact',
    label: 'Contact Information',
    field: 'email',
    sortable: true,
    minWidth: 250,
  },
  {
    id: 'roles',
    label: 'Roles',
    field: 'activeRoleNames',
    sortable: false,
    minWidth: 200,
  },
  {
    id: 'actions',
    label: 'Actions',
    field: 'id',
    sortable: false,
    width: 120,
    align: 'right',
  },
];

// Default bulk actions
export const DEFAULT_BULK_ACTIONS: UserTableAction[] = [
  {
    id: 'assign-role',
    label: 'Assign Role',
    icon: () => null, // Will be replaced with actual icon component
    handler: async () => {}, // Will be replaced with actual handler
    requiresPermission: 'manage-users',
  },
  {
    id: 'export-users',
    label: 'Export Selected',
    icon: () => null,
    handler: async () => {},
    color: 'secondary',
  },
];

// Utility type for creating enhanced users
export type UserEnhancer = (user: ContactType) => EnhancedUser;

// Hook return types for the selection system
export interface UseUserSelectionReturn {
  state: UserSelectionState;
  actions: UserSelectionActions;
  config: UserSelectionConfig;
}

// Props for the selection provider
export interface UserSelectionProviderProps {
  children: React.ReactNode;
  users: EnhancedUser[];
  config: UserSelectionConfig;
}

// Main container component props
export interface UserTableContainerProps extends ModernUserTableProps {
  // Additional container-specific props
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  headerActions?: React.ReactNode;
  footerContent?: React.ReactNode;

  // Enhanced bulk operations props
  accountId?: string;

  // Search props
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearch?: () => void;
  onClearSearch?: () => void;
  searchLoading?: boolean;
  isShowingSearchResults?: boolean;

  // Contact photo management
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;

  // Registration management
  onRevokeRegistration?: (contactId: string) => void;
  onAutoRegister?: (contact: ContactType) => void;

  // Export functionality
  onExport?: () => void;

  // Advanced filter props
  filter?: UserFilterState;
  onFilterChange?: (filter: UserFilterState) => void;
  onApplyFilter?: () => void;
  onClearFilter?: () => void;
  hasActiveFilter?: boolean;

  // Sort props
  sort?: UserSortState;
  onAdvancedSortChange?: (sort: UserSortState) => void;
}

// Backward compatibility props mapping
export interface UserTableEnhancedProps extends UserTableProps {
  // Optional modern features that can be enabled
  enableViewSwitching?: boolean;
  enableAdvancedFilters?: boolean;
  initialViewMode?: ViewMode;
  onModernFeaturesChange?: (enabled: boolean) => void;

  // Enhanced props
  accountId?: string;
  onAutoRegister?: (contact: ContactType) => void;

  // Title customization
  title?: string | null;

  // Search props
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearch?: () => void;
  onClearSearch?: () => void;
  searchLoading?: boolean;
  isShowingSearchResults?: boolean;

  // Filter props
  onlyWithRoles?: boolean;
  onOnlyWithRolesChange?: (onlyWithRoles: boolean) => void;

  // Contact photo management
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;

  // Registration management
  onRevokeRegistration?: (contactId: string) => void;

  // Export functionality
  onExport?: () => void;

  // Advanced filter props
  filter?: UserFilterState;
  onFilterChange?: (filter: UserFilterState) => void;
  onApplyFilter?: () => void;
  onClearFilter?: () => void;
  hasActiveFilter?: boolean;

  // Sort props
  sort?: UserSortState;
  onAdvancedSortChange?: (sort: UserSortState) => void;
}
