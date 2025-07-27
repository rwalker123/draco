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
      roleData: string;
    }>;
  }>;
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
