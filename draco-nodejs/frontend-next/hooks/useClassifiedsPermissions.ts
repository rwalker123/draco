// useClassifiedsPermissions Hook
// Manages role-based access control for Player Classifieds

import { useCallback } from 'react';
import { useRole } from '../context/RoleContext';
import { IUseClassifiedsPermissionsReturn } from '../types/playerClassifieds';

interface UseClassifiedsPermissionsProps {
  accountId: string;
}

export const useClassifiedsPermissions =
  ({}: UseClassifiedsPermissionsProps): IUseClassifiedsPermissionsReturn => {
    const { userRoles, hasRole } = useRole();

    // Check if user can create Players Wanted
    const canCreatePlayersWanted = useCallback(() => {
      return hasRole('TeamAdmin') || hasRole('AccountAdmin') || hasRole('SuperAdmin');
    }, [hasRole]);

    // Check if user can edit Players Wanted
    const canEditPlayersWanted = useCallback(() => {
      return hasRole('TeamAdmin') || hasRole('AccountAdmin') || hasRole('SuperAdmin');
    }, [hasRole]);

    // Check if user can delete Players Wanted
    const canDeletePlayersWanted = useCallback(() => {
      return hasRole('TeamAdmin') || hasRole('AccountAdmin') || hasRole('SuperAdmin');
    }, [hasRole]);

    // Check if user can create Teams Wanted
    const canCreateTeamsWanted = useCallback(() => {
      // Teams Wanted can be created by anyone (public)
      return true;
    }, []);

    // Check if user can edit Teams Wanted
    const canEditTeamsWanted = useCallback(() => {
      // Teams Wanted editing requires access code, not role
      return true;
    }, []);

    // Check if user can delete Teams Wanted
    const canDeleteTeamsWanted = useCallback(() => {
      // Teams Wanted deletion requires access code, not role
      return true;
    }, []);

    // Check if user can search classifieds
    const canSearchClassifieds = useCallback(() => {
      return userRoles !== null && userRoles !== undefined; // Any authenticated user can search
    }, [userRoles]);

    // Check if user can view classifieds
    const canViewClassifieds = useCallback(() => {
      return userRoles !== null && userRoles !== undefined; // Any authenticated user can view
    }, [userRoles]);

    // Check if user can moderate classifieds
    const canModerateClassifieds = useCallback(() => {
      return hasRole('AccountAdmin') || hasRole('SuperAdmin');
    }, [hasRole]);

    return {
      canCreatePlayersWanted: canCreatePlayersWanted(),
      canEditPlayersWanted: canEditPlayersWanted(),
      canDeletePlayersWanted: canDeletePlayersWanted(),
      canCreateTeamsWanted: canCreateTeamsWanted(),
      canEditTeamsWanted: canEditTeamsWanted(),
      canDeleteTeamsWanted: canDeleteTeamsWanted(),
      canSearchClassifieds: canSearchClassifieds(),
      canViewClassifieds: canViewClassifieds(),
      canModerateClassifieds: canModerateClassifieds(),
    };
  };
