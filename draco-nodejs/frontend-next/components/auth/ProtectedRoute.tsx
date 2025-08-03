'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useAccount } from '../../context/AccountContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  checkAccountBoundary?: boolean;
}

const ProtectedRouteContent: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  checkAccountBoundary = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();
  const { hasRole, hasPermission, loading: roleLoading } = useRole();
  const { currentAccount } = useAccount();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Memoize route data to reduce re-renders
  const routeData = useMemo(() => {
    const search = searchParams.toString();
    return {
      fullPath: search ? `${pathname}?${search}` : pathname,
      roles: Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [],
    };
  }, [pathname, searchParams, requiredRole]);

  useEffect(() => {
    setIsChecking(true);
    setIsAuthorized(null);

    // Wait for auth and role data to load
    if (authLoading || roleLoading) {
      return;
    }

    // Check if user is authenticated
    if (!user || !token) {
      router.replace(`/login?next=${encodeURIComponent(routeData.fullPath)}`);
      return;
    }

    // Check role requirements
    if (routeData.roles.length > 0) {
      const hasRequiredRole = routeData.roles.some((role) => {
        // If checking account boundary, pass account context
        if (checkAccountBoundary && currentAccount) {
          return hasRole(role, { accountId: currentAccount.id });
        }
        return hasRole(role);
      });

      if (!hasRequiredRole) {
        // Redirect to unauthorized page with context
        const params = new URLSearchParams({
          from: pathname,
          required: routeData.roles.join(','),
        });
        router.replace(`/unauthorized?${params.toString()}`);
        return;
      }
    }

    // Check permission requirements
    if (requiredPermission) {
      const hasRequiredPermission =
        checkAccountBoundary && currentAccount
          ? hasPermission(requiredPermission, { accountId: currentAccount.id })
          : hasPermission(requiredPermission);

      if (!hasRequiredPermission) {
        // Redirect to unauthorized page with context
        const params = new URLSearchParams({
          from: pathname,
          required: `permission:${requiredPermission}`,
        });
        router.replace(`/unauthorized?${params.toString()}`);
        return;
      }
    }

    // User is authorized
    setIsAuthorized(true);
    setIsChecking(false);
  }, [
    user,
    token,
    authLoading,
    roleLoading,
    requiredPermission,
    checkAccountBoundary,
    hasRole,
    hasPermission,
    currentAccount,
    router,
    pathname,
    routeData,
  ]);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handleRouteChange = () => {
      // Force re-check when route changes via browser navigation
      setIsChecking(true);
      setIsAuthorized(null);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Also listen for focus to catch tab switches
    const handleFocus = () => {
      if (!user && !authLoading) {
        // Re-check auth status when window regains focus
        setIsChecking(true);
        setIsAuthorized(null);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, authLoading]);

  // Show loading state while checking auth/roles
  if (authLoading || roleLoading || isChecking || isAuthorized === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = (props) => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <ProtectedRouteContent {...props} />
    </Suspense>
  );
};

export default ProtectedRoute;
