/**
 * Role Utilities
 * Centralized role mapping and display name conversion
 */

// Role name to ID mapping (from RoleContext.tsx)
export const ROLE_NAME_TO_ID: Record<string, string> = {
  Administrator: '93DAC465-4C64-4422-B444-3CE79C549329',
  AccountAdmin: '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A',
  AccountPhotoAdmin: 'a87ea9a3-47e2-49d1-9e1e-c35358d1a677',
  LeagueAdmin: '672DDF06-21AC-4D7C-B025-9319CC69281A',
  TeamAdmin: '777D771B-1CBA-4126-B8F3-DD7F3478D40E',
  TeamPhotoAdmin: '55FD3262-343F-4000-9561-6BB7F658DEB7',
  PhotoAdmin: '05BEC889-3499-4DE1-B44F-4EED41412B3D',
};

// Role ID to name mapping (reverse of ROLE_NAME_TO_ID)
export const ROLE_ID_TO_NAME: Record<string, string> = Object.entries(ROLE_NAME_TO_ID).reduce(
  (acc, [name, id]) => {
    acc[id] = name;
    return acc;
  },
  {} as Record<string, string>,
);

// Role display name mapping for user-friendly names
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  Administrator: 'Administrator',
  AccountAdmin: 'Account Administrator',
  AccountPhotoAdmin: 'Account Photo Administrator',
  LeagueAdmin: 'League Administrator',
  TeamAdmin: 'Team Administrator',
  TeamPhotoAdmin: 'Team Photo Administrator',
  PhotoAdmin: 'Photo Administrator',
};

// Account-level roles that should not display contextName
export const ACCOUNT_LEVEL_ROLES = [
  'Administrator',
  'AccountAdmin',
  'AccountPhotoAdmin',
  'PhotoAdmin',
];

/**
 * Get human-readable display name for a role ID or role object
 * @param roleOrRoleId - The role ID (GUID or name) or role object with contextName
 * @returns The display name for the role
 */
export function getRoleDisplayName(
  roleOrRoleId:
    | string
    | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
): string {
  // Handle role object with contextName
  if (typeof roleOrRoleId === 'object' && roleOrRoleId.contextName) {
    const roleId = roleOrRoleId.roleId;
    const contextName = roleOrRoleId.contextName;

    // Get the role name from the roleId
    const roleName = ROLE_ID_TO_NAME[roleId];

    // Check if this is an account-level role
    if (roleName && ACCOUNT_LEVEL_ROLES.includes(roleName)) {
      // For account-level roles, don't show contextName
      return ROLE_DISPLAY_NAMES[roleName] || roleName || roleId;
    }

    // For non-account-level roles, combine contextName with the base display name
    const baseDisplayName = ROLE_DISPLAY_NAMES[roleName] || roleName || roleId;
    return `${contextName} ${baseDisplayName}`;
  }

  // Handle string roleId (backward compatibility)
  const roleId = roleOrRoleId as string;

  // If it's already a display name, return it
  if (ROLE_DISPLAY_NAMES[roleId]) {
    return ROLE_DISPLAY_NAMES[roleId];
  }

  // If it's a GUID, convert to role name first
  const roleName = ROLE_ID_TO_NAME[roleId];
  if (roleName && ROLE_DISPLAY_NAMES[roleName]) {
    return ROLE_DISPLAY_NAMES[roleName];
  }

  // If it's a role name but not in display names, return the role name
  if (ROLE_DISPLAY_NAMES[roleId]) {
    return roleId;
  }

  // Fallback: return the original roleId
  return roleId;
}

/**
 * Convert role name to role ID (GUID)
 * @param roleName - The role name
 * @returns The role ID (GUID)
 */
export function getRoleId(roleName: string): string {
  return ROLE_NAME_TO_ID[roleName] || roleName;
}

/**
 * Convert role ID (GUID) to role name
 * @param roleId - The role ID (GUID)
 * @returns The role name
 */
export function getRoleName(roleId: string): string {
  return ROLE_ID_TO_NAME[roleId] || roleId;
}

/**
 * Check if a string is a role GUID
 * @param roleId - The string to check
 * @returns True if it's a role GUID
 */
export function isRoleGuid(roleId: string): boolean {
  return ROLE_ID_TO_NAME.hasOwnProperty(roleId);
}

/**
 * Get all available role names
 * @returns Array of role names
 */
export function getAvailableRoleNames(): string[] {
  return Object.keys(ROLE_NAME_TO_ID);
}

/**
 * Get all available role IDs (GUIDs)
 * @returns Array of role IDs
 */
export function getAvailableRoleIds(): string[] {
  return Object.values(ROLE_NAME_TO_ID);
}
