// Recipient selection types for email composition
import { UserRole } from '../users';
import { Contact } from './email';

// Enhanced recipient interface for frontend display
export interface RecipientContact extends Contact {
  displayName: string;
  hasValidEmail: boolean;
  avatar?: string;
  roles?: UserRole[];
  teams?: string[];
}

// Group selection types
export interface TeamGroup {
  id: string;
  name: string;
  type: 'managers' | 'players' | 'all' | 'sports';
  description?: string;
  members: RecipientContact[];
}

export interface RoleGroup {
  id: string;
  name: string;
  roleType: string;
  roleId: string;
  permissions: string[];
  members: RecipientContact[];
}

// Recipient selection state
export interface RecipientSelectionState {
  // Individual contacts
  selectedContactIds: Set<string>;

  // Group selections
  allContacts: boolean;
  selectedTeamGroups: TeamGroup[];
  selectedRoleGroups: RoleGroup[];

  // Computed properties
  totalRecipients: number;
  validEmailCount: number;
  invalidEmailCount: number;

  // UI state
  lastSelectedContactId?: string;
  searchQuery: string;
  activeTab: RecipientSelectionTab;

  // Search state
  searchLoading?: boolean;
  searchError?: string | null;

  // Pagination state
  currentPage?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  contactsLoading?: boolean;
  contactsError?: string | null;
}

// Selection actions
export interface RecipientSelectionActions {
  // Individual contact actions
  selectContact: (contactId: string) => void;
  deselectContact: (contactId: string) => void;
  toggleContact: (contactId: string) => void;
  selectContactRange: (fromId: string, toId: string) => void;

  // Group actions
  selectAllContacts: () => void;
  deselectAllContacts: () => void;
  selectTeamGroup: (team: TeamGroup) => void;
  deselectTeamGroup: (teamId: string) => void;
  selectRoleGroup: (role: RoleGroup) => void;
  deselectRoleGroup: (roleId: string) => void;

  // Utility actions
  clearAll: () => void;
  isContactSelected: (contactId: string) => boolean;
  getSelectedContacts: () => RecipientContact[];
  getEffectiveRecipients: () => RecipientContact[];

  // Search and filter
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: RecipientSelectionTab) => void;

  // Pagination
  goToNextPage?: () => Promise<void>;
  goToPrevPage?: () => Promise<void>;
}

// Tab types for the recipient selector
export type RecipientSelectionTab = 'contacts' | 'groups' | 'roles';

// Selection configuration
export interface RecipientSelectionConfig {
  allowAllContacts: boolean;
  allowTeamGroups: boolean;
  allowRoleGroups: boolean;
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
  teamGroups?: TeamGroup[];
  roleGroups?: RoleGroup[];
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
  config: RecipientSelectionConfig;
  contacts: RecipientContact[];
  teamGroups: TeamGroup[];
  roleGroups: RoleGroup[];
  validation: RecipientValidationResult;
}
