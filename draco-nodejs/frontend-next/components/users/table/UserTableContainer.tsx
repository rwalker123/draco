'use client';

import React, { useState } from 'react';
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
import { ContactType } from '@draco/shared-schemas';

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

  // Export prop
  onExport,

  // Advanced filter props
  filter,
  onFilterChange,
  onApplyFilter,
  onClearFilter,
  hasActiveFilter,

  // Sort props
  sort,
  onAdvancedSortChange,

  ..._restProps
}) => {
  // Component initialization

  // External search is now the only supported mode - no local search fallback
  const currentSearchTerm = externalSearchTerm ?? '';
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);

  // Enhance users with computed properties only - no local filtering or sorting
  // Server provides the correct order and filtering
  const enhancedUsers = useEnhancedUsers(users);

  // Always use enhanced users - server handles all filtering and sorting
  const filteredUsers = enhancedUsers;

  // Note: Virtualization is handled by UserTableWrapper now

  // Setup selection configuration
  const selectionConfig = usePermissionBasedSelection(
    canManageUsers,
    selectionMode,
    undefined,
    onSelectionChange,
  );

  const finalViewConfig = {
    ...DEFAULT_VIEW_CONFIG,
    ...viewConfig,
  };

  const allBulkActions = [
    ...DEFAULT_BULK_ACTIONS.map((action) => ({
      ...action,
      handler: async (users: EnhancedUser[]) => {
        if (action.id === 'assign-role' && users.length > 0) {
          await onAssignRole(users[0]);
        }
      },
    })),
    ...customActions,
  ];

  const handleSearchChange = (term: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(term);
    }
  };

  const handleSearchSubmit = () => {
    if (externalOnSearch) {
      externalOnSearch();
    }
  };

  const handleSearchClear = () => {
    if (externalOnClearSearch) {
      externalOnClearSearch();
    }
  };

  const handleSortChange = (field: string, direction: SortDirection) => {
    onSortChange?.(field, direction);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setCurrentViewMode(mode);
    onViewModeChange?.(mode);
  };

  const handleBulkAction = async (action: UserTableAction, users: EnhancedUser[]) => {
    if (onBulkAction) {
      await onBulkAction(action, users);
    } else {
      await action.handler(users);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    const mockEvent = {
      target: { value: newRowsPerPage.toString() },
    } as React.ChangeEvent<HTMLInputElement>;
    _onRowsPerPageChange(mockEvent);
  };

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
          searchTerm={currentSearchTerm}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onSearchClear={handleSearchClear}
          isShowingSearchResults={externalIsShowingSearchResults}
          customActions={allBulkActions}
          onBulkAction={handleBulkAction}
          canManageUsers={canManageUsers}
          enableAdvancedFilters={enableAdvancedFilters}
          loading={loading || externalSearchLoading}
          onlyWithRoles={onlyWithRoles}
          onOnlyWithRolesChange={onOnlyWithRolesChange}
          onExport={onExport}
          filter={filter}
          onFilterChange={onFilterChange}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
          hasActiveFilter={hasActiveFilter}
        />

        {/* Table Header */}
        <UserTableHeader
          users={filteredUsers}
          viewMode={currentViewMode}
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
          onAutoRegister={
            (_restProps as { onAutoRegister?: (contact: ContactType) => void }).onAutoRegister
          }
          getRoleDisplayName={getRoleDisplayName}
          searchTerm={currentSearchTerm}
          hasFilters={false}
          sort={sort}
          onSortChange={onAdvancedSortChange}
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

export default UserTableContainer;
