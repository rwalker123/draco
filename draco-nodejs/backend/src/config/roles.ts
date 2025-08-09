// Role configuration and constants for Draco Sports Manager

import { RoleType } from '../types/roles.js';

// Role ID mappings (these should match the actual IDs in the aspnetroles table)
// These will be populated from the database during initialization
export const ROLE_IDS: Record<string, string> = {
  [RoleType.ADMINISTRATOR]: '',
  [RoleType.ACCOUNT_ADMIN]: '',
  [RoleType.ACCOUNT_PHOTO_ADMIN]: '',
  [RoleType.LEAGUE_ADMIN]: '',
  [RoleType.TEAM_ADMIN]: '',
  [RoleType.TEAM_PHOTO_ADMIN]: '',
};

// Role name mappings (these should match the actual names in the aspnetroles table)
// These will be populated from the database during initialization
export const ROLE_NAMES: Record<string, string> = {};

// Role assignment rules by ID (populated during initialization)
export const ROLE_ASSIGNMENT_RULES_BY_ID: Record<string, string[]> = {};

// Role inheritance rules by ID (populated during initialization)
export const ROLE_INHERITANCE_BY_ID: Record<string, string[]> = {};

// Role permissions by ID (populated during initialization)
export const ROLE_PERMISSIONS_BY_ID: Record<
  string,
  { roleId: string; permissions: string[]; context: string }
> = {};

// Role context types
export enum RoleContextType {
  GLOBAL = 'global',
  ACCOUNT = 'account',
  TEAM = 'team',
  LEAGUE = 'league',
}

// Role data types for different contexts
export interface RoleDataContext {
  accountId: bigint;
  teamId?: bigint;
  leagueId?: bigint;
  seasonId?: bigint;
}

// Role assignment validation rules
export const ROLE_ASSIGNMENT_RULES: Record<string, string[]> = {
  // Who can assign which roles
  [RoleType.ADMINISTRATOR]: [RoleType.ADMINISTRATOR],
  [RoleType.ACCOUNT_ADMIN]: [RoleType.ADMINISTRATOR, RoleType.ACCOUNT_ADMIN],
  [RoleType.ACCOUNT_PHOTO_ADMIN]: [RoleType.ADMINISTRATOR, RoleType.ACCOUNT_ADMIN],
  [RoleType.LEAGUE_ADMIN]: [RoleType.ADMINISTRATOR, RoleType.ACCOUNT_ADMIN],
  [RoleType.TEAM_ADMIN]: [RoleType.ADMINISTRATOR, RoleType.ACCOUNT_ADMIN, RoleType.LEAGUE_ADMIN],
  [RoleType.TEAM_PHOTO_ADMIN]: [
    RoleType.ADMINISTRATOR,
    RoleType.ACCOUNT_ADMIN,
    RoleType.LEAGUE_ADMIN,
    RoleType.TEAM_ADMIN,
  ],
};

// Role inheritance rules (which roles include other roles)
export const ROLE_INHERITANCE: Record<string, string[]> = {
  [RoleType.ADMINISTRATOR]: [
    RoleType.ACCOUNT_ADMIN,
    RoleType.ACCOUNT_PHOTO_ADMIN,
    RoleType.LEAGUE_ADMIN,
    RoleType.TEAM_ADMIN,
    RoleType.TEAM_PHOTO_ADMIN,
  ],
  [RoleType.ACCOUNT_ADMIN]: [
    RoleType.ACCOUNT_PHOTO_ADMIN,
    RoleType.LEAGUE_ADMIN,
    RoleType.TEAM_ADMIN,
    RoleType.TEAM_PHOTO_ADMIN,
  ],
  [RoleType.LEAGUE_ADMIN]: [RoleType.TEAM_ADMIN, RoleType.TEAM_PHOTO_ADMIN],
  [RoleType.TEAM_ADMIN]: [RoleType.TEAM_PHOTO_ADMIN],
};

// Default roles for new accounts
export const DEFAULT_ACCOUNT_ROLES = [RoleType.ACCOUNT_ADMIN];

// Default roles for new teams
export const DEFAULT_TEAM_ROLES = [RoleType.TEAM_ADMIN];

// Default roles for new leagues
export const DEFAULT_LEAGUE_ROLES = [RoleType.LEAGUE_ADMIN];

// Role validation functions
export const validateRoleAssignment = (
  assignerRoles: string[],
  targetRole: string,
  _context: RoleDataContext,
): boolean => {
  // Now we receive role IDs, so use the ID-based rules
  const allowedAssigners = ROLE_ASSIGNMENT_RULES_BY_ID[targetRole] || [];
  console.log('allowedAssigners:', allowedAssigners);
  const isAllowed = allowedAssigners.some((role: string) => assignerRoles.includes(role));
  console.log('validateRoleAssignment:', assignerRoles, targetRole, _context);
  console.log('isAllowed:', isAllowed);
  return isAllowed;
};

export const getInheritedRoles = (role: string): string[] => {
  // Now we receive role IDs, so use the ID-based inheritance
  return ROLE_INHERITANCE_BY_ID[role] || [];
};

export const hasRoleOrHigher = (userRoles: string[], requiredRole: string): boolean => {
  // Check if user has the exact role
  if (userRoles.includes(requiredRole)) {
    return true;
  }

  // Check if user has a higher role that includes the required role
  for (const userRole of userRoles) {
    const inheritedRoles = getInheritedRoles(userRole);
    if (inheritedRoles.includes(requiredRole)) {
      return true;
    }
  }

  return false;
};

// Import ROLE_PERMISSIONS from types to use during initialization
import { ROLE_PERMISSIONS } from '../types/roles.js';

// Initialize role IDs from database
export const initializeRoleIds = async (prisma: {
  aspnetroles: {
    findMany: (args: {
      select: { id: boolean; name: boolean };
    }) => Promise<Array<{ id: string; name: string }>>;
  };
}): Promise<void> => {
  try {
    const roles = await prisma.aspnetroles.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    roles.forEach((role: { id: string; name: string }) => {
      if (Object.prototype.hasOwnProperty.call(ROLE_IDS, role.name)) {
        ROLE_IDS[role.name] = role.id;
        ROLE_NAMES[role.id] = role.name;
      }
    });

    // Populate ID-based assignment and inheritance rules
    for (const [roleName, allowedAssigners] of Object.entries(ROLE_ASSIGNMENT_RULES)) {
      const roleId = ROLE_IDS[roleName];
      if (roleId) {
        ROLE_ASSIGNMENT_RULES_BY_ID[roleId] = allowedAssigners
          .map((name) => ROLE_IDS[name])
          .filter(Boolean);
      }
    }

    for (const [roleName, inheritedRoles] of Object.entries(ROLE_INHERITANCE)) {
      const roleId = ROLE_IDS[roleName];
      if (roleId) {
        ROLE_INHERITANCE_BY_ID[roleId] = inheritedRoles
          .map((name) => ROLE_IDS[name])
          .filter(Boolean);
      }
    }

    // Populate ID-based permissions
    for (const [roleName, rolePermission] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = ROLE_IDS[roleName];
      if (roleId) {
        ROLE_PERMISSIONS_BY_ID[roleId] = rolePermission;
      }
    }

    // Validate that all expected roles were loaded
    const missingRoles = Object.entries(ROLE_IDS).filter(([, id]) => !id);
    if (missingRoles.length > 0) {
      const missingRoleNames = missingRoles.map(([name]) => name);
      console.warn(`⚠️  Some roles were not found in database: ${missingRoleNames.join(', ')}`);
    }

    console.log(
      '✅ Role IDs initialized successfully:',
      Object.keys(ROLE_IDS).length,
      'roles loaded',
    );
  } catch (error) {
    console.error('❌ Failed to initialize role IDs:', error);
    throw error;
  }
};
