'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { UserSelectionProvider } from './context/UserSelectionProvider';
import { useEnhancedUsers, usePermissionBasedSelection } from './hooks/useUserSelection';
import UserTableHeader from './components/UserTableHeader';
import UserTableToolbar from './components/UserTableToolbar';
import UserTableWrapper from './UserTableWrapper';
import {
  UserTableContainerProps,
  ViewMode,
  SortDirection,
  DEFAULT_VIEW_CONFIG,
  DEFAULT_TABLE_COLUMNS,
  DEFAULT_BULK_ACTIONS,
  EnhancedUser,
  UserTableAction,
  UserSelectionActions,
} from '../../../types/userTable';

import { StreamPaginationControl } from '../../pagination';

const UserTableContainer: React.FC<UserTableContainerProps> = ({
  // Original props
  users,
  loading,
  isInitialLoad = false,
  onAssignRole,
  onRemoveRole,
  onEditContact,
  onDeleteContact,
  onDeleteContactPhoto,
  onAddUser,
  canManageUsers,
  page,
  rowsPerPage: _rowsPerPage,
  hasNext: _hasNext,
  hasPrev: _hasPrev,
  onNextPage: _onNextPage,
  onPrevPage: _onPrevPage,
  onRowsPerPageChange: _onRowsPerPageChange,
  getRoleDisplayName,

  // Enhanced props
  viewMode = 'table',
  selectionMode = 'none',
  enableAdvancedFilters = false,
  enableVirtualization: _enableVirtualization = false,
  virtualizationThreshold: _virtualizationThreshold = 100,
  customActions = [],
  viewConfig = {},
  onSelectionChange,
  onViewModeChange,
  onBulkAction,
  onSortChange,

  // Container props
  title,
  subtitle,
  showTitle = true,
  headerActions,
  footerContent,

  // Search props
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange,
  onSearch: externalOnSearch,
  onClearSearch: externalOnClearSearch,
  searchLoading: externalSearchLoading,
  isShowingSearchResults: externalIsShowingSearchResults,

  // Filter props
  onlyWithRoles,
  onOnlyWithRolesChange,

  ..._restProps
}) => {
  // Component initialization

  // Use external search props or fall back to local state
  const currentSearchTerm = externalSearchTerm ?? '';
  const isExternalSearch = Boolean(
    externalSearchTerm !== undefined && externalOnSearchChange && externalOnSearch,
  );

  // Local state for enhanced functionality
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);

  // Use the appropriate search term based on mode
  const searchTerm = isExternalSearch ? currentSearchTerm : localSearchTerm;

  // Enhance users with computed properties
  const enhancedUsers = useEnhancedUsers(users);

  // Apply search filtering and sorting
  const locallyFilteredUsers = useMemo(() => {
    let filtered = enhancedUsers;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.contactDetails?.phone1?.includes(searchTerm) ||
          user.contactDetails?.phone2?.includes(searchTerm) ||
          user.contactDetails?.phone3?.includes(searchTerm),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof EnhancedUser];
      const bValue = b[sortField as keyof EnhancedUser];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enhancedUsers, searchTerm, sortField, sortDirection]);

  // When using external search, don't use local filtering - users are already filtered by backend
  const filteredUsers = isExternalSearch ? enhancedUsers : locallyFilteredUsers;

  // Note: Virtualization is handled by UserTableWrapper now

  // Setup selection configuration
  const selectionConfig = usePermissionBasedSelection(
    canManageUsers,
    selectionMode,
    undefined,
    onSelectionChange,
  );

  // Merge view configuration with defaults
  const finalViewConfig = useMemo(
    () => ({
      ...DEFAULT_VIEW_CONFIG,
      ...viewConfig,
    }),
    [viewConfig],
  );

  // Bulk actions with defaults
  const allBulkActions = useMemo(() => {
    const defaultActions = DEFAULT_BULK_ACTIONS.map((action) => ({
      ...action,
      handler: async (users: EnhancedUser[]) => {
        if (action.id === 'assign-role' && users.length > 0) {
          // Use the first user for role assignment dialog
          await onAssignRole(users[0]);
        }
      },
    }));

    return [...defaultActions, ...customActions];
  }, [customActions, onAssignRole]);

  // Stable event handlers with proper memoization
  const handleSearchChange = useCallback(
    (term: string) => {
      if (isExternalSearch && externalOnSearchChange) {
        externalOnSearchChange(term);
      } else {
        setLocalSearchTerm(term);
      }
    },
    [isExternalSearch, externalOnSearchChange],
  );

  const handleSearchSubmit = useCallback(() => {
    if (isExternalSearch && externalOnSearch) {
      externalOnSearch();
    }
    // For local search, it's applied automatically via useUserFiltering
  }, [isExternalSearch, externalOnSearch]);

  const handleSearchClear = useCallback(() => {
    if (isExternalSearch && externalOnClearSearch) {
      externalOnClearSearch();
    } else {
      setLocalSearchTerm('');
    }
  }, [isExternalSearch, externalOnClearSearch]);

  const handleSortChange = useCallback(
    (field: string, direction: SortDirection) => {
      setSortField(field);
      setSortDirection(direction);
      onSortChange?.(field, direction);
    },
    [onSortChange],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setCurrentViewMode(mode);
      onViewModeChange?.(mode);
    },
    [onViewModeChange],
  );

  const handleBulkAction = useCallback(
    async (action: UserTableAction, users: EnhancedUser[]) => {
      if (onBulkAction) {
        await onBulkAction(action, users);
      } else {
        await action.handler(users);
      }
    },
    [onBulkAction],
  );

  // Stable wrapper for pagination control to match expected signature
  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      // Create a mock event to match the expected signature
      const mockEvent = {
        target: { value: newRowsPerPage.toString() },
      } as React.ChangeEvent<HTMLInputElement>;
      _onRowsPerPageChange(mockEvent);
    },
    [_onRowsPerPageChange],
  );

  // Initial loading state only - show full loading screen for very first load
  if (loading && isInitialLoad) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        flexDirection="column"
        gap={2}
      >
        <Typography variant="body2" color="text.secondary">
          Loading users...
        </Typography>
      </Box>
    );
  }

  return (
    <UserSelectionProvider users={filteredUsers} config={selectionConfig}>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {/* Title Section */}
        {showTitle && (title || subtitle) && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                {title && (
                  <Typography variant="h5" component="h1" gutterBottom>
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {headerActions && <Box>{headerActions}</Box>}
            </Box>
          </Box>
        )}

        {/* Toolbar */}
        <UserTableToolbar
          userCount={filteredUsers.length}
          selectedUsers={[]} // Will be provided by UserSelectionProvider
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onSearchClear={handleSearchClear}
          isShowingSearchResults={externalIsShowingSearchResults}
          onAddUser={onAddUser}
          customActions={allBulkActions}
          onBulkAction={handleBulkAction}
          canManageUsers={canManageUsers}
          enableAdvancedFilters={enableAdvancedFilters}
          loading={loading || externalSearchLoading}
          onlyWithRoles={onlyWithRoles}
          onOnlyWithRolesChange={onOnlyWithRolesChange}
        />

        {/* Table Header */}
        <UserTableHeader
          users={filteredUsers}
          viewMode={currentViewMode}
          sortField={sortField}
          sortDirection={sortDirection}
          selectionMode={selectionConfig.mode}
          selectionState={{
            selectedIds: new Set(),
            selectAll: false,
            indeterminate: false,
            totalSelected: 0,
          }}
          selectionActions={{} as UserSelectionActions} // Will be provided by context
          canManageUsers={canManageUsers}
          onSortChange={handleSortChange}
          onViewModeChange={finalViewConfig.enableViewSwitching ? handleViewModeChange : undefined}
          columns={DEFAULT_TABLE_COLUMNS}
        />

        {/* Content Area - Now using UserTableWrapper for skeleton handling */}
        <UserTableWrapper
          users={filteredUsers}
          loading={loading}
          isInitialLoad={isInitialLoad}
          viewMode={currentViewMode}
          cardSize={finalViewConfig.defaultCardSize}
          canManageUsers={canManageUsers}
          onAssignRole={onAssignRole}
          onRemoveRole={onRemoveRole}
          onEditContact={onEditContact}
          onDeleteContact={onDeleteContact}
          onDeleteContactPhoto={onDeleteContactPhoto}
          onRevokeRegistration={
            (_restProps as { onRevokeRegistration?: (contactId: string) => void })
              .onRevokeRegistration
          }
          getRoleDisplayName={getRoleDisplayName}
          searchTerm={searchTerm}
          hasFilters={false}
          loadingDelay={500}
          skeletonRows={5}
          skeletonCards={6}
        />

        {/* Pagination Controls */}
        <Box sx={{ p: 2 }}>
          <StreamPaginationControl
            page={page}
            rowsPerPage={_rowsPerPage}
            hasNext={_hasNext}
            hasPrev={_hasPrev}
            onNextPage={_onNextPage}
            onPrevPage={_onPrevPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            currentItems={filteredUsers.length}
            itemLabel="Users"
            loading={loading || externalSearchLoading}
            variant="default"
            showPageSize={true}
            showJumpControls={false} // Disable jump controls as we don't have total count
          />
        </Box>

        {/* Footer Content */}
        {footerContent && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>{footerContent}</Box>
        )}
      </Paper>
    </UserSelectionProvider>
  );
};

// Custom comparison function to prevent re-renders when only user data changes
const areEqual = (prevProps: UserTableContainerProps, nextProps: UserTableContainerProps) => {
  // Always re-render if users array changes (this is expected for data updates)
  if (prevProps.users !== nextProps.users) {
    return false;
  }

  // Always re-render if loading state changes
  if (
    prevProps.loading !== nextProps.loading ||
    prevProps.isInitialLoad !== nextProps.isInitialLoad
  ) {
    return false;
  }

  // Always re-render if pagination state changes
  if (
    prevProps.page !== nextProps.page ||
    prevProps.hasNext !== nextProps.hasNext ||
    prevProps.hasPrev !== nextProps.hasPrev ||
    prevProps.rowsPerPage !== nextProps.rowsPerPage
  ) {
    return false;
  }

  // Always re-render if search state changes
  if (
    prevProps.searchTerm !== nextProps.searchTerm ||
    prevProps.searchLoading !== nextProps.searchLoading
  ) {
    return false;
  }

  // For all other props, do a shallow comparison
  const keysToCompare = [
    'canManageUsers',
    'viewMode',
    'selectionMode',
    'enableAdvancedFilters',
    'enableVirtualization',
    'title',
    'subtitle',
    'showTitle',
    'accountId',
    'onAddUser',
  ] as const;

  return keysToCompare.every((key) => prevProps[key] === nextProps[key]);
};

export default memo(UserTableContainer, areEqual);
