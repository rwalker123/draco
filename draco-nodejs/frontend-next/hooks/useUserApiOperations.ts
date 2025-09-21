import { useCallback } from 'react';
import { UserManagementService } from '../services/userManagementService';
import {
  UserApiOperations,
  SearchUsersParams,
  AssignRoleParams,
  RemoveRoleParams,
  DeleteContactParams,
  DeletePhotoParams,
} from '../types/userDataManager';

export const useUserApiOperations = (
  userService: UserManagementService,
  accountId: string,
): UserApiOperations => {
  const searchUsersWithFilter = useCallback(
    async (params: SearchUsersParams) => {
      const result = await userService.searchUsers(
        accountId,
        params.searchTerm,
        params.seasonId,
        params.onlyWithRoles,
        {
          page: params.page || 1,
          limit: params.limit || 50,
          sortBy: params.sortBy || 'lastname',
          sortOrder: params.sortOrder || 'asc',
        },
      );
      return {
        users: result.users,
        pagination: {
          hasNext: result.pagination.hasNext || false,
          hasPrev: result.pagination.hasPrev || false,
        },
      };
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

  const deleteContact = useCallback(
    async (params: DeleteContactParams) => {
      await userService.deleteContact(accountId, params.contactId, params.force);
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
    searchUsersWithFilter,
    assignRole,
    removeRole,
    deleteContact,
    deleteContactPhoto,
  };
};
