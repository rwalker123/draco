import { getRoutePermissions } from '../config/routePermissions';

/**
 * Build a login URL with the next parameter preserved
 * @param currentPath The current pathname to return to after login
 * @param searchParams Optional search params to preserve
 * @returns The login URL with next parameter
 */
export function buildLoginUrl(currentPath: string, searchParams?: URLSearchParams): string {
  const search = searchParams?.toString();
  const fullPath = search ? `${currentPath}?${search}` : currentPath;
  return `/login?next=${encodeURIComponent(fullPath)}`;
}

/**
 * Build an unauthorized URL with context
 * @param from The route the user tried to access
 * @param required The required roles or permissions
 * @returns The unauthorized URL with context parameters
 */
export function buildUnauthorizedUrl(from: string, required: string | string[]): string {
  const params = new URLSearchParams({
    from,
    required: Array.isArray(required) ? required.join(',') : required,
  });
  return `/unauthorized?${params.toString()}`;
}

/**
 * Extract the account ID from a pathname
 * @param pathname The route pathname
 * @returns The account ID or null if not found
 */
export function extractAccountIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/account\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Check if a JWT token is expired
 * @param token The JWT token string
 * @returns boolean indicating if the token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true; // Invalid JWT structure

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp || typeof payload.exp !== 'number') return true; // Missing or invalid exp claim

    return Date.now() > payload.exp * 1000; // Convert to milliseconds
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

export function getTokenTimeRemaining(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp || typeof payload.exp !== 'number') return 0;

    return Math.max(0, payload.exp * 1000 - Date.now());
  } catch {
    return 0;
  }
}

export function getTokenRememberMe(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    return payload.rememberMe === true;
  } catch {
    return false;
  }
}

/**
 * Get the appropriate fallback route for a user based on their context
 * @param hasAccount Whether the user has an account context
 * @param accountId The current account ID if available
 * @returns The fallback route
 */
export function getFallbackRoute(hasAccount: boolean, accountId?: string): string {
  if (hasAccount && accountId) {
    return `/account/${accountId}`;
  }
  return '/accounts';
}

/**
 * Format role names for display
 * @param roleId The role ID
 * @returns The formatted role name
 */
export function formatRoleName(roleId: string): string {
  const roleNames: Record<string, string> = {
    Administrator: 'Administrator',
    AccountAdmin: 'Account Admin',
    ContactAdmin: 'Contact Admin',
    Contact: 'Contact',
    User: 'User',
  };
  return roleNames[roleId] || roleId;
}

/**
 * Check if a user has any of the required roles for a route
 * @param pathname The route pathname
 * @param userRoles The user's roles
 * @param _accountId Optional account ID for context (unused currently)
 * @returns boolean indicating if the user has access
 */
export function hasRouteAccess(
  pathname: string,
  userRoles: string[],
  _accountId?: string,
): boolean {
  const routePerms = getRoutePermissions(pathname);

  // Public routes are accessible to everyone
  if (routePerms?.public) {
    return true;
  }

  // No permissions defined means the route is protected but has no specific role requirements
  if (!routePerms || !routePerms.roles) {
    return true; // Authenticated users can access
  }

  // Check if user has any of the required roles
  return routePerms.roles.some((role) => userRoles.includes(role));
}

/**
 * Log security events for monitoring
 * @param event The security event to log
 */
export function logSecurityEvent(event: {
  type: 'unauthorized_access' | 'login_redirect' | 'session_expired';
  route?: string;
  userId?: string;
  requiredRole?: string;
  timestamp?: number;
}): void {
  const logEvent = {
    ...event,
    timestamp: event.timestamp || Date.now(),
  };

  // In production, this would send to a logging service
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Security Event]', logEvent);
  }

  // Store in session storage for debugging
  const events = JSON.parse(sessionStorage.getItem('security_events') || '[]');
  events.push(logEvent);
  // Keep only last 50 events
  if (events.length > 50) {
    events.shift();
  }
  sessionStorage.setItem('security_events', JSON.stringify(events));
}
