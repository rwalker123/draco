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
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { ContactFilterFieldType, ContactFilterOpType } from '@draco/shared-schemas';
import { UserTableToolbarProps, UserTableAction } from '../../../../types/userTable';
import {
  FILTER_FIELDS,
  FILTER_OPERATIONS,
  getApplicableOperations,
  getFieldType,
} from '../../../../types/userFilters';

const UserTableToolbar: React.FC<UserTableToolbarProps> = ({
  userCount,
  selectedUsers,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  isShowingSearchResults = false,
  customActions,
  onBulkAction,
  canManageUsers,
  loading = false,
  onlyWithRoles = false,
  onOnlyWithRolesChange,
  onExport,
  enableAdvancedFilters = false,
  filter,
  onFilterChange,
  onApplyFilter,
  onClearFilter,
  hasActiveFilter = false,
}) => {
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    onSearchClear();
  };

  const handleOnlyWithRolesToggle = () => {
    onOnlyWithRolesChange?.(!onlyWithRoles);
  };

  const selectedFieldType = filter?.filterField ? getFieldType(filter.filterField) : 'string';
  const applicableOperations = getApplicableOperations(selectedFieldType);

  const handleFieldChange = (field: ContactFilterFieldType | '') => {
    if (!filter || !onFilterChange) return;
    const newFieldType = field ? getFieldType(field) : 'string';
    const currentOpValid =
      filter.filterOp &&
      FILTER_OPERATIONS.find(
        (op) => op.value === filter.filterOp && op.applicableTypes.includes(newFieldType),
      );

    onFilterChange({
      ...filter,
      filterField: field,
      filterOp: currentOpValid ? filter.filterOp : '',
    });
  };

  const handleOpChange = (op: ContactFilterOpType | '') => {
    if (!filter || !onFilterChange) return;
    onFilterChange({
      ...filter,
      filterOp: op,
    });
  };

  const handleValueChange = (value: string) => {
    if (!filter || !onFilterChange) return;
    onFilterChange({
      ...filter,
      filterValue: value,
    });
  };

  const handleFilterKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && canApplyFilter) {
      onApplyFilter?.();
    }
  };

  const canApplyFilter =
    filter && filter.filterField && filter.filterOp && filter.filterValue.trim();

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

  const availableBulkActions = customActions.filter((action) => {
    if (!canManageUsers && action.requiresPermission) return false;
    if (action.disabled) return !action.disabled(selectedUsers);
    return true;
  });

  return (
    <Box>
      <Toolbar
        sx={{
          pl: 2,
          pr: 2,
          minHeight: { sm: 64 },
          backgroundColor: selectedUsers.length > 0 ? 'action.selected' : 'background.paper',
        }}
      >
        {selectedUsers.length > 0 ? (
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
          <>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                rowGap: 1.5,
              }}
            >
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                sx={{ minWidth: 200, maxWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (searchTerm || isShowingSearchResults) && (
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

              <FormControlLabel
                control={
                  <Switch
                    checked={onlyWithRoles}
                    onChange={handleOnlyWithRolesToggle}
                    disabled={loading}
                    size="small"
                  />
                }
                label="With roles only"
                sx={{ ml: 0 }}
              />

              {enableAdvancedFilters && filter && onFilterChange && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={filter.filterField}
                      onChange={(e) =>
                        handleFieldChange(e.target.value as ContactFilterFieldType | '')
                      }
                      label="Field"
                      disabled={loading}
                    >
                      <MenuItem value="">
                        <em>Select</em>
                      </MenuItem>
                      {FILTER_FIELDS.map((field) => (
                        <MenuItem key={field.value} value={field.value}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 130 }} disabled={!filter.filterField}>
                    <InputLabel>Operation</InputLabel>
                    <Select
                      value={filter.filterOp}
                      onChange={(e) => handleOpChange(e.target.value as ContactFilterOpType | '')}
                      label="Operation"
                      disabled={loading || !filter.filterField}
                    >
                      <MenuItem value="">
                        <em>Select</em>
                      </MenuItem>
                      {applicableOperations.map((op) => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Value"
                    value={filter.filterValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    disabled={loading || !filter.filterOp}
                    sx={{ minWidth: 100, maxWidth: 140 }}
                    type={selectedFieldType === 'number' ? 'number' : 'text'}
                  />

                  <Button
                    variant="contained"
                    size="small"
                    onClick={onApplyFilter}
                    disabled={loading || !canApplyFilter}
                  >
                    Apply
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onClearFilter}
                    disabled={loading || !hasActiveFilter}
                  >
                    Clear
                  </Button>
                </>
              )}
            </Box>

            {canManageUsers && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExportIcon />}
                  disabled={loading || userCount === 0}
                  onClick={onExport}
                >
                  Export
                </Button>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </Box>
  );
};

const areToolbarPropsEqual = (
  prevProps: UserTableToolbarProps,
  nextProps: UserTableToolbarProps,
) => {
  return (
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.loading === nextProps.loading &&
    prevProps.canManageUsers === nextProps.canManageUsers &&
    prevProps.onlyWithRoles === nextProps.onlyWithRoles &&
    prevProps.selectedUsers.length === nextProps.selectedUsers.length &&
    prevProps.userCount === nextProps.userCount &&
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onSearchSubmit === nextProps.onSearchSubmit &&
    prevProps.onSearchClear === nextProps.onSearchClear &&
    prevProps.hasActiveFilter === nextProps.hasActiveFilter &&
    prevProps.filter === nextProps.filter
  );
};

export default memo(UserTableToolbar, areToolbarPropsEqual);
