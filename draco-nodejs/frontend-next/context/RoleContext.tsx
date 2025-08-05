'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { ROLE_NAME_TO_ID } from '../utils/roleUtils';

interface ContactRole {
  id: string;
  contactId: string;
  roleId: string;
  roleName?: string;
  roleData: string;
  accountId: string;
}

interface UserRoles {
  globalRoles: string[];
  contactRoles: ContactRole[];
}

interface RoleContextType {
  userRoles: UserRoles | null;
  loading: boolean;
  error: string | null;
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

interface RoleMetadata {
  version: string;
  timestamp: string;
  hierarchy: Record<string, string[]>;
  permissions: Record<string, { roleId: string; permissions: string[]; context: string }>;
}

// Cache keys for localStorage
const ROLE_METADATA_CACHE_KEY = 'draco_role_metadata';
const ROLE_METADATA_VERSION_KEY = 'draco_role_metadata_version';

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [roleMetadata, setRoleMetadata] = useState<RoleMetadata | null>(null);
  // Initialize loading as true if we have auth but need to fetch roles
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const fetchRoleMetadata = useCallback(async (): Promise<RoleMetadata | null> => {
    if (!token) return null;

    try {
      // Check if we have cached metadata
      const cachedMetadata = localStorage.getItem(ROLE_METADATA_CACHE_KEY);
      const cachedVersion = localStorage.getItem(ROLE_METADATA_VERSION_KEY);

      if (cachedMetadata && cachedVersion) {
        const parsedMetadata: RoleMetadata = JSON.parse(cachedMetadata);
        // Use cached data if version matches
        if (parsedMetadata.version === cachedVersion) {
          return parsedMetadata;
        }
      }

      // Fetch fresh metadata from API
      const response = await axios.get('/api/roleTest/roles/metadata', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const metadata: RoleMetadata = response.data.data;

        // Cache the metadata
        localStorage.setItem(ROLE_METADATA_CACHE_KEY, JSON.stringify(metadata));
        localStorage.setItem(ROLE_METADATA_VERSION_KEY, metadata.version);

        return metadata;
      } else {
        throw new Error(response.data.message || 'Failed to fetch role metadata');
      }
    } catch (err: unknown) {
      console.error('Error fetching role metadata:', err);
      // If API fails, show error and disable role checking
      setError('Failed to load role permissions. Some features may be restricted.');
      return null;
    }
  }, [token]);

  const fetchUserRoles = useCallback(
    async (accountId?: string) => {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch role metadata first
        const metadata = await fetchRoleMetadata();
        if (metadata) {
          setRoleMetadata(metadata);
        }

        const url = accountId
          ? `/api/roleTest/user-roles?accountId=${accountId}`
          : `/api/roleTest/user-roles`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUserRoles({
            globalRoles: response.data.data.globalRoles || [],
            contactRoles: response.data.data.contactRoles || [],
          });
        } else {
          setError(response.data.message || 'Failed to fetch user roles');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
        setUserRoles(null);
      } finally {
        setLoading(false);
      }
    },
    [token, fetchRoleMetadata],
  );

  useEffect(() => {
    if (user && token) {
      fetchUserRoles();
    } else {
      clearRoles();
    }
  }, [user, token, fetchUserRoles]);

  const clearRoles = () => {
    setUserRoles(null);
    setRoleMetadata(null);
    setError(null);
    setLoading(false);
  };

  const hasRole = (roleId: string, context?: RoleContext): boolean => {
    if (!userRoles || !roleMetadata) return false;

    // Convert role name to ID if needed
    const actualRoleId = ROLE_NAME_TO_ID[roleId] || roleId;

    // Check global roles first
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = ROLE_NAME_TO_ID[globalRole] || globalRole;
      if (globalRoleId === actualRoleId) {
        return true;
      }
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      const contactRoleId = ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId;
      if (contactRoleId === actualRoleId) {
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
        return true;
      }
    }

    // Check role hierarchy
    return hasRoleOrHigher(actualRoleId);
  };

  const hasRoleOrHigher = (requiredRole: string): boolean => {
    if (!userRoles || !roleMetadata) return false;

    // Convert required role to ID if needed
    const requiredRoleId = ROLE_NAME_TO_ID[requiredRole] || requiredRole;

    // Check global roles
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = ROLE_NAME_TO_ID[globalRole] || globalRole;
      const inheritedRoles = roleMetadata.hierarchy[globalRoleId] || [];
      if (inheritedRoles.includes(requiredRoleId)) {
        return true;
      }
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      const contactRoleId = ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId;
      const inheritedRoles = roleMetadata.hierarchy[contactRoleId] || [];
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
      const globalRoleId = ROLE_NAME_TO_ID[globalRole] || globalRole;
      const rolePerms = roleMetadata.permissions[globalRoleId];
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

      const contactRoleId = ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId;
      const rolePerms = roleMetadata.permissions[contactRoleId];
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

  return (
    <RoleContext.Provider
      value={{
        userRoles,
        loading,
        error,
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
