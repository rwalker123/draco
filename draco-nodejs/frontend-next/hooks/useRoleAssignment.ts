'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrentSeason } from './useCurrentSeason';
import { createUserManagementService } from '../services/userManagementService';
import { RoleWithContactType } from '@draco/shared-schemas';

export interface RoleAssignmentData {
  roleId: string;
  contactId: string;
  leagueId?: string;
  teamId?: string;
}

export interface RoleAssignmentResult {
  success: boolean;
  message?: string;
  error?: string;
  assignedRole?: RoleWithContactType;
}

/**
 * Generic hook for role assignment operations
 * Extracted from useUserManagement to make it reusable across different components
 */
export function useRoleAssignment(accountId: string) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { currentSeasonId } = useCurrentSeason(accountId);
  const userService = token ? createUserManagementService(token) : null;

  const assignRole = useCallback(
    async (targetAccountId: string, data: RoleAssignmentData): Promise<RoleAssignmentResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        // Determine the correct roleData based on the role type
        let roleData: string = accountId;
        let needsSeasonId = false;

        // Use the role IDs from roleUtils
        const ROLE_IDS = {
          ACCOUNT_ADMIN: '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A',
          ACCOUNT_PHOTO_ADMIN: 'a87ea9a3-47e2-49d1-9e1e-c35358d1a677',
          LEAGUE_ADMIN: '672DDF06-21AC-4D7C-B025-9319CC69281A',
          TEAM_ADMIN: '777D771B-1CBA-4126-B8F3-DD7F3478D40E',
          TEAM_PHOTO_ADMIN: '55FD3262-343F-4000-9561-6BB7F658DEB7',
        };

        switch (data.roleId) {
          case ROLE_IDS.LEAGUE_ADMIN:
            if (!data.leagueId) {
              return { success: false, error: 'Please select a league' };
            }
            roleData = data.leagueId;
            needsSeasonId = true;
            break;
          case ROLE_IDS.TEAM_ADMIN:
          case ROLE_IDS.TEAM_PHOTO_ADMIN:
            if (!data.teamId) {
              return { success: false, error: 'Please select a team' };
            }
            roleData = data.teamId;
            needsSeasonId = true;
            break;
          case ROLE_IDS.ACCOUNT_ADMIN:
          case ROLE_IDS.ACCOUNT_PHOTO_ADMIN:
            roleData = accountId;
            break;
          default:
            // For any other roles, use accountId as default
            roleData = accountId;
        }

        console.log('Attempting to assign role:', {
          accountId,
          contactId: data.contactId,
          roleId: data.roleId,
          roleData,
          seasonId: needsSeasonId ? currentSeasonId : undefined,
          userService: !!userService,
        });

        const assignedRole = await userService.assignRole(
          targetAccountId,
          data.contactId,
          data.roleId,
          roleData,
          needsSeasonId ? currentSeasonId : undefined,
        );

        return {
          success: true,
          message: 'Role assigned successfully',
          assignedRole,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, currentSeasonId],
  );

  const removeRole = useCallback(
    async (
      targetAccountId: string,
      contactId: string,
      roleId: string,
      roleData: string,
    ): Promise<RoleAssignmentResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        await userService.removeRole(targetAccountId, contactId, roleId, roleData);

        return { success: true, message: 'Role removed successfully' };
      } catch (err) {
        console.error('Role removal error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService],
  );

  return {
    assignRole,
    removeRole,
    loading,
  };
}
