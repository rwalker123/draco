import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
  requiredPermission?: string;
  context?: {
    accountId?: string;
    teamId?: string;
    leagueId?: string;
    seasonId?: string;
  };
  fallbackPath?: string;
  showLoading?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  requiredPermission,
  context,
  fallbackPath = '/login',
  showLoading = true
}) => {
  const { user, token, loading: authLoading } = useAuth();
  const { hasRole, hasPermission, loading: roleLoading } = useRole();
  const location = useLocation();

  // Show loading spinner while checking authentication and roles
  if (showLoading && (authLoading || roleLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Check if authentication is required and user is not authenticated
  if (requireAuth && (!token || !user)) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if specific role is required
  if (requiredRole && !hasRole(requiredRole, context)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You don't have the required role to access this page.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Check if specific permission is required
  if (requiredPermission && !hasPermission(requiredPermission, context)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You don't have the required permission to access this page.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // User has access, render the protected content
  return <>{children}</>;
};

// Convenience components for common protection patterns
export const RequireAuth: React.FC<{ children: ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath 
}) => (
  <ProtectedRoute requireAuth={true} fallbackPath={fallbackPath}>
    {children}
  </ProtectedRoute>
);

export const RequireRole: React.FC<{ 
  children: ReactNode; 
  role: string; 
  context?: ProtectedRouteProps['context'];
  fallbackPath?: string;
}> = ({ children, role, context, fallbackPath }) => (
  <ProtectedRoute 
    requireAuth={true} 
    requiredRole={role} 
    context={context}
    fallbackPath={fallbackPath}
  >
    {children}
  </ProtectedRoute>
);

export const RequirePermission: React.FC<{ 
  children: ReactNode; 
  permission: string; 
  context?: ProtectedRouteProps['context'];
  fallbackPath?: string;
}> = ({ children, permission, context, fallbackPath }) => (
  <ProtectedRoute 
    requireAuth={true} 
    requiredPermission={permission} 
    context={context}
    fallbackPath={fallbackPath}
  >
    {children}
  </ProtectedRoute>
);

// Specific role components
export const RequireAdministrator: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RequireRole role="93DAC465-4C64-4422-B444-3CE79C549329">
    {children}
  </RequireRole>
);

export const RequireAccountAdmin: React.FC<{ 
  children: ReactNode; 
  accountId?: string;
}> = ({ children, accountId }) => (
  <RequireRole 
    role="5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A"
    context={accountId ? { accountId } : undefined}
  >
    {children}
  </RequireRole>
);

export const RequireLeagueAdmin: React.FC<{ 
  children: ReactNode; 
  leagueId?: string;
}> = ({ children, leagueId }) => (
  <RequireRole 
    role="672DDF06-21AC-4D7C-B025-9319CC69281A"
    context={leagueId ? { leagueId } : undefined}
  >
    {children}
  </RequireRole>
);

export const RequireTeamAdmin: React.FC<{ 
  children: ReactNode; 
  teamId?: string;
}> = ({ children, teamId }) => (
  <RequireRole 
    role="777D771B-1CBA-4126-B8F3-DD7F3478D40E"
    context={teamId ? { teamId } : undefined}
  >
    {children}
  </RequireRole>
); 