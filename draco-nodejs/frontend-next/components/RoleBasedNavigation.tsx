import React, { ReactNode } from 'react';
import { useRole } from '../context/RoleContext';

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
  fallback = null
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
  fallback 
}) => (
  <RoleBasedNavigation 
    requiredRole="93DAC465-4C64-4422-B444-3CE79C549329"
    fallback={fallback}
  >
    {children}
  </RoleBasedNavigation>
);

export const AccountAdminOnly: React.FC<{ 
  children: ReactNode; 
  accountId?: string;
  fallback?: ReactNode;
}> = ({ children, accountId, fallback }) => (
  <RoleBasedNavigation 
    requiredRole="5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A"
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
    requiredRole="672DDF06-21AC-4D7C-B025-9319CC69281A"
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
    requiredRole="777D771B-1CBA-4126-B8F3-DD7F3478D40E"
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
  <RoleBasedNavigation 
    requiredPermission={permission}
    context={context}
    fallback={fallback}
  >
    {children}
  </RoleBasedNavigation>
); 