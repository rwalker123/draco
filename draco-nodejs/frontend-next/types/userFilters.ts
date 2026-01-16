import { ContactFilterFieldType, ContactFilterOpType } from '@draco/shared-schemas';

export interface UserFilterState {
  filterField: ContactFilterFieldType | '';
  filterOp: ContactFilterOpType | '';
  filterValue: string;
}

export interface UserSortState {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface FilterOption {
  value: ContactFilterFieldType;
  label: string;
  type: 'string' | 'number';
}

export interface FilterOpOption {
  value: ContactFilterOpType;
  label: string;
  applicableTypes: Array<'string' | 'number'>;
}

export const FILTER_FIELDS: FilterOption[] = [
  { value: 'lastName', label: 'Last Name', type: 'string' },
  { value: 'firstName', label: 'First Name', type: 'string' },
  { value: 'firstYear', label: 'First Year', type: 'number' },
  { value: 'birthYear', label: 'Birth Year', type: 'number' },
  { value: 'zip', label: 'Zip Code', type: 'string' },
];

export const FILTER_OPERATIONS: FilterOpOption[] = [
  { value: 'startsWith', label: 'Starts With', applicableTypes: ['string'] },
  { value: 'endsWith', label: 'Ends With', applicableTypes: ['string'] },
  { value: 'equals', label: 'Equals', applicableTypes: ['string', 'number'] },
  { value: 'notEquals', label: 'Not Equals', applicableTypes: ['string', 'number'] },
  { value: 'contains', label: 'Contains', applicableTypes: ['string'] },
  { value: 'greaterThan', label: 'Greater Than', applicableTypes: ['number'] },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal', applicableTypes: ['number'] },
  { value: 'lessThan', label: 'Less Than', applicableTypes: ['number'] },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal', applicableTypes: ['number'] },
];

export const SORT_FIELDS = [
  { value: 'lastname', label: 'Last Name' },
  { value: 'firstname', label: 'First Name' },
  { value: 'email', label: 'Email' },
  { value: 'dateofbirth', label: 'Date of Birth' },
  { value: 'firstyear', label: 'First Year' },
  { value: 'zip', label: 'Zip Code' },
];

export function getApplicableOperations(fieldType: 'string' | 'number'): FilterOpOption[] {
  return FILTER_OPERATIONS.filter((op) => op.applicableTypes.includes(fieldType));
}

export function getFieldType(field: ContactFilterFieldType): 'string' | 'number' {
  const fieldOption = FILTER_FIELDS.find((f) => f.value === field);
  return fieldOption?.type ?? 'string';
}
