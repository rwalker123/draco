import { BaseContactType, ContactRoleType, PagingType } from '@draco/shared-schemas';

export interface ContactQueryOptions {
  includeRoles?: boolean;
  onlyWithRoles?: boolean;
  searchQuery?: string;
  includeContactDetails?: boolean; // New option to include contact details
  pagination?: PagingType;
}

// Interface for contact search results (extends base with search-specific fields)
export interface ContactSearchResult extends BaseContactType {
  displayName: string;
  searchText: string;
  contactroles?: ContactRoleType[];
}
