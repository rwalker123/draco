import { ContactFilterFieldType, ContactFilterOpType, PagingType } from '@draco/shared-schemas';

export interface AdvancedFilterOptions {
  filterField?: ContactFilterFieldType;
  filterOp?: ContactFilterOpType;
  filterValue?: string;
}

export interface ContactQueryOptions {
  includeRoles?: boolean;
  onlyWithRoles?: boolean;
  searchQuery?: string;
  includeContactDetails?: boolean;
  pagination?: PagingType;
  advancedFilter?: AdvancedFilterOptions;
}
