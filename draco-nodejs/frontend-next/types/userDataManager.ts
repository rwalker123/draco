import { ContactType } from '@draco/shared-schemas';

// Data Manager Interfaces
export interface UserDataManager {
  setLoading(isPaginating?: boolean, page?: number): void;
  setData(users: ContactType[], hasNext: boolean, hasPrev: boolean, page?: number): void;
  setError(error: string): void;
  clearData(): void;
  handleApiError(error: unknown, operation: string): void;
}

// API Operations Interfaces
export interface FetchUsersParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  seasonId: string | null;
  onlyWithRoles?: boolean;
}

export interface SearchUsersParams {
  searchTerm: string;
  seasonId: string | null;
  onlyWithRoles?: boolean;
  // Add pagination parameters for unified functionality
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserResponse {
  users: ContactType[];
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserApiOperations {
  searchUsersWithFilter(params: SearchUsersParams): Promise<UserResponse>;
  assignRole(params: AssignRoleParams): Promise<void>;
  removeRole(params: RemoveRoleParams): Promise<void>;
  deleteContact(params: DeleteContactParams): Promise<void>;
  deleteContactPhoto(params: DeletePhotoParams): Promise<void>;
}

export interface AssignRoleParams {
  contactId: string;
  roleId: string;
  roleData: string;
  seasonId?: string;
}

export interface RemoveRoleParams {
  contactId: string;
  roleId: string;
  roleData: string;
}

export interface DeleteContactParams {
  contactId: string;
  force: boolean;
}

export interface DeletePhotoParams {
  contactId: string;
}
