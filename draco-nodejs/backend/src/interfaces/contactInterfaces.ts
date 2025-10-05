import { PagingType } from '@draco/shared-schemas';

export interface ContactQueryOptions {
  includeRoles?: boolean;
  onlyWithRoles?: boolean;
  searchQuery?: string;
  includeContactDetails?: boolean; // New option to include contact details
  pagination?: PagingType;
}
