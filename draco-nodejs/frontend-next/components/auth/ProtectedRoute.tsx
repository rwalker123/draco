'use client';

import React, { Suspense, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { extractAccountIdFromPath } from '../../utils/authHelpers';
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
  const { user, token, loading: authLoading, initialized: authInitialized } = useAuth();
  const {
    userRoles,
    roleMetadata,
    hasRole,
    hasPermission,
    loading: roleLoading,
    initialized: roleInitialized,
    error: roleError,
  } = useRole();
  const { currentAccount, loading: accountLoading, initialized: accountInitialized } = useAccount();

  // Memoize route data to reduce re-renders
  const routeData = useMemo(() => {
    const search = searchParams.toString();
    return {
      fullPath: search ? `${pathname}?${search}` : pathname,
      roles: Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [],
    };
  }, [pathname, searchParams, requiredRole]);

  const shouldWaitForAccount = checkAccountBoundary && (!accountInitialized || accountLoading);

  type Evaluation =
    | { status: 'pending' }
    | { status: 'redirect'; url: string }
    | { status: 'authorized' };

  const evaluation: Evaluation = useMemo(() => {
    if (
      !authInitialized ||
      !roleInitialized ||
      authLoading ||
      roleLoading ||
      shouldWaitForAccount
    ) {
      return { status: 'pending' };
    }

    if (!user || !token) {
      const accountId = extractAccountIdFromPath(pathname || '');
      const params = new URLSearchParams({ next: routeData.fullPath });
      if (accountId) params.set('accountId', accountId);
      return { status: 'redirect', url: `/login?${params.toString()}` };
    }

    if (routeData.roles.length > 0) {
      if (!userRoles) {
        return { status: 'pending' };
      }

      const hasRequiredRole = routeData.roles.some((role) => {
        if (checkAccountBoundary && currentAccount) {
          return hasRole(role, { accountId: currentAccount.id });
        }
        return hasRole(role);
      });

      if (!hasRequiredRole) {
        const params = new URLSearchParams({
          from: pathname,
          required: routeData.roles.join(','),
        });
        return { status: 'redirect', url: `/unauthorized?${params.toString()}` };
      }
    }

    if (requiredPermission) {
      if (!roleMetadata) {
        if (roleError) {
          const params = new URLSearchParams({
            from: pathname,
            required: `permission:${requiredPermission}`,
            error: 'Failed to load role permissions',
          });
          return { status: 'redirect', url: `/unauthorized?${params.toString()}` };
        }
        return { status: 'pending' };
      }

      const hasRequiredPermission =
        checkAccountBoundary && currentAccount
          ? hasPermission(requiredPermission, { accountId: currentAccount.id })
          : hasPermission(requiredPermission);

      if (!hasRequiredPermission) {
        const params = new URLSearchParams({
          from: pathname,
          required: `permission:${requiredPermission}`,
        });
        return { status: 'redirect', url: `/unauthorized?${params.toString()}` };
      }
    }

    return { status: 'authorized' };
  }, [
    authInitialized,
    checkAccountBoundary,
    currentAccount,
    hasPermission,
    hasRole,
    authLoading,
    pathname,
    requiredPermission,
    roleError,
    roleInitialized,
    roleLoading,
    roleMetadata,
    routeData,
    shouldWaitForAccount,
    token,
    user,
    userRoles,
  ]);

  useEffect(() => {
    if (evaluation.status === 'redirect') {
      router.replace(evaluation.url);
    }
  }, [evaluation, router]);

  if (evaluation.status === 'pending') {
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
  return evaluation.status === 'authorized' ? <>{children}</> : null;
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
