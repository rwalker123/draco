import { User, Role, UsersResponse, UserSearchParams } from '../types/users';

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
    if (params.search) searchParams.append('search', params.search);
    searchParams.append('page', params.page.toString());
    searchParams.append('limit', params.limit.toString());

    const response = await fetch(
      `/api/accounts/${accountId}/users?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load users');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load users');
    }

    // TODO: Backend API needs to include roles in response
    // Currently users don't have roles property, so we set empty arrays
    const usersWithRoles = (data.data.users || []).map((user: Omit<User, 'roles'>) => ({
      ...user,
      roles: [] // Ensure roles property exists
    }));

    return {
      users: usersWithRoles,
      total: data.data.total || 0,
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
      `/api/accounts/${accountId}/users/${contactId}/roles/${roleId}`,
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