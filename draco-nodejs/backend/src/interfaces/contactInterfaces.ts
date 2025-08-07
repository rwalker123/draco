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

// New interface for detailed contact information
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

export interface ContactResponse {
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    userId: string | null;
    photoUrl?: string; // URL to contact photo
    contactDetails?: ContactDetails; // Optional contact details
    contactroles?: Array<{
      id: string;
      roleId: string;
      roleName: string;
      roleData: string;
      contextName?: string;
    }>;
  }>;
  total: number;
  pagination?: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Type for raw SQL query result from getContactsWithRoles
export interface ContactWithRoleRow {
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
export interface ContactWithRoleAndDetailsRow extends ContactWithRoleRow {
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

// Canonical base Contact interface - single source of truth for Contact structure
export interface BaseContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  userId: string | null;
  photoUrl?: string; // URL to contact photo
  contactDetails?: ContactDetails;
}

// Contact roles sub-interface for reusability
export interface ContactRoleEntry {
  id: string;
  roleId: string;
  roleName: string;
  roleData: string;
  contextName?: string;
}

// Interface for contact entry used in internal processing (extends base)
export interface ContactEntry extends BaseContact {
  contactroles: ContactRoleEntry[];
}

// Interface for contact search results (extends base with search-specific fields)
export interface ContactSearchResult extends BaseContact {
  displayName: string;
  searchText: string;
  contactroles?: ContactRoleEntry[];
}

// Interface for raw SQL query result from getAvailablePlayers query
export interface AvailableContactRaw {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: Date | null;
  middlename: string | null;
  roster_id: bigint | null;
  firstyear: number | null;
  submitteddriverslicense: boolean | null;
}
