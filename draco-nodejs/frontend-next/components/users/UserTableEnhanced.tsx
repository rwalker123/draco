'use client';

import React, { useMemo, memo } from 'react';
import UserTableContainer from './table/UserTableContainer';
import { UserTableEnhancedProps, SelectionMode } from '../../types/userTable';

const UserTableEnhanced: React.FC<UserTableEnhancedProps> = ({
  // Feature toggles
  enableViewSwitching = false,
  enableAdvancedFilters = false,
  initialViewMode = 'table',
  onModernFeaturesChange,

  // Enhanced props
  accountId,

  // Search props
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  searchLoading,
  isShowingSearchResults,

  // Filter props
  onlyWithRoles,
  onOnlyWithRolesChange,

  // Title prop to override default behavior
  title: customTitle,

  // Registration actions
  onRevokeRegistration,
  onAutoRegister,

  // All original UserTable props
  ...originalProps
}) => {
  // Memoize modern features detection to prevent unnecessary re-renders
  const hasModernFeatures = useMemo(
    () => enableViewSwitching || enableAdvancedFilters,
    [enableViewSwitching, enableAdvancedFilters],
  );

  // Memoize stable view configuration
  const stableViewConfig = useMemo(
    () => ({
      enableViewSwitching,
    }),
    [enableViewSwitching],
  );

  // Selection mode is always 'none' since bulk operations are removed
  const stableSelectionMode = useMemo((): SelectionMode => 'none', []);

  // Notify parent if modern features are being used
  React.useEffect(() => {
    onModernFeaturesChange?.(hasModernFeatures);
  }, [hasModernFeatures, onModernFeaturesChange]);

  return (
    <UserTableContainer
      {...originalProps}
      // Enhanced features
      enableAdvancedFilters={enableAdvancedFilters}
      viewMode={initialViewMode}
      selectionMode={stableSelectionMode}
      viewConfig={stableViewConfig}
      // Enhanced props
      accountId={accountId}
      // Search props
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      onSearch={onSearch}
      onClearSearch={onClearSearch}
      searchLoading={searchLoading}
      isShowingSearchResults={isShowingSearchResults}
      // Filter props
      onlyWithRoles={onlyWithRoles}
      onOnlyWithRolesChange={onOnlyWithRolesChange}
      // Registration management
      onRevokeRegistration={onRevokeRegistration}
      onAutoRegister={onAutoRegister}
      // Title props for enhanced container
      title={
        customTitle !== undefined
          ? customTitle || undefined
          : hasModernFeatures
            ? 'User Management'
            : undefined
      }
      showTitle={hasModernFeatures}
    />
  );
};

// Memoize to prevent re-renders during state updates
export default memo(UserTableEnhanced, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.users === nextProps.users &&
    prevProps.loading === nextProps.loading &&
    prevProps.isInitialLoad === nextProps.isInitialLoad &&
    prevProps.page === nextProps.page &&
    prevProps.hasNext === nextProps.hasNext &&
    prevProps.hasPrev === nextProps.hasPrev &&
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.searchLoading === nextProps.searchLoading &&
    prevProps.canManageUsers === nextProps.canManageUsers &&
    prevProps.rowsPerPage === nextProps.rowsPerPage &&
    prevProps.accountId === nextProps.accountId
  );
});
