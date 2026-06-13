'use client';

import React from 'react';
import { Box, TableCell, TableSortLabel, Tooltip, Typography, alpha } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface StatHeaderColumn {
  field: string;
  label: string;
  align: 'left' | 'right' | 'center';
  tooltip?: string;
  sortable?: boolean;
}

interface StatHeaderLabelProps {
  column: StatHeaderColumn;
  activeField?: string;
  sortOrder: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export const StatHeaderLabel: React.FC<StatHeaderLabelProps> = ({
  column,
  activeField,
  sortOrder,
  onSort,
}) => {
  const justifyContent =
    column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start';
  const sharedSx = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent,
    width: '100%',
    textAlign: column.align,
    gap: column.align === 'center' ? 0.5 : 0.25,
  } as const;
  const labelNode = (
    <Box component="span" sx={{ flexShrink: 0 }}>
      {column.label}
    </Box>
  );
  const centerFiller =
    column.align === 'center' ? (
      <Box
        component="span"
        sx={{ display: 'inline-block', width: '1.5em', flexShrink: 0 }}
        aria-hidden="true"
      />
    ) : null;

  if (column.sortable !== false && onSort) {
    return (
      <Tooltip title={column.tooltip || ''}>
        <TableSortLabel
          active={activeField === column.field}
          direction={activeField === column.field ? sortOrder : 'asc'}
          onClick={() => onSort(String(column.field))}
          sx={{
            ...sharedSx,
            '& .MuiTableSortLabel-icon': {
              order: -1,
              marginRight: column.align === 'center' ? 0.5 : 0.25,
              marginLeft: 0,
            },
          }}
        >
          {labelNode}
          {centerFiller}
        </TableSortLabel>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={column.tooltip || ''}>
      <Typography variant="inherit" component="span" sx={sharedSx}>
        {labelNode}
        {centerFiller}
      </Typography>
    </Tooltip>
  );
};

interface SortableStatHeaderCellProps extends StatHeaderLabelProps {
  active: boolean;
}

export const SortableStatHeaderCell: React.FC<SortableStatHeaderCellProps> = ({
  column,
  activeField,
  sortOrder,
  onSort,
  active,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.field,
  });

  return (
    <TableCell
      ref={setNodeRef}
      align={column.align}
      {...attributes}
      role="columnheader"
      aria-roledescription="sortable column"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        fontWeight: 'bold',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 3 : undefined,
        backgroundColor: 'background.paper',
        ...(active && {
          backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.02),
        }),
      }}
      {...listeners}
    >
      <StatHeaderLabel
        column={column}
        activeField={activeField}
        sortOrder={sortOrder}
        onSort={onSort}
      />
    </TableCell>
  );
};
