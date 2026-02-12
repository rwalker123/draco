'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ROLE_NAME_TO_ID } from '../utils/roleUtils';
import { useParams } from 'next/navigation';
import { getCurrentUserRoles, getRoleMetadata } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from '../hooks/useApiClient';
import { RoleMetadataSchemaType, RoleWithContactType } from '@draco/shared-schemas';

interface UserRoles {
  accountId: string;
  globalRoles: string[];
  contactRoles: RoleWithContactType[];
}

export interface RoleContextType {
  userRoles: UserRoles | null;
  roleMetadata: RoleMetadataSchemaType | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  isAdministrator: boolean;
  manageableAccountIds: string[];
  hasManageableAccount: boolean;
  hasRole: (roleId: string, context?: RoleContext) => boolean;
  hasPermission: (permission: string, context?: RoleContext) => boolean;
  hasRoleInAccount: (roleId: string, accountId: string) => boolean;
  hasRoleInTeam: (roleId: string, teamId: string) => boolean;
  hasRoleInLeague: (roleId: string, leagueId: string) => boolean;
  clearRoles: () => void;
}

interface RoleContext {
  accountId?: string;
  teamId?: string;
  leagueId?: string;
  seasonId?: string;
}

// Cache keys for sessionStorage
const ROLE_METADATA_CLIENT_VERSION = '1.7.0';
const ROLE_METADATA_CACHE_KEY = `draco_role_metadata_${ROLE_METADATA_CLIENT_VERSION}`;

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [roleMetadata, setRoleMetadata] = useState<RoleMetadataSchemaType | null>(null);
  const { accountId } = useParams();
  const apiClient = useApiClient();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  // Initialize loading as true if we have auth but need to fetch roles
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeRoleId = (roleId?: string | null) => (roleId ? roleId.toLowerCase() : undefined);

  const getHierarchyForRole = (roleId?: string | null): string[] => {
    if (!roleMetadata || !roleId) return [];

    const candidates = [roleId, roleId.toUpperCase(), roleId.toLowerCase()];
    for (const candidate of candidates) {
      const hierarchy = roleMetadata.hierarchy[candidate];
      if (hierarchy) {
        return hierarchy.map((id) => id.toLowerCase());
      }
    }
    return [];
  };

  const getPermissionsForRole = (
    roleId?: string | null,
  ): { roleId: string; permissions: string[]; context: string } | undefined => {
    if (!roleMetadata || !roleId) return undefined;

    const candidates = [roleId, roleId.toUpperCase(), roleId.toLowerCase()];
    for (const candidate of candidates) {
      const perms = roleMetadata.permissions[candidate];
      if (perms) {
        return perms;
      }
    }
    return undefined;
  };

  // Update loading state based on auth state
  useEffect(() => {
    if (authLoading) {
      // If auth is still loading, we should wait
      setLoading(true);
    } else if (user && token && !userRoles) {
      // If we have auth but no roles yet, we need to load them
      setLoading(true);
    } else if (!user || !token) {
      // If no auth, we're not loading roles
      setLoading(false);
    }
  }, [authLoading, user, token, userRoles]);

  useEffect(() => {
    if (!user || !token) {
      clearRoles();
      setInitialized(true);
      return;
    }

    const loadRoles = async () => {
      setLoading(true);
      setInitialized(false);
      setError(null);

      try {
        const cachedMetadata = sessionStorage.getItem(ROLE_METADATA_CACHE_KEY);
        let metadata: RoleMetadataSchemaType | null = null;

        if (cachedMetadata) {
          const parsedMetadata: RoleMetadataSchemaType = JSON.parse(cachedMetadata);
          if (parsedMetadata.version === ROLE_METADATA_CLIENT_VERSION) {
            metadata = parsedMetadata;
          }
        }

        if (!metadata) {
          const result = await getRoleMetadata({
            client: apiClient,
            throwOnError: false,
          });

          metadata = unwrapApiResult(result, 'Failed to fetch role metadata');
          sessionStorage.setItem(ROLE_METADATA_CACHE_KEY, JSON.stringify(metadata));
        }

        if (metadata) {
          setRoleMetadata(metadata);
        }

        const result = await getCurrentUserRoles({
          client: apiClient,
          throwOnError: false,
          query: accountIdStr ? { accountId: accountIdStr } : undefined,
        });

        const data = unwrapApiResult(result, 'Failed to fetch user roles');

        setUserRoles((previous) => {
          let nextAccountId = previous?.accountId ?? '';

          if (accountIdStr) {
            const contactAccountMatch = data.contactRoles?.find(
              (role) => role.accountId === accountIdStr,
            )?.accountId;

            nextAccountId =
              contactAccountMatch ??
              data.contactRoles?.[0]?.accountId ??
              accountIdStr ??
              previous?.accountId ??
              '';
          }

          const nextRoles = {
            accountId: nextAccountId,
            globalRoles: data.globalRoles ?? [],
            contactRoles: data.contactRoles ?? [],
          };
          return nextRoles;
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error loading roles:', err);
          setError(err.message);
        } else {
          setError('Failed to load user roles');
        }
        setUserRoles(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    void loadRoles();
  }, [user, token, accountIdStr, apiClient]);

  const clearRoles = () => {
    setUserRoles(null);
    setRoleMetadata(null);
    setError(null);
    setLoading(false);
    setInitialized(true);
  };

  const hasRole = (roleId: string, context?: RoleContext): boolean => {
    if (!userRoles) return false;

    const actualRoleId = normalizeRoleId(ROLE_NAME_TO_ID[roleId] || roleId);
    if (!actualRoleId) {
      return false;
    }

    const matchesContext = (contactRole: RoleWithContactType): boolean => {
      if (context?.accountId && contactRole.accountId !== context.accountId) {
        return false;
      }
      if (context?.teamId && contactRole.roleData !== context.teamId) {
        return false;
      }
      if (context?.leagueId && contactRole.roleData !== context.leagueId) {
        return false;
      }
      return true;
    };

    const roleMatches = (
      candidateRoleId: string | undefined,
      contactRole?: RoleWithContactType,
    ): boolean => {
      if (!candidateRoleId) {
        return false;
      }

      if (contactRole && !matchesContext(contactRole)) {
        return false;
      }

      if (candidateRoleId === actualRoleId) {
        return true;
      }

      if (!roleMetadata) {
        return false;
      }

      const inheritedRoles = getHierarchyForRole(candidateRoleId);
      return inheritedRoles.includes(actualRoleId);
    };

    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = normalizeRoleId(ROLE_NAME_TO_ID[globalRole] || globalRole);
      if (roleMatches(globalRoleId)) {
        return true;
      }
    }

    for (const contactRole of userRoles.contactRoles) {
      const contactRoleId = normalizeRoleId(
        ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId,
      );
      if (roleMatches(contactRoleId, contactRole)) {
        return true;
      }
    }

    return false;
  };

  const hasPermission = (permission: string, context?: RoleContext): boolean => {
    if (!userRoles || !roleMetadata) return false;

    // Check global roles first
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = normalizeRoleId(ROLE_NAME_TO_ID[globalRole] || globalRole);
      const rolePerms = getPermissionsForRole(globalRoleId);
      if (
        rolePerms &&
        (rolePerms.permissions.includes('*') || rolePerms.permissions.includes(permission))
      ) {
        return true;
      }
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      // Validate context if provided
      if (context?.accountId && contactRole.accountId !== context.accountId) {
        continue;
      }
      if (context?.teamId && contactRole.roleData !== context.teamId) {
        continue;
      }
      if (context?.leagueId && contactRole.roleData !== context.leagueId) {
        continue;
      }

      const contactRoleId = normalizeRoleId(
        ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId,
      );
      const rolePerms = getPermissionsForRole(contactRoleId);
      if (
        rolePerms &&
        (rolePerms.permissions.includes('*') || rolePerms.permissions.includes(permission))
      ) {
        return true;
      }
    }

    return false;
  };

  const hasRoleInAccount = (roleId: string, accountId: string): boolean => {
    return hasRole(roleId, { accountId });
  };

  const hasRoleInTeam = (roleId: string, teamId: string): boolean => {
    return hasRole(roleId, { teamId });
  };

  const hasRoleInLeague = (roleId: string, leagueId: string): boolean => {
    return hasRole(roleId, { leagueId });
  };

  const administratorRoleId = normalizeRoleId(ROLE_NAME_TO_ID['Administrator']);
  const accountAdminRoleId = normalizeRoleId(ROLE_NAME_TO_ID['AccountAdmin']);

  const computeIsAdministrator = (): boolean => {
    if (!userRoles || !administratorRoleId) {
      return false;
    }

    return userRoles.globalRoles.some((role) => {
      const normalizedRoleId = normalizeRoleId(ROLE_NAME_TO_ID[role] || role);
      if (!normalizedRoleId) {
        return false;
      }
      if (normalizedRoleId === administratorRoleId) {
        return true;
      }
      const inheritedRoles = getHierarchyForRole(normalizedRoleId);
      return inheritedRoles.includes(administratorRoleId);
    });
  };

  const computeManageableAccountIds = (): string[] => {
    if (!userRoles || !accountAdminRoleId) {
      return [];
    }

    const accountIds = new Set<string>();

    userRoles.contactRoles.forEach((role) => {
      const normalizedRoleId = normalizeRoleId(ROLE_NAME_TO_ID[role.roleId] || role.roleId);
      if (!normalizedRoleId) {
        return;
      }

      if (normalizedRoleId === accountAdminRoleId) {
        if (role.accountId) {
          accountIds.add(role.accountId);
        }
        return;
      }

      const inheritedRoles = getHierarchyForRole(normalizedRoleId);
      if (inheritedRoles.includes(accountAdminRoleId) && role.accountId) {
        accountIds.add(role.accountId);
      }
    });

    return Array.from(accountIds);
  };

  const computeHasAccountAdminRole = (): boolean => {
    if (!userRoles || !accountAdminRoleId) {
      return false;
    }

    return userRoles.contactRoles.some((role) => {
      const normalizedRoleId = normalizeRoleId(ROLE_NAME_TO_ID[role.roleId] || role.roleId);
      if (!normalizedRoleId) {
        return false;
      }

      if (normalizedRoleId === accountAdminRoleId) {
        return true;
      }

      const inheritedRoles = getHierarchyForRole(normalizedRoleId);
      return inheritedRoles.includes(accountAdminRoleId);
    });
  };

  const isAdministrator = computeIsAdministrator();
  const manageableAccountIds = computeManageableAccountIds();
  const hasAccountAdminRole = computeHasAccountAdminRole();
  const hasManageableAccount =
    isAdministrator || manageableAccountIds.length > 0 || hasAccountAdminRole;

  return (
    <RoleContext.Provider
      value={{
        userRoles,
        roleMetadata,
        loading,
        initialized,
        error,
        isAdministrator,
        manageableAccountIds,
        hasManageableAccount,
        hasRole,
        hasPermission,
        hasRoleInAccount,
        hasRoleInTeam,
        hasRoleInLeague,
        clearRoles,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
