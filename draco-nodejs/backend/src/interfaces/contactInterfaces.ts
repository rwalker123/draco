export interface ContactQueryOptions {
  includeRoles?: boolean;
  searchQuery?: string;
  pagination?: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface ContactResponse {
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    userId: string | null;
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
