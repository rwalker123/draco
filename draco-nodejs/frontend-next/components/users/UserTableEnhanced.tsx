'use client';

import React from 'react';
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

  // Export action
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

  // All original UserTable props
  ...originalProps
}) => {
  const hasModernFeatures = enableViewSwitching || enableAdvancedFilters;

  const stableViewConfig = { enableViewSwitching };

  const stableSelectionMode: SelectionMode = 'none';

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
      // Export
      onExport={onExport}
      // Advanced filter props
      filter={filter}
      onFilterChange={onFilterChange}
      onApplyFilter={onApplyFilter}
      onClearFilter={onClearFilter}
      hasActiveFilter={hasActiveFilter}
      // Sort props
      sort={sort}
      onAdvancedSortChange={onAdvancedSortChange}
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

export default UserTableEnhanced;
