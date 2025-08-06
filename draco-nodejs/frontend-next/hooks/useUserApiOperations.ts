import { useCallback } from 'react';
import { UserManagementService } from '../services/userManagementService';
import {
  UserApiOperations,
  FetchUsersParams,
  SearchUsersParams,
  AssignRoleParams,
  RemoveRoleParams,
  CreateContactParams,
  UpdateContactParams,
  DeleteContactParams,
  DeletePhotoParams,
} from '../types/userDataManager';

export const useUserApiOperations = (
  userService: UserManagementService,
  accountId: string,
): UserApiOperations => {
  const fetchUsersWithFilter = useCallback(
    async (params: FetchUsersParams) => {
      return await userService.fetchUsers(accountId, {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        seasonId: params.seasonId,
        onlyWithRoles: params.onlyWithRoles,
      });
    },
    [userService, accountId],
  );

  const searchUsersWithFilter = useCallback(
    async (params: SearchUsersParams) => {
      return await userService.searchUsers(
        accountId,
        params.searchTerm,
        params.seasonId,
        params.onlyWithRoles,
      );
    },
    [userService, accountId],
  );

  const assignRole = useCallback(
    async (params: AssignRoleParams) => {
      await userService.assignRole(
        accountId,
        params.contactId,
        params.roleId,
        params.roleData,
        params.seasonId,
      );
    },
    [userService, accountId],
  );

  const removeRole = useCallback(
    async (params: RemoveRoleParams) => {
      await userService.removeRole(accountId, params.contactId, params.roleId, params.roleData);
    },
    [userService, accountId],
  );

  const createContact = useCallback(
    async (params: CreateContactParams) => {
      await userService.createContact(accountId, params.contactData, params.photoFile);
    },
    [userService, accountId],
  );

  const updateContact = useCallback(
    async (params: UpdateContactParams) => {
      return await userService.updateContact(
        accountId,
        params.contactId,
        params.contactData,
        params.photoFile,
      );
    },
    [userService, accountId],
  );

  const deleteContact = useCallback(
    async (params: DeleteContactParams) => {
      return await userService.deleteContact(accountId, params.contactId, params.force);
    },
    [userService, accountId],
  );

  const deleteContactPhoto = useCallback(
    async (params: DeletePhotoParams) => {
      await userService.deleteContactPhoto(accountId, params.contactId);
    },
    [userService, accountId],
  );

  return {
    fetchUsersWithFilter,
    searchUsersWithFilter,
    assignRole,
    removeRole,
    createContact,
    updateContact,
    deleteContact,
    deleteContactPhoto,
  };
};
