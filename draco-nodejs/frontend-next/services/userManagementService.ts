import { DependencyCheckResult, Role } from '../types/users';
import { ContactUpdateResponse } from '../types/userManagementTypeGuards';
import { ContactTransformationService } from './contactTransformationService';
import { createContactMediaService } from './contactMediaService';
import {
  ContactType,
  CreateContactType,
  RoleWithContactType,
  ContactRoleType,
  ContactSearchParamsType,
  AutomaticRoleHoldersType,
  AutoRegisterContactResponseType,
} from '@draco/shared-schemas';
import {
  assignRoleToUser,
  createContact as apiCreateContact,
  deleteContact as apiDeleteContact,
  getAutomaticRoleHolders as apiGetAutomaticRoleHolders,
  getContact as apiGetContact,
  getCurrentUserRoles as apiGetCurrentUserRoles,
  listRoleIdentifiers,
  removeRoleFromUser,
  searchContacts,
  unlinkContactFromUser,
  autoRegisterContact,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult, getApiErrorMessage, ApiClientError } from '../utils/apiResult';

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
    // Flat pagination params (API client serializes as flat query params, backend calculates skip)
    const searchParams: ContactSearchParamsType = {
      q: query.trim() || undefined,
      includeRoles: true,
      contactDetails: true,
      seasonId: seasonId || undefined,
      onlyWithRoles: onlyWithRoles || false,
      includeInactive: false,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
      sortBy: pagination?.sortBy || 'name',
      sortOrder: pagination?.sortOrder || 'asc',
    };

    const result = await searchContacts({
      client: this.client,
      path: { accountId },
      query: searchParams,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to search users');
    const usersWithRoles = data.contacts || [];

    const paginationInfo: PaginationInfo = {
      page: data.pagination?.page ?? searchParams.page ?? 1,
      limit: data.pagination?.limit ?? searchParams.limit ?? usersWithRoles.length,
      hasNext: data.pagination?.hasNext ?? false,
      hasPrev: data.pagination?.hasPrev ?? false,
      total: data.total ?? usersWithRoles.length,
    };

    return {
      users: usersWithRoles as ContactType[],
      pagination: paginationInfo,
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
  async fetchAutomaticRoleHolders(accountId: string): Promise<AutomaticRoleHoldersType> {
    const result = await apiGetAutomaticRoleHolders({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });

    return unwrapApiResult(
      result,
      'Failed to load automatic role holders',
    ) as AutomaticRoleHoldersType;
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
    _seasonId?: string | null,
  ): Promise<RoleWithContactType> {
    const payload = {
      roleId,
      roleData,
    };

    const result = await assignRoleToUser({
      client: this.client,
      path: { accountId, contactId },
      body: payload,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to assign role');
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
    const result = await removeRoleFromUser({
      client: this.client,
      path: { accountId, contactId, roleId },
      body: { roleData },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to remove role');
  }

  /**
   * Create a new contact
   */
  async createContact(
    accountId: string,
    contactData: CreateContactType,
    photoFile?: File | null,
  ): Promise<ContactType> {
    const result = photoFile
      ? await apiCreateContact({
          client: this.client,
          path: { accountId },
          body: { ...contactData, photo: photoFile },
          throwOnError: false,
          headers: { 'Content-Type': null },
          ...formDataBodySerializer,
        })
      : await apiCreateContact({
          client: this.client,
          path: { accountId },
          body: { ...contactData, photo: undefined },
          throwOnError: false,
        });

    return unwrapApiResult(result, 'Failed to create contact') as ContactType;
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
    const result = await apiDeleteContact({
      client: this.client,
      path: { accountId, contactId },
      query: { check: true },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to check dependencies');

    if (!data.dependencyCheck) {
      throw new Error('Failed to check dependencies');
    }

    const dependencyCheck: DependencyCheckResult = {
      canDelete: data.dependencyCheck.canDelete,
      dependencies: data.dependencyCheck.dependencies ?? [],
      message: data.dependencyCheck.message,
      totalDependencies: data.dependencyCheck.totalDependencies,
    };

    return {
      contact: data.contact,
      dependencyCheck,
    };
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
    const result = await apiDeleteContact({
      client: this.client,
      path: { accountId, contactId },
      query: force ? { force: true } : undefined,
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to delete contact');

    return {
      message: force ? 'Contact deleted with dependencies' : 'Contact deleted successfully',
      deletedContact: data.deletedContact,
      dependenciesDeleted: data.dependenciesDeleted ?? 0,
      wasForced: data.wasForced ?? force,
    };
  }

  /**
   * Revoke registration (unlink userId from contact)
   */
  async revokeRegistration(accountId: string, contactId: string): Promise<void> {
    const result = await unlinkContactFromUser({
      client: this.client,
      path: { accountId, contactId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to revoke registration');
  }

  async autoRegisterContact(
    accountId: string,
    contactId: string,
  ): Promise<AutoRegisterContactResponseType> {
    const result = await autoRegisterContact({
      client: this.client,
      path: { accountId, contactId },
      throwOnError: false,
    });

    const typedResult = result as { data?: unknown; error?: unknown; response?: Response };

    if (typedResult.error || (typedResult.response && typedResult.response.status >= 400)) {
      const message = getApiErrorMessage(typedResult.error, 'Failed to auto-register contact');
      throw new ApiClientError(message, {
        status: typedResult.response?.status,
        response: typedResult.response,
        details: typedResult.error,
      });
    }

    if (typedResult.data) {
      return typedResult.data as AutoRegisterContactResponseType;
    }

    throw new ApiClientError('Failed to auto-register contact', {
      status: typedResult.response?.status,
      response: typedResult.response,
      details: typedResult.error,
    });
  }

  async getContact(accountId: string, contactId: string): Promise<ContactType> {
    const result = await apiGetContact({
      client: this.client,
      path: { accountId, contactId },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load contact');
  }
}

/**
 * Create a UserManagementService instance
 */
export const createUserManagementService = (token: string): UserManagementService => {
  return new UserManagementService(token);
};
