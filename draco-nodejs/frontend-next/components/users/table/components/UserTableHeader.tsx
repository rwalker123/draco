'use client';

import React, { memo } from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  Checkbox,
  Box,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import {
  UserTableHeaderProps,
  SortDirection,
  DEFAULT_TABLE_COLUMNS,
} from '../../../../types/userTable';
import { useUserSelectionSafe } from '../context/UserSelectionProvider';

const UserTableHeader: React.FC<UserTableHeaderProps> = ({
  users,
  viewMode,
  sortField,
  sortDirection,
  selectionMode,
  selectionState: _selectionStateProp, // Kept for compatibility but will use context
  selectionActions: _selectionActionsProp, // Kept for compatibility but will use context
  canManageUsers,
  onSortChange,
  onViewModeChange,
  columns = DEFAULT_TABLE_COLUMNS,
}) => {
  // Use context for selection actions instead of props with fallback
  const userSelectionContext = useUserSelectionSafe();
  const state = userSelectionContext?.state || {
    selectedIds: new Set(),
    selectAll: false,
    indeterminate: false,
    totalSelected: 0,
  };
  const selectionActions = userSelectionContext?.actions;
  const handleSort = (field: string) => {
    if (!columns.find((col) => col.id === field)?.sortable) return;

    const newDirection: SortDirection =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectionActions) return;

    if (event.target.checked) {
      selectionActions.selectAll();
    } else {
      selectionActions.deselectAll();
    }
  };

  // Only show table header for table view mode
  if (viewMode === 'card' || viewMode === 'list') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="h2">
          {users.length} {users.length === 1 ? 'User' : 'Users'}
          {state.totalSelected > 0 && (
            <Typography component="span" color="primary" sx={{ ml: 1 }}>
              ({state.totalSelected} selected)
            </Typography>
          )}
        </Typography>

        {onViewModeChange && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Table View">
              <IconButton
                size="small"
                color={'default'}
                onClick={() => onViewModeChange('table')}
                aria-label="Switch to table view"
              >
                <TableChartIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Card View">
              <IconButton
                size="small"
                color={viewMode === 'card' ? 'primary' : 'default'}
                onClick={() => onViewModeChange('card')}
                aria-label="Switch to card view"
              >
                <ViewModuleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                size="small"
                color={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => onViewModeChange('list')}
                aria-label="Switch to list view"
              >
                <ViewListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    );
  }

  const showCheckboxColumn = selectionMode !== 'none' && canManageUsers;
  const selectableUsersCount = users.filter(
    (user) => selectionActions?.canSelectUser(user) ?? true,
  ).length;

  return (
    <TableHead>
      <TableRow>
        {showCheckboxColumn && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={state.indeterminate}
              checked={state.selectAll}
              onChange={handleSelectAllChange}
              disabled={selectableUsersCount === 0}
              inputProps={{
                'aria-label': state.selectAll ? 'Deselect all users' : 'Select all users',
              }}
            />
          </TableCell>
        )}

        {columns
          .filter((column) => !column.hidden)
          .map((column) => (
            <TableCell
              key={column.id}
              align={column.align || 'left'}
              style={{
                minWidth: column.minWidth,
                width: column.width,
              }}
              sortDirection={sortField === column.field ? sortDirection : false}
            >
              {column.sortable ? (
                <TableSortLabel
                  active={sortField === column.field}
                  direction={sortField === column.field ? sortDirection : 'asc'}
                  onClick={() => handleSort(column.field)}
                  aria-label={`Sort by ${column.label}`}
                >
                  {column.label}
                </TableSortLabel>
              ) : (
                <Typography variant="subtitle2" fontWeight={600}>
                  {column.label}
                </Typography>
              )}
            </TableCell>
          ))}

        {onViewModeChange && (
          <TableCell align="right" sx={{ width: 120 }}>
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              <Tooltip title="Table View">
                <IconButton
                  size="small"
                  color={'primary'}
                  onClick={() => onViewModeChange('table')}
                  aria-label="Switch to table view"
                >
                  <TableChartIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Card View">
                <IconButton
                  size="small"
                  color={'default'}
                  onClick={() => onViewModeChange('card')}
                  aria-label="Switch to card view"
                >
                  <ViewModuleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton
                  size="small"
                  color={'default'}
                  onClick={() => onViewModeChange('list')}
                  aria-label="Switch to list view"
                >
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
};

// Custom comparison function for UserTableHeader
const areHeaderPropsEqual = (prevProps: UserTableHeaderProps, nextProps: UserTableHeaderProps) => {
  // Re-render only if these specific props change
  return (
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.sortField === nextProps.sortField &&
    prevProps.sortDirection === nextProps.sortDirection &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.canManageUsers === nextProps.canManageUsers &&
    prevProps.users.length === nextProps.users.length && // Only compare length for selection state
    prevProps.onSortChange === nextProps.onSortChange &&
    prevProps.onViewModeChange === nextProps.onViewModeChange
  );
};

export default memo(UserTableHeader, areHeaderPropsEqual);
