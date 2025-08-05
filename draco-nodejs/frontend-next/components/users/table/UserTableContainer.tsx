'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Paper,
  Table,
  TableContainer,
  TableBody,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { UserSelectionProvider } from './context/UserSelectionProvider';
import {
  useEnhancedUsers,
  usePermissionBasedSelection,
  useUserFiltering,
} from './hooks/useUserSelection';
import UserTableHeader from './components/UserTableHeader';
import UserTableToolbar from './components/UserTableToolbar';
import UserTableFilters from './components/UserTableFilters';
import UserCardGrid from './components/UserCardGrid';
import {
  UserTableContainerProps,
  ViewMode,
  UserAdvancedFilters,
  SortDirection,
  DEFAULT_VIEW_CONFIG,
  DEFAULT_TABLE_COLUMNS,
  DEFAULT_BULK_ACTIONS,
  EnhancedUser,
  UserTableAction,
  UserSelectionActions,
} from '../../../types/userTable';
import { UserRole } from '../../../types/users';
import { StreamPaginationControl } from '../../pagination';
import UserEmptyState from '../UserEmptyState';

// Import existing components for compatibility
import UserCard from '../UserCard';

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
  enableVirtualization = false,
  virtualizationThreshold = 100,
  customActions = [],
  viewConfig = {},
  advancedFilters = {},
  onSelectionChange,
  onViewModeChange,
  onBulkAction,
  onFiltersChange,
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
  const [filters, setFilters] = useState<UserAdvancedFilters>(advancedFilters);
  const [sortField, setSortField] = useState<string>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);

  // Use the appropriate search term based on mode
  const searchTerm = isExternalSearch ? currentSearchTerm : localSearchTerm;

  // Enhance users with computed properties
  const enhancedUsers = useEnhancedUsers(users);

  // Apply filtering and sorting - always call the hook for consistent render order
  const locallyFilteredUsers = useUserFiltering(
    enhancedUsers,
    searchTerm,
    filters,
    sortField,
    sortDirection,
  );

  // When using external search, don't use local filtering - users are already filtered by backend
  const filteredUsers = isExternalSearch ? enhancedUsers : locallyFilteredUsers;

  // Determine if virtual scrolling should be enabled
  // Only enable virtualization if we have a complete dataset (not paginated)
  // We detect pagination by checking if there are next/prev navigation props
  const isPaginated = _hasNext || _hasPrev || page > 1;
  const shouldEnableVirtualization =
    enableVirtualization && !isPaginated && filteredUsers.length >= virtualizationThreshold;

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

  // Available roles for filtering
  const availableRoles = useMemo(() => {
    const roles: UserRole[] = [];
    enhancedUsers.forEach((user) => {
      if (user.roles) {
        roles.push(...user.roles);
      }
    });
    return Array.from(new Map(roles.map((role) => [role.id, role])).values());
  }, [enhancedUsers]);

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

  const handleFiltersChange = useCallback(
    (newFilters: UserAdvancedFilters) => {
      setFilters(newFilters);
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange],
  );

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

  const clearFilters = useCallback(() => {
    setFilters({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

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
    console.log('📱 SHOWING INITIAL LOADING SCREEN');
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading users...
        </Typography>
      </Box>
    );
  }

  // Don't handle empty state here - let individual view modes handle it within their structure

  // Don't return early for filtered empty state - handle it inline below

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
          onAddUser={onAddUser}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          customActions={allBulkActions}
          onBulkAction={handleBulkAction}
          canManageUsers={canManageUsers}
          enableAdvancedFilters={enableAdvancedFilters}
          loading={loading || externalSearchLoading}
        />

        {/* Advanced Filters */}
        {enableAdvancedFilters && showFilters && (
          <UserTableFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableRoles={availableRoles}
            onClearFilters={clearFilters}
            loading={loading || externalSearchLoading}
          />
        )}

        {/* Table/Content Area */}
        {currentViewMode === 'table' ? (
          <TableContainer>
            <Table stickyHeader={finalViewConfig.stickyHeader}>
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
                onViewModeChange={
                  finalViewConfig.enableViewSwitching ? handleViewModeChange : undefined
                }
                columns={DEFAULT_TABLE_COLUMNS}
              />
              <TableBody>
                {/* Pagination loading indicator - statistics style */}
                {loading && !isInitialLoad ? (
                  <tr>
                    <td colSpan={100} style={{ textAlign: 'center', padding: '20px' }}>
                      <CircularProgress size={24} />
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      canManageUsers={canManageUsers}
                      onAssignRole={onAssignRole}
                      onRemoveRole={onRemoveRole}
                      onEditContact={onEditContact}
                      onDeleteContactPhoto={onDeleteContactPhoto}
                      getRoleDisplayName={getRoleDisplayName}
                    />
                  ))
                ) : (
                  <UserEmptyState
                    searchTerm={searchTerm}
                    hasFilters={Object.keys(filters).length > 0}
                    wrapper="table-row"
                    colSpan={100}
                    showIcon={false} // Don't show icon in table row for space reasons
                  />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // Card View
          <>
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
              selectionActions={{} as UserSelectionActions}
              canManageUsers={canManageUsers}
              onSortChange={handleSortChange}
              onViewModeChange={
                finalViewConfig.enableViewSwitching ? handleViewModeChange : undefined
              }
              columns={DEFAULT_TABLE_COLUMNS}
            />
            {/* Card view with loading overlay */}
            {(() =>
              console.log('🎴 RENDERING CARD GRID:', {
                userCount: filteredUsers.length,
                viewMode: 'card',
              }))()}
            <Box sx={{ position: 'relative' }}>
              <UserCardGrid
                users={filteredUsers}
                cardSize={finalViewConfig.defaultCardSize}
                viewConfig={finalViewConfig}
                onAssignRole={onAssignRole}
                onRemoveRole={onRemoveRole}
                onEditContact={onEditContact}
                onDeleteContact={onDeleteContact}
                onDeleteContactPhoto={onDeleteContactPhoto}
                canManageUsers={canManageUsers}
                getRoleDisplayName={getRoleDisplayName}
                enableVirtualization={shouldEnableVirtualization}
                virtualizationThreshold={virtualizationThreshold}
                searchTerm={searchTerm}
                hasFilters={Object.keys(filters).length > 0}
              />
              {/* Loading overlay for pagination */}
              {loading && !isInitialLoad && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    transition: 'opacity 0.2s ease-in-out',
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Creative Pagination Controls */}
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
