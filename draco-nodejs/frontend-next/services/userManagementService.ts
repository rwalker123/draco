import {
  User,
  Role,
  UsersResponse,
  UserSearchParams,
  Contact,
  ContactUpdateData,
  DependencyCheckResult,
} from '../types/users';
import {
  validateContactUpdateResponse,
  ContactUpdateResponse,
} from '../types/userManagementTypeGuards';
import { ContactTransformationService } from './contactTransformationService';
import { axiosInstance } from '../utils/axiosConfig';
import axios from 'axios';

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

    try {
      const response = await axiosInstance.get(
        `/api/accounts/${accountId}/contacts?${searchParams.toString()}`,
      );
      const data = response.data;

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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to load users');
      }
      throw error;
    }
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
  ): Promise<{ users: User[]; pagination: PaginationInfo }> {
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

    const response = await axiosInstance.get(
      `/api/accounts/${accountId}/contacts/search?${searchParams.toString()}`,
    );

    const data = response.data;
    if (!data.success) {
      throw new Error(data.message || 'Failed to search users');
    }

    // Transform contacts to users format for frontend compatibility
    const usersWithRoles = (data.data?.contacts || []).map((contact: Contact) =>
      this.transformContactToUser(contact),
    );

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
    const response = await axiosInstance.get('/api/roleTest/role-ids');

    const data = response.data;
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
    try {
      const response = await axiosInstance.get(`/api/accounts/${accountId}/automatic-role-holders`);

      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to load automatic role holders');
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to load automatic role holders');
      }
      throw error;
    }
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
    const response = await axiosInstance.get(`/api/roleTest/user-roles?accountId=${accountId}`);

    const data = response.data;
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

    try {
      await axiosInstance.post(`/api/accounts/${accountId}/users/${contactId}/roles`, body);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to assign role');
      } else {
        throw new Error('Failed to assign role');
      }
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
    try {
      await axiosInstance.delete(
        `/api/accounts/${accountId}/contacts/${contactId}/roles/${roleId}`,
        {
          data: {
            roleData: roleData,
          },
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to remove role');
      } else {
        throw new Error('Failed to remove role');
      }
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
    if (contactData.middleName !== undefined) {
      backendData.middleName = contactData.middleName;
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
    if (
      contactData.dateofbirth !== undefined &&
      contactData.dateofbirth !== '' &&
      contactData.dateofbirth !== null
    ) {
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
    } else if (contactData.dateofbirth === null) {
      // Explicitly set to null when provided as null
      backendData.dateofbirth = null;
    }

    console.log('UserManagementService: Filtered backendData:', backendData);

    // Use FormData if photo is provided, otherwise use JSON
    let body: FormData | string;

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
    } else {
      body = JSON.stringify(backendData);
    }

    console.log('UserManagementService: Making PUT request to update contact', {
      url: `/api/accounts/${accountId}/contacts/${contactId}`,
      hasPhoto: !!photoFile,
    });

    let response;
    try {
      if (photoFile) {
        // For FormData uploads with photos, use axios with special config
        response = await axiosInstance.put(
          `/api/accounts/${accountId}/contacts/${contactId}`,
          body,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
      } else {
        // For JSON updates without photos
        response = await axiosInstance.put(
          `/api/accounts/${accountId}/contacts/${contactId}`,
          JSON.parse(body as string),
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('UserManagementService: Update failed', {
          status: error.response?.status,
          errorData: error.response?.data,
        });
        throw new Error(
          error.response?.data?.message || `Failed to update contact (${error.response?.status})`,
        );
      }
      throw error;
    }

    console.log('UserManagementService: Response received', {
      status: response.status,
      headers: response.headers,
    });

    const data = response.data;
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
    if (contactData.middleName !== undefined) {
      backendData.middleName = contactData.middleName;
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
    if (
      contactData.dateofbirth !== undefined &&
      contactData.dateofbirth !== '' &&
      contactData.dateofbirth !== null
    ) {
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
    } else if (contactData.dateofbirth === null) {
      // Explicitly set to null when provided as null
      backendData.dateofbirth = null;
    }

    console.log('UserManagementService: Filtered backendData for creation:', backendData);

    // Use FormData if photo is provided, otherwise use JSON
    let body: FormData | string;

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
    } else {
      body = JSON.stringify(backendData);
    }

    console.log('UserManagementService: Making POST request to create contact', {
      url: `/api/accounts/${accountId}/contacts`,
      hasPhoto: !!photoFile,
    });

    let response;
    try {
      if (photoFile) {
        // For FormData uploads with photos, use axios with special config
        response = await axiosInstance.post(`/api/accounts/${accountId}/contacts`, body, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // For JSON creation without photos
        response = await axiosInstance.post(
          `/api/accounts/${accountId}/contacts`,
          JSON.parse(body as string),
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('UserManagementService: Create failed', {
          status: error.response?.status,
          errorData: error.response?.data,
        });
        throw new Error(
          error.response?.data?.message || `Failed to create contact (${error.response?.status})`,
        );
      }
      throw error;
    }

    console.log('UserManagementService: Response received', {
      status: response.status,
      headers: response.headers,
    });

    const data = response.data;
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
    try {
      await axiosInstance.delete(`/api/accounts/${accountId}/contacts/${contactId}/photo`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            `Failed to delete contact photo (${error.response?.status})`,
        );
      }
      throw error;
    }
  }

  /**
   * Check contact dependencies before deletion
   */
  async checkContactDependencies(
    accountId: string,
    contactId: string,
  ): Promise<{ contact: unknown; dependencyCheck: DependencyCheckResult }> {
    try {
      const response = await axiosInstance.delete(
        `/api/accounts/${accountId}/contacts/${contactId}?check=true`,
      );

      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to check dependencies');
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            `Failed to check dependencies (${error.response?.status})`,
        );
      }
      throw error;
    }
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
    try {
      const response = await axiosInstance.delete(
        `/api/accounts/${accountId}/contacts/${contactId}${queryParams}`,
      );

      const data = response.data;
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete contact');
      }

      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete contact');
      } else {
        throw new Error('Failed to delete contact');
      }
    }
  }

  /**
   * Revoke registration (unlink userId from contact)
   */
  async revokeRegistration(accountId: string, contactId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/api/accounts/${accountId}/contacts/${contactId}/registration`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            `Failed to revoke registration (${error.response?.status})`,
        );
      }
      throw error;
    }
  }
}

/**
 * Create a UserManagementService instance
 */
export const createUserManagementService = (token: string): UserManagementService => {
  return new UserManagementService(token);
};
