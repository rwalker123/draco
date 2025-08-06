'use client';

import React, { memo } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { ViewModule as ViewModuleIcon, TableChart as TableChartIcon } from '@mui/icons-material';
import { UserTableHeaderProps } from '../../../../types/userTable';

const UserTableHeader: React.FC<UserTableHeaderProps> = ({ viewMode, onViewModeChange }) => {
  // Only render view switcher, centered, for both card and table views
  if (!onViewModeChange) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Table View">
          <IconButton
            size="small"
            color={viewMode === 'table' ? 'primary' : 'default'}
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
      </Box>
    </Box>
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
