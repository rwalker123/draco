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

export interface ContactResponse {
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    userId: string | null;
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

// Interface for contact entry used in internal processing
export interface ContactEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  userId: string | null;
  contactDetails?: ContactDetails;
  contactroles: Array<{
    id: string;
    roleId: string;
    roleName: string;
    roleData: string;
    contextName?: string;
  }>;
}
