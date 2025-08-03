import {
  User,
  Role,
  UsersResponse,
  UserSearchParams,
  Contact,
  ContactRole,
  ContactUpdateData,
  DependencyCheckResult,
} from '../types/users';
import { getRoleDisplayName } from '../utils/roleUtils';

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load users');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load users');
    }

    // Transform contacts to users format for frontend compatibility
    // Backend returns contacts array with contactroles, but frontend expects users with roles
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) => {
      const transformedRoles =
        contact.contactroles?.map((cr: ContactRole) => ({
          id: cr.id,
          roleId: cr.roleId,
          roleName: cr.roleName || getRoleDisplayName(cr.roleId),
          roleData: cr.roleData,
          contextName: cr.contextName,
        })) || [];

      return {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        userId: contact.userId,
        contactDetails: contact.contactDetails,
        roles: transformedRoles,
      };
    });

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
  ): Promise<User[]> {
    const url = new URL(`/api/accounts/${accountId}/contacts/search`, window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('roles', 'true');
    url.searchParams.set('contactDetails', 'true');
    if (seasonId) {
      url.searchParams.set('seasonId', seasonId);
    }
    if (onlyWithRoles) {
      url.searchParams.set('onlyWithRoles', 'true');
    }

    const response = await fetch(url.toString(), {
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
    if (!data.success) {
      throw new Error(data.message || 'Failed to search users');
    }

    // Transform contacts to users format for frontend compatibility
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) => {
      const transformedRoles =
        contact.contactroles?.map((cr: ContactRole) => ({
          id: cr.id,
          roleId: cr.roleId,
          roleName: cr.roleName || getRoleDisplayName(cr.roleId),
          roleData: cr.roleData,
          contextName: cr.contextName,
        })) || [];

      return {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        userId: contact.userId,
        contactDetails: contact.contactDetails,
        roles: transformedRoles,
      };
    });

    return usersWithRoles;
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to assign role (${response.status})`);
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to remove role');
    }
  }

  /**
   * Update contact information
   */
  async updateContact(
    accountId: string,
    contactId: string,
    contactData: ContactUpdateData,
  ): Promise<Contact> {
    // Transform camelCase frontend data to lowercase backend API format
    const backendData = {
      firstname: contactData.firstName,
      lastname: contactData.lastName,
      middlename: contactData.middlename,
      email: contactData.email,
      phone1: contactData.phone1,
      phone2: contactData.phone2,
      phone3: contactData.phone3,
      streetaddress: contactData.streetaddress,
      city: contactData.city,
      state: contactData.state,
      zip: contactData.zip,
      dateofbirth: contactData.dateofbirth,
    };

    const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update contact (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update contact');
    }

    return data.data.contact;
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete contact (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete contact');
    }

    return data.data;
  }
}

/**
 * Create a UserManagementService instance
 */
export const createUserManagementService = (token: string): UserManagementService => {
  return new UserManagementService(token);
};
