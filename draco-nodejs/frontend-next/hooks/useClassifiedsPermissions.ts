// useClassifiedsPermissions Hook
// Manages role-based access control for Player Classifieds

import { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';
import { IUseClassifiedsPermissionsReturn } from '../types/playerClassifieds';
import { playerClassifiedService } from '../services/playerClassifiedService';
import {
  PlayersWantedClassifiedType,
  TeamsWantedPublicClassifiedType,
} from '@draco/shared-schemas';

interface UseClassifiedsPermissionsProps {
  accountId: string;
}

export const useClassifiedsPermissions = ({
  accountId,
}: UseClassifiedsPermissionsProps): IUseClassifiedsPermissionsReturn => {
  const { userRoles, hasRole } = useRole();
  const { user } = useAuth();

  // State for tracking verified access codes
  const [verifiedAccessCodes, setVerifiedAccessCodes] = useState<Set<string>>(new Set());

  // Check if user can create Players Wanted
  const canCreatePlayersWanted = () => {
    // Any authenticated account user can create Players Wanted
    return userRoles !== null && userRoles !== undefined;
  };

  // Check if user can create Teams Wanted
  const canCreateTeamsWanted = () => {
    // Teams Wanted can be created by anyone (public)
    return true;
  };

  // Check if user can edit Teams Wanted (basic check)
  const canEditTeamsWanted = () => {
    // Teams Wanted editing requires access code, not role
    return true;
  };

  // Check if user can delete Teams Wanted (basic check)
  const canDeleteTeamsWanted = () => {
    // Teams Wanted deletion requires access code, not role
    return true;
  };

  // Check if user can search classifieds
  const canSearchClassifieds = () => {
    return userRoles !== null && userRoles !== undefined; // Any authenticated user can search
  };

  // Check if user can view classifieds
  const canViewClassifieds = () => {
    return userRoles !== null && userRoles !== undefined; // Any authenticated user can view
  };

  // Check if user can moderate classifieds
  const canModerateClassifieds = () => {
    return hasRole('AccountAdmin');
  };

  // Enhanced permission checking with ownership for Players Wanted
  const canEditPlayersWantedById = (classified: PlayersWantedClassifiedType): boolean => {
    // Admin override - AccountAdmin can edit any Players Wanted
    if (hasRole('AccountAdmin')) {
      return true;
    }

    // Creator ownership - user can edit their own classifieds
    if (user && classified.creator?.id === user.contact?.id) {
      return true;
    }

    // Role-based permissions
    return false;
  };

  const canDeletePlayersWantedById = (classified: PlayersWantedClassifiedType): boolean => {
    // Admin override - AccountAdmin can delete any Players Wanted
    if (hasRole('AccountAdmin')) {
      return true;
    }

    // Creator ownership - user can delete their own classifieds
    if (user && classified.creator?.id === user.contact?.id) {
      return true;
    }

    // Role-based permissions
    return false;
  };

  // Enhanced permission checking with access codes for Teams Wanted
  const canEditTeamsWantedById = (classified: TeamsWantedPublicClassifiedType): boolean => {
    // Admin override - AccountAdmin can edit any Teams Wanted
    if (hasRole('AccountAdmin')) {
      return true;
    }

    // Access code verification - user has verified access code
    if (verifiedAccessCodes.has(classified.id.toString())) {
      return true;
    }

    return false;
  };

  const canDeleteTeamsWantedById = (classified: TeamsWantedPublicClassifiedType): boolean => {
    // Admin override - AccountAdmin can delete any Teams Wanted
    if (hasRole('AccountAdmin')) {
      return true;
    }

    // Access code verification - user has verified access code
    if (verifiedAccessCodes.has(classified.id.toString())) {
      return true;
    }

    return false;
  };

  // Access code verification functions
  const verifyAccessCode = async (classifiedId: string, accessCode: string): Promise<boolean> => {
    try {
      // Call the verification endpoint
      await playerClassifiedService.verifyTeamsWantedAccess(accountId, classifiedId, accessCode);

      // Add to verified set
      setVerifiedAccessCodes((prev) => new Set(prev).add(classifiedId));
      return true;
    } catch (error) {
      console.error('Failed to verify access code:', error);
      return false;
    }
  };

  const clearVerifiedAccessCode = (classifiedId: string) => {
    setVerifiedAccessCodes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(classifiedId);
      return newSet;
    });
  };

  const clearAllVerifiedAccessCodes = () => {
    setVerifiedAccessCodes(new Set());
  };

  return {
    canCreatePlayersWanted: canCreatePlayersWanted(),
    canCreateTeamsWanted: canCreateTeamsWanted(),
    canEditTeamsWanted: canEditTeamsWanted(),
    canDeleteTeamsWanted: canDeleteTeamsWanted(),
    canSearchClassifieds: canSearchClassifieds(),
    canViewClassifieds: canViewClassifieds(),
    canModerateClassifieds: canModerateClassifieds(),

    // Enhanced permission checking with ownership
    canEditPlayersWantedById,
    canDeletePlayersWantedById,
    canEditTeamsWantedById,
    canDeleteTeamsWantedById,

    // Access code verification state
    verifiedAccessCodes,
    verifyAccessCode,
    clearVerifiedAccessCode,
    clearAllVerifiedAccessCodes,
  };
};
