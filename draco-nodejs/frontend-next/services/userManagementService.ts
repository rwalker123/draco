import { User, Role, UsersResponse, UserSearchParams, Contact, ContactRole } from '../types/users';
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
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      userId: contact.userId,
      roles:
        contact.contactroles?.map((cr: ContactRole) => ({
          id: cr.id,
          roleId: cr.roleId,
          roleName: cr.roleName || getRoleDisplayName(cr.roleId),
          roleData: cr.roleData,
          contextName: cr.contextName,
        })) || [],
    }));

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
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      userId: contact.userId,
      roles:
        contact.contactroles?.map((cr: ContactRole) => ({
          id: cr.id,
          roleId: cr.roleId,
          roleName: cr.roleName || getRoleDisplayName(cr.roleId),
          roleData: cr.roleData,
          contextName: cr.contextName,
        })) || [],
    }));

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
   * Assign a role to a user
   */
  async assignRole(accountId: string, contactId: string, roleId: string): Promise<void> {
    const response = await fetch(`/api/accounts/${accountId}/users/${contactId}/roles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleId,
        roleData: accountId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to assign role');
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(accountId: string, contactId: string, roleId: string): Promise<void> {
    const response = await fetch(
      `/api/accounts/${accountId}/contacts/${contactId}/roles/${roleId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleData: accountId,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to remove role');
    }
  }
}

/**
 * Create a UserManagementService instance
 */
export const createUserManagementService = (token: string): UserManagementService => {
  return new UserManagementService(token);
};
