import { DependencyCheckResult, Role } from '../types/users';
import { ContactUpdateResponse } from '../types/userManagementTypeGuards';
import { ContactTransformationService } from './contactTransformationService';
import { createContactMediaService } from './contactMediaService';
import { handleApiErrorResponse } from '../utils/errorHandling';
import {
  ContactType,
  CreateContactType,
  RoleWithContactType,
  ContactRoleType,
  ContactSearchParamsType,
} from '@draco/shared-schemas';
import {
  getCurrentUserRoles as apiGetCurrentUserRoles,
  listRoleIdentifiers,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';
import qs from 'qs';

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
  private client: Client;
  private mediaService: ReturnType<typeof createContactMediaService> | null;

  constructor(token: string) {
    this.token = token;
    this.client = createApiClient({ token });
    this.mediaService = createContactMediaService(token);
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
    const searchParams: ContactSearchParamsType = {
      q: query.trim() || undefined, // Only include 'q' if query is non-empty
      includeRoles: true,
      contactDetails: true,
      seasonId: seasonId || undefined,
      onlyWithRoles: onlyWithRoles || false,
      includeInactive: false,
      paging: {
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        skip: ((pagination?.page || 1) - 1) * (pagination?.limit || 10),
        sortBy: pagination?.sortBy || 'name',
        sortOrder: pagination?.sortOrder || 'asc',
      },
    };

    const queryString = qs.stringify(searchParams, { arrayFormat: 'indices', encode: true });
    const response = await fetch(`/api/accounts/${accountId}/contacts?${queryString}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

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
    const result = await listRoleIdentifiers({
      client: this.client,
      throwOnError: false,
    });

    const roles = unwrapApiResult(result, 'Failed to load roles');

    return roles.map((role) => ({
      id: role.roleId,
      name: role.roleName ?? role.roleId,
    }));
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
    const result = await apiGetCurrentUserRoles({
      client: this.client,
      throwOnError: false,
      query: {
        accountId,
      },
    });

    const data = unwrapApiResult(result, 'Failed to load user roles');

    return {
      userId: data.userId,
      username: data.userName,
      accountId: data.contactRoles?.[0]?.accountId ?? accountId,
      globalRoles: data.globalRoles ?? [],
      contactRoles: (data.contactRoles ?? []).map((role) => ({
        id: role.id,
        contactId: role.contact?.id ?? '',
        roleId: role.roleId,
        roleData: role.roleData,
        accountId: role.accountId ?? accountId,
      })),
    };
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
    if (!this.mediaService) {
      throw new Error('Media service unavailable');
    }

    await this.mediaService.deletePhoto(accountId, contactId);
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
