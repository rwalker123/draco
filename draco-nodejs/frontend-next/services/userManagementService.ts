import {
  User,
  Role,
  UsersResponse,
  UserSearchParams,
  Contact,
  ContactUpdateData,
  DependencyCheckResult,
} from '../types/users';
import { validateContactUpdateResponse, ContactUpdateResponse } from '../types/typeGuards';
import { ContactTransformationService } from './contactTransformationService';

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
   * Transform Contact to User format
   * Delegates to shared ContactTransformationService
   */
  private transformContactToUser(contact: Contact): User {
    return ContactTransformationService.transformContactToUser(contact);
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
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) =>
      this.transformContactToUser(contact),
    );

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
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) =>
      this.transformContactToUser(contact),
    );

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
   * Update contact information (with optional photo)
   */
  async updateContact(
    accountId: string,
    contactId: string,
    contactData: ContactUpdateData,
    photoFile?: File | null,
  ): Promise<Contact> {
    console.log('UserManagementService.updateContact called with:', {
      contactId,
      contactData,
      hasPhotoFile: !!photoFile,
      photoFileName: photoFile?.name,
    });

    // Transform camelCase frontend data to lowercase backend API format
    // Only include fields that have actual values (not empty strings)
    const backendData: Record<string, unknown> = {};

    if (contactData.firstName && contactData.firstName.trim()) {
      backendData.firstname = contactData.firstName.trim();
    }
    if (contactData.lastName && contactData.lastName.trim()) {
      backendData.lastname = contactData.lastName.trim();
    }
    if (contactData.middlename !== undefined) {
      backendData.middlename = contactData.middlename;
    }
    if (contactData.email && contactData.email.trim()) {
      backendData.email = contactData.email.trim();
    }
    if (contactData.phone1 !== undefined) {
      backendData.phone1 = contactData.phone1;
    }
    if (contactData.phone2 !== undefined) {
      backendData.phone2 = contactData.phone2;
    }
    if (contactData.phone3 !== undefined) {
      backendData.phone3 = contactData.phone3;
    }
    if (contactData.streetaddress !== undefined) {
      backendData.streetaddress = contactData.streetaddress;
    }
    if (contactData.city !== undefined) {
      backendData.city = contactData.city;
    }
    if (contactData.state !== undefined) {
      backendData.state = contactData.state;
    }
    if (contactData.zip !== undefined) {
      backendData.zip = contactData.zip;
    }
    if (contactData.dateofbirth !== undefined && contactData.dateofbirth !== '') {
      // Convert ISO datetime to YYYY-MM-DD format for backend validation
      try {
        const date = new Date(contactData.dateofbirth);
        if (!isNaN(date.getTime())) {
          backendData.dateofbirth = date.toISOString().split('T')[0];
        }
      } catch {
        console.warn('Invalid dateofbirth format:', contactData.dateofbirth);
        // Don't include invalid dates
      }
    }

    console.log('UserManagementService: Filtered backendData:', backendData);

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

    console.log('UserManagementService: Making PUT request to update contact', {
      url: `/api/accounts/${accountId}/contacts/${contactId}`,
      hasPhoto: !!photoFile,
      headers: Object.keys(headers),
    });

    const response = await fetch(`/api/accounts/${accountId}/contacts/${contactId}`, {
      method: 'PUT',
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
      console.error('UserManagementService: Update failed', { status: response.status, errorData });
      throw new Error(errorData.message || `Failed to update contact (${response.status})`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update contact');
    }

    const validatedResponse = validateContactUpdateResponse(data.data.contact);
    return this.transformContactResponseToContact(validatedResponse);
  }

  /**
   * Create a new contact
   */
  async createContact(
    accountId: string,
    contactData: ContactUpdateData,
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
    if (contactData.middlename !== undefined) {
      backendData.middlename = contactData.middlename;
    }
    if (contactData.email !== undefined) {
      backendData.email = contactData.email;
    }
    if (contactData.phone1 !== undefined) {
      backendData.phone1 = contactData.phone1;
    }
    if (contactData.phone2 !== undefined) {
      backendData.phone2 = contactData.phone2;
    }
    if (contactData.phone3 !== undefined) {
      backendData.phone3 = contactData.phone3;
    }
    if (contactData.streetaddress !== undefined) {
      backendData.streetaddress = contactData.streetaddress;
    }
    if (contactData.city !== undefined) {
      backendData.city = contactData.city;
    }
    if (contactData.state !== undefined) {
      backendData.state = contactData.state;
    }
    if (contactData.zip !== undefined) {
      backendData.zip = contactData.zip;
    }
    if (contactData.dateofbirth !== undefined && contactData.dateofbirth !== '') {
      // Convert ISO datetime to YYYY-MM-DD format for backend validation
      try {
        const date = new Date(contactData.dateofbirth);
        if (!isNaN(date.getTime())) {
          backendData.dateofbirth = date.toISOString().split('T')[0];
        }
      } catch {
        console.warn('Invalid dateofbirth format:', contactData.dateofbirth);
        // Don't include invalid dates
      }
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
