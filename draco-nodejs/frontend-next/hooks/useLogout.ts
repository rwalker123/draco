'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { isPublicRoute } from '../config/routePermissions';
import { extractAccountIdFromPath } from '../utils/authHelpers';

/**
 * Enhanced logout hook that handles redirects from protected pages
 */
export function useLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout: authLogout } = useAuth();

  const logout = (options?: { redirectTo?: string; refreshPage?: boolean }) => {
    // Clear auth state
    authLogout(false);

    // Determine where to redirect
    let redirectPath = options?.redirectTo;

    if (!redirectPath) {
      // Check if current page requires auth
      if (!isPublicRoute(pathname)) {
        // Extract account ID from current path if possible
        const accountId = extractAccountIdFromPath(pathname);

        if (accountId) {
          // Redirect to account home page (which is public)
          redirectPath = `/account/${accountId}`;
        } else {
          // Redirect to accounts page
          redirectPath = '/accounts';
        }
      }
    }

    // Perform redirect if needed
    if (redirectPath) {
      // Use replace to prevent going back to protected page
      router.replace(redirectPath);
    } else if (options?.refreshPage) {
      // Only refresh if explicitly requested and no redirect
      window.location.reload();
    }
  };

  return logout;
}
