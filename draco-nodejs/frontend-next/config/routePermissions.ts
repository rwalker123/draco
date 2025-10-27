export interface RoutePermission {
  roles?: string[];
  permissions?: string[];
  checkAccountBoundary?: boolean;
  public?: boolean;
}

export const routePermissions: Record<string, RoutePermission> = {
  // Admin routes - require global Administrator role
  '/admin': {
    roles: ['Administrator'],
    checkAccountBoundary: false,
  },
  '/account-management': {
    roles: ['Administrator', 'AccountAdmin'],
    checkAccountBoundary: false,
  },

  // Account management routes - require AccountAdmin role
  '/account/[accountId]/users': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/settings': {
    roles: ['AccountAdmin', 'ContactAdmin'],
    checkAccountBoundary: true,
  },

  // Season and team management - various roles
  '/account/[accountId]/seasons': {
    roles: ['AccountAdmin', 'ContactAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/seasons/[seasonId]/teams/[teamSeasonId]/roster': {
    roles: ['AccountAdmin', 'ContactAdmin', 'Contact'],
    checkAccountBoundary: true,
  },

  // Communications routes - require AccountAdmin for most; templates allow ContactAdmin as well
  '/account/[accountId]/communications': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/communications/compose': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/communications/history': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/communications/templates': {
    roles: ['ContactAdmin', 'AccountAdmin'],
    checkAccountBoundary: true,
  },

  // Workouts management - AccountAdmin only
  '/account/[accountId]/workouts': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/workouts/sources': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/photo-gallery/admin': {
    roles: ['AccountAdmin', 'AccountPhotoAdmin'],
    checkAccountBoundary: true,
  },
  '/account/[accountId]/member-businesses/manage': {
    roles: ['AccountAdmin'],
    checkAccountBoundary: true,
  },

  '/account/[accountId]/polls/manage': {
    roles: ['AccountAdmin', 'TeamAdmin'],
    checkAccountBoundary: true,
  },

  // Public routes - no authentication required
  '/': {
    public: true,
  },
  '/login': {
    public: true,
  },
  '/signup': {
    public: true,
  },
  '/reset-password': {
    public: true,
  },
  '/account/[accountId]': {
    public: true,
  },
  '/account/[accountId]/home': {
    public: true,
  },
  '/account/[accountId]/fields': {
    public: true,
  },
  '/account/[accountId]/schedule': {
    public: true,
  },
  '/account/[accountId]/seasons/[seasonId]/teams': {
    public: true,
  },
  '/account/[accountId]/seasons/[seasonId]/teams/[teamSeasonId]': {
    public: true,
  },
  '/account/[accountId]/statistics': {
    public: true,
  },
  '/account/[accountId]/seasons/[seasonId]/standings': {
    public: true,
  },
  '/account/[accountId]/hall-of-fame': {
    public: true,
  },
  '/accounts': {
    public: true,
  },
  '/unauthorized': {
    public: true,
  },
};

/**
 * Get permission requirements for a given route
 * @param pathname The route pathname
 * @returns RoutePermission object or undefined if no specific permissions
 */
export function getRoutePermissions(pathname: string): RoutePermission | undefined {
  // Direct match
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }

  // Check for pattern matches (e.g., /account/123/users matches /account/[accountId]/users)
  for (const [pattern, permission] of Object.entries(routePermissions)) {
    if (matchesPattern(pathname, pattern)) {
      return permission;
    }
  }

  return undefined;
}

/**
 * Check if a pathname matches a route pattern with dynamic segments
 * @param pathname The actual pathname
 * @param pattern The pattern with [param] segments
 * @returns boolean indicating if it matches
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  // Convert pattern to regex
  // Replace [param] with a regex that matches any non-slash characters
  const regexPattern = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return '[^/]+';
      }
      return segment;
    })
    .join('\\/');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Check if a route is public (no auth required)
 * @param pathname The route pathname
 * @returns boolean indicating if the route is public
 */
export function isPublicRoute(pathname: string): boolean {
  const permissions = getRoutePermissions(pathname);
  return permissions?.public === true;
}

/**
 * Check if a route requires authentication
 * @param pathname The route pathname
 * @returns boolean indicating if auth is required
 */
export function requiresAuth(pathname: string): boolean {
  return !isPublicRoute(pathname);
}
