import { DependencyCheckResult, Role } from '../types/users';
import { ContactUpdateResponse } from '../types/userManagementTypeGuards';
import { ContactTransformationService } from './contactTransformationService';
import { handleApiErrorResponse } from '../utils/errorHandling';
import {
  ContactType,
  CreateContactType,
  RoleWithContactType,
  ContactRoleType,
} from '@draco/shared-schemas';

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
  private transformContactResponseToContact(response: ContactUpdateResponse): ContactType {
    return ContactTransformationService.transformContactUpdateResponse(response);
  }

  /**
   * Search users by name or email, or fetch all users if query is empty
   * This unified method handles both search and list-all functionality
   */
  async searchUsers(
    accountId: string,
    query: string = '', // Default to empty string for list-all
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

    // Only add query parameter if it's not empty
    if (query.trim()) {
      searchParams.set('q', query);
    }

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
        searchParams.set('page', pagination.page.toString());
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
    if (!data) {
      throw new Error(data.message || 'Failed to search users');
    }

    // Transform contacts to users format for frontend compatibility
    const usersWithRoles = (data.contacts || []).map((contact: ContactType) => contact);

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
    const response = await fetch('/api/roles/role-ids', {
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
    if (data.error) {
      throw new Error(data.error || 'Failed to load automatic role holders');
    }

    return data;
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
    const response = await fetch(`/api/roles/user-roles?accountId=${accountId}`, {
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
  ): Promise<RoleWithContactType> {
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

    const result = await response.json();
    return result;
  }

  /**
   * Remove a role from a user
   */
  async removeRole(
    accountId: string,
    contactId: string,
    roleId: string,
    roleData: string,
  ): Promise<ContactRoleType> {
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

    const data = await response.json();
    return data; // Backend now returns ContactRoleType with unique id
  }

  /**
   * Create a new contact
   */
  async createContact(
    accountId: string,
    contactData: CreateContactType,
    photoFile?: File | null,
  ): Promise<ContactType> {
    console.log('UserManagementService: Creating contact', { accountId, hasPhoto: !!photoFile });

    // Filter out undefined/empty values and format dates
    const backendData: Record<string, unknown> = {};
    if (contactData.firstName !== undefined) {
      backendData.firstName = contactData.firstName;
    }
    if (contactData.lastName !== undefined) {
      backendData.lastName = contactData.lastName;
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
    if (contactData.contactDetails?.streetAddress !== undefined) {
      backendData.streetAddress = contactData.contactDetails.streetAddress;
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
      contactData.contactDetails?.dateOfBirth !== undefined &&
      contactData.contactDetails?.dateOfBirth !== '' &&
      contactData.contactDetails?.dateOfBirth !== null
    ) {
      // Convert ISO datetime to YYYY-MM-DD format for backend validation
      try {
        const date = new Date(contactData.contactDetails.dateOfBirth);
        if (!isNaN(date.getTime())) {
          backendData.dateofbirth = date.toISOString().split('T')[0];
        }
      } catch {
        console.warn('Invalid dateofbirth format:', contactData.contactDetails.dateOfBirth);
        // Don't include invalid dates
      }
    } else if (contactData.contactDetails?.dateOfBirth === null) {
      // Explicitly set to null when provided as null
      backendData.dateOfBirth = null;
    }

    // Use FormData if photo is provided, otherwise use JSON
    let body: FormData | string;
    let headers: Record<string, string>;

    if (photoFile) {
      const formData = new FormData();
      // Add all contact data to form data - only include non-empty values
      Object.entries(backendData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      // Add photo file
      formData.append('photo', photoFile);

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

    const response = await fetch(`/api/accounts/${accountId}/contacts`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('UserManagementService: Create failed', { status: response.status, errorData });
      throw new Error(errorData.message || `Failed to create contact (${response.status})`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error || 'Failed to create contact');
    }

    return data;
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
    if (data.error) {
      throw new Error(data.error || 'Failed to check dependencies');
    }

    return data;
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
    if (data.error) {
      throw new Error(data.error || 'Failed to delete contact');
    }

    return data;
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
