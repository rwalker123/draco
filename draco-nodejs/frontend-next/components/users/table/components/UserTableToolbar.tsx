'use client';

import React, { useState, memo } from 'react';
import {
  Toolbar,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Alert,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  GetApp as ExportIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { UserTableToolbarProps, UserTableAction } from '../../../../types/userTable';

const UserTableToolbar: React.FC<UserTableToolbarProps> = ({
  userCount,
  selectedUsers,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  filters,
  onFiltersChange,
  customActions,
  onBulkAction,
  canManageUsers,
  enableAdvancedFilters,
  loading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value !== undefined;
    return value !== undefined && value !== null;
  });

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    onSearchClear();
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const handleBulkActionClick = async (action: UserTableAction) => {
    handleBulkMenuClose();
    await onBulkAction(action, selectedUsers);
  };

  const clearFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    if (Array.isArray(newFilters[filterKey as keyof typeof filters])) {
      delete newFilters[filterKey as keyof typeof filters];
    } else {
      (newFilters as Record<string, unknown>)[filterKey] = undefined;
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  // Available bulk actions for selected users
  const availableBulkActions = customActions.filter((action) => {
    if (!canManageUsers && action.requiresPermission) return false;
    if (action.disabled) return !action.disabled(selectedUsers);
    return true;
  });

  return (
    <>
      <Toolbar
        sx={{
          pl: 2,
          pr: 2,
          minHeight: { sm: 64 },
          backgroundColor: selectedUsers.length > 0 ? 'action.selected' : 'background.paper',
        }}
      >
        {selectedUsers.length > 0 ? (
          // Bulk actions toolbar when users are selected
          <>
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
            </Typography>

            {availableBulkActions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {availableBulkActions.slice(0, 2).map((action) => (
                  <Button
                    key={action.id}
                    variant="outlined"
                    size="small"
                    startIcon={<action.icon />}
                    onClick={() => handleBulkActionClick(action)}
                    color={action.color || 'primary'}
                    disabled={loading}
                  >
                    {action.label}
                  </Button>
                ))}

                {availableBulkActions.length > 2 && (
                  <>
                    <IconButton
                      size="small"
                      onClick={handleBulkMenuOpen}
                      disabled={loading}
                      aria-label="More bulk actions"
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={bulkMenuAnchor}
                      open={Boolean(bulkMenuAnchor)}
                      onClose={handleBulkMenuClose}
                    >
                      {availableBulkActions.slice(2).map((action) => (
                        <MenuItem
                          key={action.id}
                          onClick={() => handleBulkActionClick(action)}
                          disabled={loading}
                        >
                          <Box component={action.icon} sx={{ mr: 1 }} />
                          {action.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Box>
            )}
          </>
        ) : (
          // Normal toolbar with search and filters
          <>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        aria-label="Clear search"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />

              {enableAdvancedFilters && (
                <IconButton
                  onClick={handleToggleFilters}
                  color={hasActiveFilters ? 'primary' : 'default'}
                  aria-label="Toggle filters"
                  disabled={loading}
                >
                  <Badge color="primary" variant="dot" invisible={!hasActiveFilters}>
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {userCount} {userCount === 1 ? 'user' : 'users'}
              </Typography>

              {canManageUsers && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    disabled={loading}
                  >
                    Add User
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ExportIcon />}
                    disabled={loading || userCount === 0}
                  >
                    Export
                  </Button>
                </>
              )}
            </Box>
          </>
        )}
      </Toolbar>

      {/* Active filters display */}
      {hasActiveFilters && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>

            {filters.roles && filters.roles.length > 0 && (
              <Chip
                size="small"
                label={`Roles: ${filters.roles.join(', ')}`}
                onDelete={() => clearFilter('roles')}
                color="primary"
                variant="outlined"
              />
            )}

            {filters.hasContactInfo !== undefined && (
              <Chip
                size="small"
                label={`Has contact info: ${filters.hasContactInfo ? 'Yes' : 'No'}`}
                onDelete={() => clearFilter('hasContactInfo')}
                color="primary"
                variant="outlined"
              />
            )}

            {filters.contactMethods && filters.contactMethods.length > 0 && (
              <Chip
                size="small"
                label={`Contact: ${filters.contactMethods.join(', ')}`}
                onDelete={() => clearFilter('contactMethods')}
                color="primary"
                variant="outlined"
              />
            )}

            <Button size="small" variant="text" onClick={clearAllFilters} sx={{ ml: 1 }}>
              Clear all
            </Button>
          </Box>
        </Box>
      )}

      {/* Bulk action feedback */}
      {selectedUsers.length > 0 && availableBulkActions.length === 0 && canManageUsers && (
        <Collapse in={true}>
          <Alert severity="info" sx={{ mx: 2, mb: 1 }}>
            No bulk actions available for the selected users. Individual actions can be accessed
            from each user row.
          </Alert>
        </Collapse>
      )}
    </>
  );
};

// Custom comparison function for UserTableToolbar
const areToolbarPropsEqual = (
  prevProps: UserTableToolbarProps,
  nextProps: UserTableToolbarProps,
) => {
  // Re-render only if these specific props change
  return (
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.loading === nextProps.loading &&
    prevProps.canManageUsers === nextProps.canManageUsers &&
    prevProps.enableAdvancedFilters === nextProps.enableAdvancedFilters &&
    prevProps.selectedUsers.length === nextProps.selectedUsers.length && // Compare selection count instead of array
    prevProps.userCount === nextProps.userCount && // Compare user count directly
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onSearchSubmit === nextProps.onSearchSubmit &&
    prevProps.onSearchClear === nextProps.onSearchClear
  );
};

export default memo(UserTableToolbar, areToolbarPropsEqual);
