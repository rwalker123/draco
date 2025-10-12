'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
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
  fetchUserRoles: (accountId?: string) => Promise<void>;
  clearRoles: () => void;
}

interface RoleContext {
  accountId?: string;
  teamId?: string;
  leagueId?: string;
  seasonId?: string;
}

// Cache keys for localStorage
const ROLE_METADATA_CACHE_KEY = 'draco_role_metadata';
const ROLE_METADATA_VERSION_KEY = 'draco_role_metadata_version';

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

  // Fetch role metadata from API and cache in localStorage
  const fetchRoleMetadata = useCallback(async (): Promise<RoleMetadataSchemaType | null> => {
    if (!token) return null;

    try {
      const cachedMetadata = localStorage.getItem(ROLE_METADATA_CACHE_KEY);
      const cachedVersion = localStorage.getItem(ROLE_METADATA_VERSION_KEY);

      if (cachedMetadata && cachedVersion) {
        const parsedMetadata: RoleMetadataSchemaType = JSON.parse(cachedMetadata);
        if (parsedMetadata.version === cachedVersion) {
          return parsedMetadata;
        }
      }

      const result = await getRoleMetadata({
        client: apiClient,
        throwOnError: false,
      });

      const metadata = unwrapApiResult(result, 'Failed to fetch role metadata');

      localStorage.setItem(ROLE_METADATA_CACHE_KEY, JSON.stringify(metadata));
      localStorage.setItem(ROLE_METADATA_VERSION_KEY, metadata.version);

      return metadata;
    } catch (err: unknown) {
      console.error('Error fetching role metadata:', err);
      setError('Failed to load role permissions. Some features may be restricted.');
      return null;
    }
  }, [token, apiClient]);

  const fetchUserRoles = useCallback(
    async (accountId?: string) => {
      if (!token) {
        return;
      }

      setLoading(true);
      setInitialized(false);
      setError(null);

      try {
        // Fetch role metadata first
        const metadata = await fetchRoleMetadata();
        if (metadata) {
          setRoleMetadata(metadata);
        }

        const result = await getCurrentUserRoles({
          client: apiClient,
          throwOnError: false,
          query: accountId ? { accountId } : undefined,
        });

        const data = unwrapApiResult(result, 'Failed to fetch user roles');

        setUserRoles((previous) => {
          let nextAccountId = previous?.accountId ?? '';

          if (accountId) {
            const contactAccountMatch = data.contactRoles?.find(
              (role) => role.accountId === accountId,
            )?.accountId;

            nextAccountId =
              contactAccountMatch ??
              data.contactRoles?.[0]?.accountId ??
              accountId ??
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
        setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
        setUserRoles(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [token, apiClient, fetchRoleMetadata],
  );

  useEffect(() => {
    if (user && token) {
      fetchUserRoles(accountIdStr || undefined);
    } else {
      clearRoles();
      setInitialized(true);
    }
  }, [user, token, fetchUserRoles, accountIdStr]);

  const clearRoles = () => {
    setUserRoles(null);
    setRoleMetadata(null);
    setError(null);
    setLoading(false);
    setInitialized(true);
  };

  const hasRole = (roleId: string, context?: RoleContext): boolean => {
    if (!userRoles) return false;

    // Convert role name to ID if needed
    const actualRoleId = normalizeRoleId(ROLE_NAME_TO_ID[roleId] || roleId);

    const matchesContext = (contactRole: RoleWithContactType) => {
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

    // Check global roles first
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = normalizeRoleId(ROLE_NAME_TO_ID[globalRole] || globalRole);
      if (globalRoleId && actualRoleId && globalRoleId === actualRoleId) {
        return true;
      }
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      const contactRoleId = normalizeRoleId(
        ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId,
      );
      if (
        contactRoleId &&
        actualRoleId &&
        contactRoleId === actualRoleId &&
        matchesContext(contactRole)
      ) {
        return true;
      }
    }

    if (!roleMetadata) {
      return false;
    }

    // Check role hierarchy
    if (!actualRoleId) {
      return false;
    }
    return hasRoleOrHigher(actualRoleId);
  };

  const hasRoleOrHigher = (requiredRole: string): boolean => {
    if (!userRoles || !roleMetadata) return false;

    // Convert required role to ID if needed
    const requiredRoleId = normalizeRoleId(ROLE_NAME_TO_ID[requiredRole] || requiredRole);
    if (!requiredRoleId) return false;

    // Check global roles
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = normalizeRoleId(ROLE_NAME_TO_ID[globalRole] || globalRole);
      if (!globalRoleId) continue;
      if (globalRoleId === requiredRoleId) {
        return true;
      }
      const inheritedRoles = getHierarchyForRole(globalRoleId);
      if (inheritedRoles.includes(requiredRoleId)) {
        return true;
      }
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      const contactRoleId = normalizeRoleId(
        ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId,
      );
      if (!contactRoleId) continue;
      if (contactRoleId === requiredRoleId) {
        return true;
      }
      const inheritedRoles = getHierarchyForRole(contactRoleId);
      if (inheritedRoles.includes(requiredRoleId)) {
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

  const isAdministrator = useMemo(() => {
    if (!userRoles || !administratorRoleId) {
      return false;
    }

    const result = userRoles.globalRoles.some((role) => {
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

    return result;
  }, [userRoles, administratorRoleId, roleMetadata]);

  const manageableAccountIds = useMemo(() => {
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

    const ids = Array.from(accountIds);
    return ids;
  }, [userRoles, accountAdminRoleId, roleMetadata]);

  const hasAccountAdminRole = useMemo(() => {
    if (!userRoles || !accountAdminRoleId) {
      return false;
    }

    const result = userRoles.contactRoles.some((role) => {
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

    return result;
  }, [userRoles, accountAdminRoleId, roleMetadata]);

  const hasManageableAccount = useMemo(() => {
    const result = isAdministrator || manageableAccountIds.length > 0 || hasAccountAdminRole;
    return result;
  }, [isAdministrator, manageableAccountIds, hasAccountAdminRole]);

  return (
    <RoleContext.Provider
      value={{
        userRoles,
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
        fetchUserRoles,
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
