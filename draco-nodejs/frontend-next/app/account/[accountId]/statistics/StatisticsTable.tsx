'use client';

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import TeamBadges from './TeamBadges';
import ScrollableTable from './ScrollableTable';

export interface ColumnConfig<T> {
  field: keyof T;
  label: string;
  align: 'left' | 'right' | 'center';
  tooltip?: string;
  primary?: boolean;
  sortable?: boolean;
  formatter?: (value: unknown, row?: T) => string;
}

interface StatisticsTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  emptyMessage?: string;
  getRowKey: (item: T, index: number) => string;
  sortField?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: keyof T) => void;
  hideHeader?: boolean;
}

// Common formatters
export const formatBattingAverage = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return isNaN(num) ? '0.000' : num.toFixed(3);
};

export const formatPercentage = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return isNaN(num) ? '0.000' : num.toFixed(3);
};

export const formatERA = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export const formatIP = (ip: number, ip2: number) => {
  const totalInnings = ip + ip2 / 3;
  return totalInnings.toFixed(1);
};

export const formatIPDecimal = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return isNaN(num) ? '0.0' : num.toFixed(1);
};

export default function StatisticsTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No statistics available',
  getRowKey,
  sortField,
  sortOrder = 'asc',
  onSort,
  hideHeader = false,
}: StatisticsTableProps<T>) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="body2" color="text.secondary" align="center">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <ScrollableTable>
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader={!hideHeader}>
          {!hideHeader && (
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={String(column.field)}
                    align={column.align}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      ...(column.primary && {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                      }),
                    }}
                  >
                    {column.sortable !== false && onSort ? (
                      <Tooltip title={column.tooltip || ''}>
                        <TableSortLabel
                          active={sortField === column.field}
                          direction={sortField === column.field ? sortOrder : 'asc'}
                          onClick={() => onSort(column.field)}
                          sx={{
                            '& .MuiTableSortLabel-icon': {
                              color: column.primary ? 'inherit' : undefined,
                            },
                          }}
                        >
                          {column.label}
                        </TableSortLabel>
                      </Tooltip>
                    ) : (
                      <Tooltip title={column.tooltip || ''}>
                        <Typography variant="inherit" component="span">
                          {column.label}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={getRowKey(row, index)}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {columns.map((column) => {
                  const value = row[column.field];
                  const displayValue = column.formatter
                    ? column.formatter(value, row)
                    : String(value ?? '');

                  return (
                    <TableCell
                      key={String(column.field)}
                      align={column.align}
                      sx={{
                        ...(column.primary && {
                          fontWeight: 'bold',
                        }),
                        ...(sortField === column.field && {
                          backgroundColor: 'action.selected',
                        }),
                      }}
                    >
                      {column.field === 'playerName' ? (
                        <Typography variant="body2" fontWeight="medium">
                          {displayValue}
                        </Typography>
                      ) : column.field === 'teamName' ? (
                        <TeamBadges
                          teams={row.teams as string[] | undefined}
                          teamName={displayValue}
                          maxVisible={3}
                        />
                      ) : (
                        displayValue
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ScrollableTable>
  );
}
