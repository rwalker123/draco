import React, { ReactNode } from 'react';
import { useRole } from '../context/RoleContext';
import { ROLE_NAME_TO_ID } from '@/utils/roleUtils';

interface RoleBasedNavigationProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  context?: {
    accountId?: string;
    teamId?: string;
    leagueId?: string;
    seasonId?: string;
  };
  fallback?: ReactNode;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  children,
  requiredRole,
  requiredPermission,
  context,
  fallback = null,
}) => {
  const { hasRole, hasPermission } = useRole();

  // If no requirements specified, show the content
  if (!requiredRole && !requiredPermission) {
    return <>{children}</>;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole, context)) {
    return <>{fallback}</>;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission, context)) {
    return <>{fallback}</>;
  }

  // User has access, show the content
  return <>{children}</>;
};

// Convenience components for common navigation patterns
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback,
}) => (
  <RoleBasedNavigation requiredRole={ROLE_NAME_TO_ID['Administrator']} fallback={fallback}>
    {children}
  </RoleBasedNavigation>
);

export const AccountAdminOnly: React.FC<{
  children: ReactNode;
  accountId?: string;
  fallback?: ReactNode;
}> = ({ children, accountId, fallback }) => (
  <RoleBasedNavigation
    requiredRole={ROLE_NAME_TO_ID['AccountAdmin']}
    context={accountId ? { accountId } : undefined}
    fallback={fallback}
  >
    {children}
  </RoleBasedNavigation>
);

export const LeagueAdminOnly: React.FC<{
  children: ReactNode;
  leagueId?: string;
  fallback?: ReactNode;
}> = ({ children, leagueId, fallback }) => (
  <RoleBasedNavigation
    requiredRole={ROLE_NAME_TO_ID['LeagueAdmin']}
    context={leagueId ? { leagueId } : undefined}
    fallback={fallback}
  >
    {children}
  </RoleBasedNavigation>
);

export const TeamAdminOnly: React.FC<{
  children: ReactNode;
  teamId?: string;
  fallback?: ReactNode;
}> = ({ children, teamId, fallback }) => (
  <RoleBasedNavigation
    requiredRole={ROLE_NAME_TO_ID['TeamAdmin']}
    context={teamId ? { teamId } : undefined}
    fallback={fallback}
  >
    {children}
  </RoleBasedNavigation>
);

export const PermissionBasedNavigation: React.FC<{
  children: ReactNode;
  permission: string;
  context?: RoleBasedNavigationProps['context'];
  fallback?: ReactNode;
}> = ({ children, permission, context, fallback }) => (
  <RoleBasedNavigation requiredPermission={permission} context={context} fallback={fallback}>
    {children}
  </RoleBasedNavigation>
);
