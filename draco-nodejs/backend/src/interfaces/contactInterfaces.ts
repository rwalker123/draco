import { Contact, ContactRole, BaseContact } from '@draco/shared-schemas';

export interface ContactQueryOptions {
  includeRoles?: boolean;
  onlyWithRoles?: boolean;
  searchQuery?: string;
  includeContactDetails?: boolean; // New option to include contact details
  pagination?: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// Interface for contact input data from forms (for create/update operations)
export interface ContactInputData {
  firstname?: string;
  lastname?: string;
  middlename?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetaddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  dateofbirth?: string;
}

export interface BaseContactResponse {
  contacts: Array<BaseContact>;
  total: number;
  pagination?: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ContactResponse {
  contacts: Array<Contact>;
  total: number;
  pagination?: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Type for raw SQL query result from getContactsWithRoles
export interface ContactWithRoleRaw {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string | null;
  userid: string | null;
  role_context_name: string | null;
  roleid: string | null;
  roledata: bigint | null;
}

// Extended type for raw SQL query result with contact details
export interface ContactWithRoleAndDetailsRaw extends ContactWithRoleRaw {
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: Date | null;
  middlename: string | null;
}
// Interface for contact search results (extends base with search-specific fields)
export interface ContactSearchResult extends BaseContact {
  displayName: string;
  searchText: string;
  contactroles?: ContactRole[];
}

// Interface for raw account owner query result from getAutomaticRoleHolders
export interface AccountOwnerRaw {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string | null;
  userid: string | null;
}

// Team manager with associated teams (extends BaseContact)
export interface TeamManagerWithTeams extends BaseContact {
  teams: Array<{
    teamSeasonId: string;
    teamName: string;
  }>;
}

// Clean return type for getAutomaticRoleHolders
export interface AutomaticRoleHoldersResponse {
  accountOwner: BaseContact; // NOT nullable - every account must have owner
  teamManagers: TeamManagerWithTeams[];
}
