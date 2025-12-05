'use client';

import React from 'react';
import { Paper } from '@mui/material';
import { ContactRoleType, ContactType } from '@draco/shared-schemas';
import UserTableContent from './UserTableContent';
import UserTableSkeleton from './UserTableSkeleton';
import UserCardGrid from './components/UserCardGrid';
import UserCardSkeleton from './UserCardSkeleton';
import { useTableLoadingState } from '../../../hooks/useTableLoadingState';
import { useEnhancedUsers } from './hooks/useUserSelection';
import { ViewMode, DEFAULT_VIEW_CONFIG } from '../../../types/userTable';

interface UserTableWrapperProps {
  // Data props
  users: ContactType[];
  loading: boolean;
  isInitialLoad: boolean;

  // View mode
  viewMode: ViewMode;
  cardSize?: 'compact' | 'comfortable' | 'spacious';

  // Action handlers
  canManageUsers: boolean;
  onAssignRole: (user: ContactType) => Promise<void>;
  onRemoveRole: (user: ContactType, role: ContactRoleType) => Promise<void>;
  onEditContact?: (contact: ContactType) => Promise<void>;
  onDeleteContact?: (contact: ContactType) => Promise<void>;
  onDeleteContactPhoto?: (contactId: string) => Promise<void>;
  onRevokeRegistration?: (contactId: string) => void;
  onAutoRegister?: (contact: ContactType) => void;
  getRoleDisplayName: (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ) => string;

  // Search and filter props
  searchTerm?: string;
  hasFilters?: boolean;

  // Loading configuration
  loadingDelay?: number;
  skeletonRows?: number;
  skeletonCards?: number;
}

const UserTableWrapper: React.FC<UserTableWrapperProps> = ({
  users,
  loading,
  isInitialLoad,
  viewMode,
  cardSize = 'comfortable',
  canManageUsers,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContact,
  onDeleteContactPhoto,
  onRevokeRegistration,
  onAutoRegister,
  getRoleDisplayName,
  searchTerm,
  hasFilters = false,
  loadingDelay = 500,
  skeletonRows = 5,
  skeletonCards = 6,
}) => {
  // Enhance users with computed properties
  const enhancedUsers = useEnhancedUsers(users);

  const { shouldShowSkeleton } = useTableLoadingState({
    loading,
    isInitialLoad,
    loadingDelay,
  });

  // Show skeleton if loading and delay has passed
  if (shouldShowSkeleton) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {viewMode === 'table' ? (
          <UserTableSkeleton rows={skeletonRows} />
        ) : (
          <UserCardSkeleton cards={skeletonCards} cardSize={cardSize} />
        )}
      </Paper>
    );
  }

  // Show actual content
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {viewMode === 'table' ? (
        <UserTableContent
          users={users}
          canManageUsers={canManageUsers}
          onAssignRole={onAssignRole}
          onRemoveRole={onRemoveRole}
          onEditContact={onEditContact || (() => Promise.resolve())}
          onDeleteContact={onDeleteContact}
          onDeleteContactPhoto={onDeleteContactPhoto || (() => Promise.resolve())}
          onRevokeRegistration={onRevokeRegistration}
          onAutoRegister={onAutoRegister}
          getRoleDisplayName={getRoleDisplayName}
          searchTerm={searchTerm}
          hasFilters={hasFilters}
        />
      ) : (
        <UserCardGrid
          users={enhancedUsers}
          cardSize={cardSize}
          viewConfig={{ ...DEFAULT_VIEW_CONFIG, defaultCardSize: cardSize }}
          onAssignRole={onAssignRole}
          onRemoveRole={onRemoveRole}
          onEditContact={onEditContact || (() => Promise.resolve())}
          onDeleteContact={onDeleteContact}
          onDeleteContactPhoto={onDeleteContactPhoto || (() => Promise.resolve())}
          onRevokeRegistration={onRevokeRegistration}
          onAutoRegister={onAutoRegister}
          canManageUsers={canManageUsers}
          getRoleDisplayName={getRoleDisplayName}
          searchTerm={searchTerm}
          hasFilters={hasFilters}
        />
      )}
    </Paper>
  );
};

export default UserTableWrapper;
