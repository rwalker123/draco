'use client';

import React from 'react';
import { TableSortLabel } from '@mui/material';
import type { TableSortLabelProps } from '@mui/material';

/**
 * Keeps the sort icon on the right edge while leaving the label centered.
 * Uses absolute positioning without overriding MUI's rotation transforms.
 */
const RightAlignedTableSortLabel: React.FC<TableSortLabelProps> = ({
  hideSortIcon,
  sx,
  children,
  ...props
}) => (
  <TableSortLabel
    hideSortIcon={hideSortIcon ?? false}
    sx={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingLeft: (theme) => theme.spacing(0.5),
      '& .MuiTableSortLabel-icon': {
        position: 'absolute',
        left: (theme) => theme.spacing(3.5),
        top: '50%',
        marginTop: '-0.55em', // centers without touching transform (keeps rotation intact)
        marginLeft: 0,
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </TableSortLabel>
);

export default RightAlignedTableSortLabel;
