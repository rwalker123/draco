/**
 * Role Icon Utilities
 * Centralized role icon mapping and display functions
 */

import {
  AdminPanelSettings,
  Business,
  PhotoCamera,
  EmojiEvents,
  SportsBaseball,
  CameraAlt,
} from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';

// Role ID to icon mapping
export const ROLE_ID_TO_ICON: Record<string, SvgIconComponent> = {
  // Administrator (Global)
  '93DAC465-4C64-4422-B444-3CE79C549329': AdminPanelSettings,

  // Account-level roles
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A': Business, // AccountAdmin
  'a87ea9a3-47e2-49d1-9e1e-c35358d1a677': PhotoCamera, // AccountPhotoAdmin
  '05BEC889-3499-4DE1-B44F-4EED41412B3D': CameraAlt, // PhotoAdmin

  // League-level roles
  '672DDF06-21AC-4D7C-B025-9319CC69281A': EmojiEvents, // LeagueAdmin

  // Team-level roles
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': SportsBaseball, // TeamAdmin
  '55FD3262-343F-4000-9561-6BB7F658DEB7': CameraAlt, // TeamPhotoAdmin
};

// Role color mapping for visual distinction
export const ROLE_COLORS = {
  // Global roles - Purple (highest authority)
  '93DAC465-4C64-4422-B444-3CE79C549329': {
    primary: '#9c27b0',
    hover: '#7b1fa2',
    background: '#f3e5f5',
  },

  // Account roles - Blue (account-level authority)
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A': {
    primary: '#1976d2',
    hover: '#1565c0',
    background: '#e3f2fd',
  },
  'a87ea9a3-47e2-49d1-9e1e-c35358d1a677': {
    primary: '#1976d2',
    hover: '#1565c0',
    background: '#e3f2fd',
  },

  // League roles - Green (league-level authority)
  '672DDF06-21AC-4D7C-B025-9319CC69281A': {
    primary: '#2e7d32',
    hover: '#1b5e20',
    background: '#e8f5e8',
  },

  // Team roles - Orange (team-level authority)
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': {
    primary: '#ed6c02',
    hover: '#e65100',
    background: '#fff4e5',
  },
  '55FD3262-343F-4000-9561-6BB7F658DEB7': {
    primary: '#ed6c02',
    hover: '#e65100',
    background: '#fff4e5',
  },

  // Photo roles - Teal (specialized photo permissions)
  '05BEC889-3499-4DE1-B44F-4EED41412B3D': {
    primary: '#00695c',
    hover: '#004d40',
    background: '#e0f2f1',
  },
} as const;

// Role type categorization for accessibility
export const ROLE_TYPES = {
  '93DAC465-4C64-4422-B444-3CE79C549329': 'global',
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A': 'account',
  'a87ea9a3-47e2-49d1-9e1e-c35358d1a677': 'account',
  '672DDF06-21AC-4D7C-B025-9319CC69281A': 'league',
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': 'team',
  '55FD3262-343F-4000-9561-6BB7F658DEB7': 'team',
  '05BEC889-3499-4DE1-B44F-4EED41412B3D': 'photo',
} as const;

// Role icon descriptions for tooltips
export const ROLE_ICON_DESCRIPTIONS: Record<string, string> = {
  '93DAC465-4C64-4422-B444-3CE79C549329': 'Administrator - Full system access',
  '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A':
    'Account Administrator - Manage account settings and users',
  'a87ea9a3-47e2-49d1-9e1e-c35358d1a677': 'Account Photo Administrator - Manage account photos',
  '05BEC889-3499-4DE1-B44F-4EED41412B3D': 'Photo Administrator - Manage photos',
  '672DDF06-21AC-4D7C-B025-9319CC69281A': 'League Administrator - Manage league settings and teams',
  '777D771B-1CBA-4126-B8F3-DD7F3478D40E': 'Team Administrator - Manage team roster and settings',
  '55FD3262-343F-4000-9561-6BB7F658DEB7': 'Team Photo Administrator - Manage team photos',
};

/**
 * Get icon component for a role ID
 * @param roleId - The role ID (GUID)
 * @returns The icon component or undefined if not found
 */
export function getRoleIcon(roleId: string): SvgIconComponent | undefined {
  // Try exact match first
  let icon = ROLE_ID_TO_ICON[roleId];

  // If not found, try case-insensitive match
  if (!icon) {
    const upperRoleId = roleId.toUpperCase();
    const matchingKey = Object.keys(ROLE_ID_TO_ICON).find(
      (key) => key.toUpperCase() === upperRoleId,
    );
    if (matchingKey) {
      icon = ROLE_ID_TO_ICON[matchingKey];
    }
  }

  return icon;
}

/**
 * Get icon description for tooltip
 * @param roleId - The role ID (GUID)
 * @returns The description string or undefined if not found
 */
export function getRoleIconDescription(roleId: string): string | undefined {
  return ROLE_ICON_DESCRIPTIONS[roleId];
}

/**
 * Get full tooltip text for a role
 * @param role - The role object with roleId and contextName
 * @returns The full tooltip text
 */
export function getRoleTooltipText(role: {
  roleId: string;
  roleName?: string;
  contextName?: string;
}): string {
  const baseDescription = getRoleIconDescription(role.roleId);

  if (!baseDescription) {
    return role.roleName || 'Unknown Role';
  }

  // AccountPhotoAdmin and AccountAdmin should not show context data prefix
  const accountRolesWithoutContext = [
    '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A', // AccountAdmin
    'a87ea9a3-47e2-49d1-9e1e-c35358d1a677', // AccountPhotoAdmin
  ];

  if (role.contextName && !accountRolesWithoutContext.includes(role.roleId)) {
    return `${role.contextName} - ${baseDescription}`;
  }

  return baseDescription;
}

/**
 * Get color scheme for a role
 * @param roleId - The role ID (GUID)
 * @returns The color scheme object or undefined if not found
 */
export function getRoleColors(roleId: string) {
  // Try exact match first
  let colors = ROLE_COLORS[roleId as keyof typeof ROLE_COLORS];

  // If not found, try case-insensitive match
  if (!colors) {
    const upperRoleId = roleId.toUpperCase();
    const matchingKey = Object.keys(ROLE_COLORS).find((key) => key.toUpperCase() === upperRoleId);
    if (matchingKey) {
      colors = ROLE_COLORS[matchingKey as keyof typeof ROLE_COLORS];
    }
  }

  return colors;
}

/**
 * Get role type for accessibility
 * @param roleId - The role ID (GUID)
 * @returns The role type string or undefined if not found
 */
export function getRoleType(roleId: string) {
  return ROLE_TYPES[roleId as keyof typeof ROLE_TYPES];
}

/**
 * Get accessibility label for a role
 * @param role - The role object
 * @returns The accessibility label
 */
export function getRoleAccessibilityLabel(role: {
  roleId: string;
  roleName?: string;
  contextName?: string;
}): string {
  const roleType = getRoleType(role.roleId);
  const tooltipText = getRoleTooltipText(role);

  if (roleType) {
    return `${tooltipText} (${roleType} role)`;
  }

  return tooltipText;
}
