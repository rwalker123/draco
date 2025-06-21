import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

// Role hierarchy mapping
const ROLE_HIERARCHY: Record<string, string[]> = {
  '93DAC465-4C64-4422-B444-3CE79C549329': ['93DAC465-4C64-4422-B444-3CE79C549329', '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A', '672DDF06-21AC-4D7C-B025-9319CC69281A', '777D771B-1CBA-4126-B8F3-DD7F3478D40E'], // Administrator
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A': ['5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A', '672DDF06-21AC-4D7C-B025-9319CC69281A', '777D771B-1CBA-4126-B8F3-DD7F3478D40E'], // AccountAdmin
  '672DDF06-21AC-4D7C-B025-9319CC69281A': ['672DDF06-21AC-4D7C-B025-9319CC69281A', '777D771B-1CBA-4126-B8F3-DD7F3478D40E'], // LeagueAdmin
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': ['777D771B-1CBA-4126-B8F3-DD7F3478D40E'], // TeamAdmin
};

// Role name to ID mapping
const ROLE_NAME_TO_ID: Record<string, string> = {
  'Administrator': '93DAC465-4C64-4422-B444-3CE79C549329',
  'AccountAdmin': '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A',
  'AccountPhotoAdmin': 'a87ea9a3-47e2-49d1-9e1e-c35358d1a677',
  'LeagueAdmin': '672DDF06-21AC-4D7C-B025-9319CC69281A',
  'TeamAdmin': '777D771B-1CBA-4126-B8F3-DD7F3478D40E',
  'TeamPhotoAdmin': '55FD3262-343F-4000-9561-6BB7F658DEB7',
  'PhotoAdmin': '05BEC889-3499-4DE1-B44F-4EED41412B3D'
};

// Role ID to name mapping
const ROLE_ID_TO_NAME: Record<string, string> = {
  '93DAC465-4C64-4422-B444-3CE79C549329': 'Administrator',
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A': 'AccountAdmin',
  'a87ea9a3-47e2-49d1-9e1e-c35358d1a677': 'AccountPhotoAdmin',
  '672DDF06-21AC-4D7C-B025-9319CC69281A': 'LeagueAdmin',
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': 'TeamAdmin',
  '55FD3262-343F-4000-9561-6BB7F658DEB7': 'TeamPhotoAdmin',
  '05BEC889-3499-4DE1-B44F-4EED41412B3D': 'PhotoAdmin'
};

// Role permissions mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  '93DAC465-4C64-4422-B444-3CE79C549329': ['*'], // Administrator - all permissions
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A': ['account.manage', 'account.users.manage', 'account.roles.manage', 'league.manage', 'team.manage', 'player.manage', 'photo.manage'], // AccountAdmin
  'a87ea9a3-47e2-49d1-9e1e-c35358d1a677': ['account.photos.manage', 'account.photos.view'], // AccountPhotoAdmin
  '672DDF06-21AC-4D7C-B025-9319CC69281A': ['league.manage', 'league.teams.manage', 'league.players.manage', 'league.schedule.manage'], // LeagueAdmin
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': ['team.manage', 'team.players.manage', 'team.stats.manage'], // TeamAdmin
  '55FD3262-343F-4000-9561-6BB7F658DEB7': ['team.photos.manage', 'team.photos.view'], // TeamPhotoAdmin
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchUserRoles();
    } else {
      clearRoles();
    }
  }, [user, token]);

  const fetchUserRoles = async (accountId?: string) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const url = accountId 
        ? `${API_BASE_URL}/api/roleTest/user-roles?accountId=${accountId}`
        : `${API_BASE_URL}/api/roleTest/user-roles`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserRoles({
          globalRoles: response.data.data.globalRoles || [],
          contactRoles: response.data.data.contactRoles || []
        });
      } else {
        setError(response.data.message || 'Failed to fetch user roles');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user roles');
      setUserRoles(null);
    } finally {
      setLoading(false);
    }
  };

  const clearRoles = () => {
    setUserRoles(null);
    setError(null);
  };

  const hasRole = (roleId: string, context?: RoleContext): boolean => {
    if (!userRoles) return false;

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
    if (!userRoles) return false;

    // Convert required role to ID if needed
    const requiredRoleId = ROLE_NAME_TO_ID[requiredRole] || requiredRole;

    // Check global roles
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = ROLE_NAME_TO_ID[globalRole] || globalRole;
      const inheritedRoles = ROLE_HIERARCHY[globalRoleId] || [];
      if (inheritedRoles.includes(requiredRoleId)) {
        return true;
      }
    }

    // Check contact roles
    for (const contactRole of userRoles.contactRoles) {
      const contactRoleId = ROLE_NAME_TO_ID[contactRole.roleId] || contactRole.roleId;
      const inheritedRoles = ROLE_HIERARCHY[contactRoleId] || [];
      if (inheritedRoles.includes(requiredRoleId)) {
        return true;
      }
    }

    return false;
  };

  const hasPermission = (permission: string, context?: RoleContext): boolean => {
    if (!userRoles) return false;

    // Check global roles first
    for (const globalRole of userRoles.globalRoles) {
      const globalRoleId = ROLE_NAME_TO_ID[globalRole] || globalRole;
      const rolePerms = ROLE_PERMISSIONS[globalRoleId];
      if (rolePerms && (rolePerms.includes('*') || rolePerms.includes(permission))) {
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
      const rolePerms = ROLE_PERMISSIONS[contactRoleId];
      if (rolePerms && (rolePerms.includes('*') || rolePerms.includes(permission))) {
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
    <RoleContext.Provider value={{
      userRoles,
      loading,
      error,
      hasRole,
      hasPermission,
      hasRoleInAccount,
      hasRoleInTeam,
      hasRoleInLeague,
      fetchUserRoles,
      clearRoles
    }}>
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