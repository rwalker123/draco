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
    
    // Add pagination parameters
    searchParams.append('page', params.page.toString());
    searchParams.append('limit', params.limit.toString());
    
    // Add sorting parameters
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await fetch(
      `/api/accounts/${accountId}/contacts?${searchParams.toString()}`,
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

    // Transform contacts to users format for frontend compatibility
    // Backend returns contacts array, but frontend expects users
    const usersWithRoles = (data.data.contacts || []).map((contact: Omit<User, 'roles'>) => ({
      ...contact,
      roles: [] // TODO: Backend API needs to include roles in response
    }));

    return {
      users: usersWithRoles,
      total: data.pagination.total || 0,
    };
  }

  /**
   * Search users by name or email
   */
  async searchUsers(accountId: string, query: string): Promise<User[]> {
    const response = await fetch(
      `/api/accounts/${accountId}/contacts/search?q=${encodeURIComponent(query)}`,
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
    const usersWithRoles = (data.data.contacts || []).map((contact: Omit<User, 'roles'>) => ({
      ...contact,
      roles: [] // TODO: Backend API needs to include roles in response
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