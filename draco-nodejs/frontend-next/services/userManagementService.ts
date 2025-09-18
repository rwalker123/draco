import { Role, UsersResponse, UserSearchParams, DependencyCheckResult } from '../types/users';
import {
  validateContactUpdateResponse,
  ContactUpdateResponse,
} from '../types/userManagementTypeGuards';
import { ContactTransformationService } from './contactTransformationService';
import { handleApiErrorResponse } from '../utils/errorHandling';
import { Contact, ContactType, CreateContactType } from '@draco/shared-schemas';

// Pagination interface for API responses
interface PaginationInfo {
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  total?: number;
}

/**
 * User Management Service
 * Centralized API service functions for user management operations
 */
export class UserManagementService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Transform ContactUpdateResponse (backend format) to Contact (frontend format)
   * Delegates to shared ContactTransformationService
   */
  private transformContactResponseToContact(response: ContactUpdateResponse): Contact {
    return ContactTransformationService.transformContactUpdateResponse(response);
  }

  /**
   * Fetch users with optional search and pagination
   */
  async fetchUsers(accountId: string, params: UserSearchParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    // Add pagination parameters
    searchParams.append('page', params.page.toString());
    searchParams.append('limit', params.limit.toString());

    // Add sorting parameters
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    // Add roles parameter to include role data
    searchParams.append('roles', 'true');

    // Add contact details parameter to include contact information
    searchParams.append('contactDetails', 'true');

    // Add seasonId parameter if provided
    if (params.seasonId) {
      searchParams.append('seasonId', params.seasonId);
    }

    // Add onlyWithRoles parameter if provided
    if (params.onlyWithRoles) {
      searchParams.append('onlyWithRoles', 'true');
    }

    const response = await fetch(`/api/accounts/${accountId}/contacts?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiErrorResponse(response, 'Failed to load users');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load users');
    }

    // Transform contacts to users format for frontend compatibility
    // Backend returns contacts array with contactroles, but frontend expects users with roles
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) => contact);

    return {
      users: usersWithRoles,
      pagination: data.pagination || {
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Search users by name or email
   */
  async searchUsers(
    accountId: string,
    query: string,
    seasonId?: string | null,
    onlyWithRoles?: boolean,
    pagination?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ users: ContactType[]; pagination: PaginationInfo }> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    searchParams.set('roles', 'true');
    searchParams.set('contactDetails', 'true');
    if (seasonId) {
      searchParams.set('seasonId', seasonId);
    }
    if (onlyWithRoles) {
      searchParams.set('onlyWithRoles', 'true');
    }

    // Add pagination parameters if provided
    if (pagination) {
      if (pagination.page !== undefined) {
        searchParams.set('page', (pagination.page + 1).toString()); // Backend uses 1-based pagination
      }
      if (pagination.limit !== undefined) {
        searchParams.set('limit', pagination.limit.toString());
      }
      if (pagination.sortBy) {
        searchParams.set('sortBy', pagination.sortBy);
      }
      if (pagination.sortOrder) {
        searchParams.set('sortOrder', pagination.sortOrder);
      }
    }

    const response = await fetch(
      `/api/accounts/${accountId}/contacts/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to search users');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to search users');
    }

    // Transform contacts to users format for frontend compatibility
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) => contact);

    return {
      users: usersWithRoles,
      pagination: data.pagination || {
        hasNext: false,
        hasPrev: false,
        total: usersWithRoles.length,
      },
    };
  }

  /**
   * Fetch available roles
   */
  async fetchRoles(): Promise<Role[]> {
    const response = await fetch('/api/roleTest/role-ids', {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load roles');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Failed to load roles');
    }

    return data.data.roles || [];
  }

  /**
   * Fetch automatic role holders (Account Owner and Team Managers)
   */
  async fetchAutomaticRoleHolders(accountId: string): Promise<{
    accountOwner: {
      contactId: string;
      firstName: string;
      lastName: string;
      email: string | null;
      photoUrl?: string;
    }; // NOT nullable - every account must have owner
    teamManagers: Array<{
      contactId: string;
      firstName: string;
      lastName: string;
      email: string | null;
      photoUrl?: string;
      teams: Array<{
        teamSeasonId: string;
        teamName: string;
      }>;
    }>;
  }> {
    const response = await fetch(`/api/accounts/${accountId}/automatic-role-holders`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load automatic role holders');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load automatic role holders');
    }

    return data.data;
  }

  /**
   * Get current user's roles for debugging
   */
  async getCurrentUserRoles(accountId: string): Promise<{
    userId: string;
    username: string;
    accountId: string;
    globalRoles: string[];
    contactRoles: Array<{
      id: string;
      contactId: string;
      roleId: string;
      roleData: string;
      accountId: string;
    }>;
  }> {
    const response = await fetch(`/api/roleTest/user-roles?accountId=${accountId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load user roles');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Failed to load user roles');
    }

    return data.data;
  }

  /**
   * Assign a role to a user
   */
  async assignRole(
    accountId: string,
    contactId: string,
    roleId: string,
    roleData: string,
    seasonId?: string | null,
  ): Promise<void> {
    const body: { roleId: string; roleData: string; seasonId?: string } = {
      roleId,
      roleData,
    };

    // Include seasonId if provided
    if (seasonId) {
      body.seasonId = seasonId;
    }

    const response = await fetch(`/api/accounts/${accountId}/users/${contactId}/roles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleApiErrorResponse(response, 'Failed to assign role');
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(
    accountId: string,
    contactId: string,
    roleId: string,
    roleData: string,
  ): Promise<void> {
    const response = await fetch(
      `/api/accounts/${accountId}/contacts/${contactId}/roles/${roleId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleData: roleData,
        }),
      },
    );

    if (!response.ok) {
      await handleApiErrorResponse(response, 'Failed to remove role');
    }
  }

  /**
   * Create a new contact
   */
  async createContact(
    accountId: string,
    contactData: CreateContactType,
    photoFile?: File | null,
  ): Promise<Contact> {
    console.log('UserManagementService: Creating contact', { accountId, hasPhoto: !!photoFile });

    // Filter out undefined/empty values and format dates
    const backendData: Record<string, unknown> = {};
    if (contactData.firstName !== undefined) {
      backendData.firstname = contactData.firstName;
    }
    if (contactData.lastName !== undefined) {
      backendData.lastname = contactData.lastName;
    }
    if (contactData.middleName !== undefined) {
      backendData.middleName = contactData.middleName;
    }
    if (contactData.email !== undefined) {
      backendData.email = contactData.email;
    }
    if (contactData.contactDetails?.phone1 !== undefined) {
      backendData.phone1 = contactData.contactDetails.phone1;
    }
    if (contactData.contactDetails?.phone2 !== undefined) {
      backendData.phone2 = contactData.contactDetails.phone2;
    }
    if (contactData.contactDetails?.phone3 !== undefined) {
      backendData.phone3 = contactData.contactDetails.phone3;
    }
    if (contactData.contactDetails?.streetaddress !== undefined) {
      backendData.streetaddress = contactData.contactDetails.streetaddress;
    }
    if (contactData.contactDetails?.city !== undefined) {
      backendData.city = contactData.contactDetails.city;
    }
    if (contactData.contactDetails?.state !== undefined) {
      backendData.state = contactData.contactDetails.state;
    }
    if (contactData.contactDetails?.zip !== undefined) {
      backendData.zip = contactData.contactDetails.zip;
    }
    if (
      contactData.contactDetails?.dateofbirth !== undefined &&
      contactData.contactDetails?.dateofbirth !== '' &&
      contactData.contactDetails?.dateofbirth !== null
    ) {
      // Convert ISO datetime to YYYY-MM-DD format for backend validation
      try {
        const date = new Date(contactData.contactDetails.dateofbirth);
        if (!isNaN(date.getTime())) {
          backendData.dateofbirth = date.toISOString().split('T')[0];
        }
      } catch {
        console.warn('Invalid dateofbirth format:', contactData.contactDetails.dateofbirth);
        // Don't include invalid dates
      }
    } else if (contactData.contactDetails?.dateofbirth === null) {
      // Explicitly set to null when provided as null
      backendData.dateofbirth = null;
    }

    console.log('UserManagementService: Filtered backendData for creation:', backendData);

    // Use FormData if photo is provided, otherwise use JSON
    let body: FormData | string;
    let headers: Record<string, string>;

    if (photoFile) {
      console.log('UserManagementService: Creating FormData with photo', {
        photoName: photoFile.name,
        photoSize: photoFile.size,
        contactData: backendData,
      });

      const formData = new FormData();
      // Add all contact data to form data - only include non-empty values
      Object.entries(backendData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      // Add photo file
      formData.append('photo', photoFile);

      console.log('UserManagementService: FormData entries:', Array.from(formData.entries()));

      body = formData;
      headers = {
        Authorization: `Bearer ${this.token}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      };
    } else {
      body = JSON.stringify(backendData);
      headers = {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      };
    }

    console.log('UserManagementService: Making POST request to create contact', {
      url: `/api/accounts/${accountId}/contacts`,
      hasPhoto: !!photoFile,
      headers: Object.keys(headers),
    });

    const response = await fetch(`/api/accounts/${accountId}/contacts`, {
      method: 'POST',
      headers,
      body,
    });

    console.log('UserManagementService: Response received', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('UserManagementService: Create failed', { status: response.status, errorData });
      throw new Error(errorData.message || `Failed to create contact (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create contact');
    }

    const validatedResponse = validateContactUpdateResponse(data.data.contact);
    return this.transformContactResponseToContact(validatedResponse);
  }

  /**
   * Delete contact photo
   */
  async deleteContactPhoto(accountId: string, contactId: string): Promise<void> {
    const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}/photo`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete contact photo (${response.status})`);
    }
  }

  /**
   * Check contact dependencies before deletion
   */
  async checkContactDependencies(
    accountId: string,
    contactId: string,
  ): Promise<{ contact: unknown; dependencyCheck: DependencyCheckResult }> {
    const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}?check=true`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to check dependencies (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to check dependencies');
    }

    return data.data;
  }

  /**
   * Delete contact
   */
  async deleteContact(
    accountId: string,
    contactId: string,
    force: boolean = false,
  ): Promise<{
    message: string;
    deletedContact: unknown;
    dependenciesDeleted: number;
    wasForced: boolean;
  }> {
    const queryParams = force ? '?force=true' : '';
    const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}${queryParams}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleApiErrorResponse(response, 'Failed to delete contact');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete contact');
    }

    return data.data;
  }

  /**
   * Revoke registration (unlink userId from contact)
   */
  async revokeRegistration(accountId: string, contactId: string): Promise<void> {
    const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}/registration`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to revoke registration (${response.status})`);
    }
  }
}

/**
 * Create a UserManagementService instance
 */
export const createUserManagementService = (token: string): UserManagementService => {
  return new UserManagementService(token);
};
