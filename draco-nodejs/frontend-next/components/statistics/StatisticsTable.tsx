'use client';

import React, { useCallback, useMemo } from 'react';
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
  alpha,
  Chip,
} from '@mui/material';

import ScrollableTable from './ScrollableTable';
import TeamBadges from './TeamBadges';
import {
  BATTING_FIELD_LABELS,
  BATTING_FIELD_TOOLTIPS,
  BATTING_COLUMN_DECIMAL_DIGITS,
  battingViewFieldOrder,
} from '../team-stats-entry/battingColumns';
import {
  PITCHING_FIELD_LABELS,
  PITCHING_FIELD_TOOLTIPS,
  PITCHING_COLUMN_DECIMAL_DIGITS,
  pitchingViewFieldOrder,
} from '../team-stats-entry/pitchingColumns';

export interface ColumnConfig<T> {
  field: keyof T & string;
  label: string;
  align: 'left' | 'right' | 'center';
  tooltip?: string;
  primary?: boolean;
  sortable?: boolean;
  formatter?: (value: unknown, row: T) => React.ReactNode;
  render?: (args: {
    value: unknown;
    formattedValue: React.ReactNode;
    row: T;
    rowIndex: number;
    column: ColumnConfig<T>;
  }) => React.ReactNode;
}

interface StatisticsTableBaseProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  emptyMessage?: string;
  getRowKey: (item: T, index: number) => string;
  sortField?: keyof T | string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  hideHeader?: boolean;
  maxHeight?: string | number;
}

export const StatisticsTableBase = <T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No statistics available',
  getRowKey,
  sortField,
  sortOrder = 'asc',
  onSort,
  hideHeader = false,
  maxHeight,
}: StatisticsTableBaseProps<T>) => {
  const activeField = sortField !== undefined ? String(sortField) : undefined;
  const dataVersion = `${String(activeField)}-${sortOrder}-${data.length}`;

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

  const normalizeToReactNode = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (React.isValidElement(value)) {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      return Number.isFinite(Number(value)) ? Number(value) : '-';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.length === 0 ? '-' : value.join(', ');
    }
    return String(value);
  };

  return (
    <ScrollableTable preserveScrollOnUpdate dataVersion={dataVersion}>
      <TableContainer
        component={Paper}
        sx={{
          ...(maxHeight
            ? {
                maxHeight,
                overflowY: 'auto',
              }
            : {}),
          '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: 'background.paper',
          },
        }}
      >
        <Table
          size="small"
          stickyHeader={!hideHeader}
          sx={{
            tableLayout: 'auto',
            '& .MuiTableCell-root': {
              py: 0.75,
              px: 1.25,
              fontSize: '0.85rem',
            },
            '& .MuiTableCell-head': {
              fontSize: '0.75rem',
              letterSpacing: 0.4,
            },
          }}
        >
          {!hideHeader && (
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    align={column.align}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: 'background.paper',
                      ...(sortField === column.field && {
                        backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.02),
                      }),
                    }}
                  >
                    {(() => {
                      const justifyContent =
                        column.align === 'right'
                          ? 'flex-end'
                          : column.align === 'center'
                            ? 'center'
                            : 'flex-start';
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
                    })()}
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
                  const formattedValue = column.formatter ? column.formatter(value, row) : value;
                  const normalizedFormattedValue = normalizeToReactNode(formattedValue);
                  const rendered = column.render
                    ? column.render({
                        value,
                        formattedValue: normalizedFormattedValue,
                        row,
                        rowIndex: index,
                        column,
                      })
                    : normalizedFormattedValue;
                  const content = normalizeToReactNode(rendered);

                  return (
                    <TableCell
                      key={column.field}
                      align={column.align}
                      sx={{
                        ...(activeField === column.field && {
                          backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.04),
                        }),
                      }}
                    >
                      {content}
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
};

export const formatBattingAverage = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(num) ? num.toFixed(3) : '0.000';
};

export const formatPercentage = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(num) ? num.toFixed(3) : '0.000';
};

export const formatERA = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
};

export const formatIPDecimal = (value: unknown): string => {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(num) ? num.toFixed(1) : '0.0';
};

export type StatisticsTableVariant = 'batting' | 'pitching';

export type StatsRowBase = {
  playerName?: string | null;
  playerNumber?: number | string | null;
  teamName?: string | null;
  teams?: string[] | null;
  ip?: number | null;
  ip2?: number | null;
  isTotals?: boolean;
  [key: string]: unknown;
};

interface SharedStatisticsTableProps<T extends StatsRowBase> {
  variant: StatisticsTableVariant;
  extendedStats: boolean;
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  getRowKey: (item: T, index: number) => string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  hideHeader?: boolean;
  maxHeight?: string | number;
  prependColumns?: ColumnConfig<T>[];
  omitFields?: string[];
}

const BATTER_COMPACT_FIELDS: ReadonlyArray<string> = [
  'playerName',
  'teamName',
  'ab',
  'h',
  'r',
  'd',
  't',
  'hr',
  'rbi',
  'bb',
  'so',
  'sb',
  'avg',
  'obp',
  'slg',
  'ops',
];

const PITCHER_COMPACT_FIELDS: ReadonlyArray<string> = [
  'playerName',
  'teamName',
  'w',
  'l',
  's',
  'ipDecimal',
  'h',
  'r',
  'er',
  'bb',
  'so',
  'hr',
  'era',
  'whip',
  'k9',
  'bb9',
];

const formatNumber = (value: unknown, digits?: number): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return '-';
  }
  if (digits === undefined) {
    return String(num);
  }
  return num.toFixed(digits);
};

const extractText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (React.isValidElement(value)) {
    return '-';
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractText(item)).join(', ');
  }
  return String(value);
};

const hasTeamInformation = (rows: StatsRowBase[]): boolean =>
  rows.some(
    (row) =>
      !row.isTotals &&
      ((Array.isArray(row.teams) && row.teams.length > 0) ||
        (typeof row.teamName === 'string' && row.teamName.trim() !== '')),
  );

const buildColumns = <T extends StatsRowBase>(
  variant: StatisticsTableVariant,
  extendedStats: boolean,
  rows: T[],
  omitFields: Set<string>,
): ColumnConfig<T>[] => {
  const columns: ColumnConfig<T>[] = [];
  const includeTeamColumn = !extendedStats && hasTeamInformation(rows);

  const pushColumn = (field: string) => {
    const align = field === 'playerName' || field === 'teamName' ? 'left' : 'center';
    let label: string | undefined;
    let tooltip: string | undefined;

    if (variant === 'batting') {
      label = BATTING_FIELD_LABELS[field as keyof typeof BATTING_FIELD_LABELS];
      tooltip = BATTING_FIELD_TOOLTIPS[field as keyof typeof BATTING_FIELD_TOOLTIPS];
    } else {
      label = PITCHING_FIELD_LABELS[field as keyof typeof PITCHING_FIELD_LABELS];
      tooltip = PITCHING_FIELD_TOOLTIPS[field as keyof typeof PITCHING_FIELD_TOOLTIPS];
    }

    if (!label) {
      if (field === 'teamName') {
        label = 'Team';
      } else if (field === 'playerNumber') {
        label = '#';
      } else {
        label = field.toUpperCase();
      }
    }
    if (!tooltip) {
      if (field === 'teamName') {
        tooltip = 'Team';
      } else if (field === 'playerNumber') {
        tooltip = 'Player number';
      } else {
        tooltip = label;
      }
    }

    const digits =
      variant === 'batting'
        ? BATTING_COLUMN_DECIMAL_DIGITS[field as keyof typeof BATTING_COLUMN_DECIMAL_DIGITS]
        : PITCHING_COLUMN_DECIMAL_DIGITS[field as keyof typeof PITCHING_COLUMN_DECIMAL_DIGITS];

    let formatter: ColumnConfig<T>['formatter'];

    if (field === 'ipDecimal') {
      formatter = (rawValue, row) => {
        const ip = typeof row.ip === 'number' && Number.isFinite(row.ip) ? row.ip : null;
        const ip2 = typeof row.ip2 === 'number' && Number.isFinite(row.ip2) ? row.ip2 : null;

        const convertOutsToDisplay = (outs: number) => {
          const normalizedOuts = Math.max(0, Math.round(outs));
          const innings = Math.floor(normalizedOuts / 3);
          const remainingOuts = normalizedOuts % 3;
          return innings + remainingOuts / 10;
        };

        if (ip !== null || ip2 !== null) {
          const totalOuts =
            (ip !== null ? Math.trunc(ip) * 3 : 0) + (ip2 !== null ? Math.trunc(ip2) : 0);
          return formatNumber(convertOutsToDisplay(totalOuts), 1);
        }

        const numericValue =
          typeof rawValue === 'number'
            ? rawValue
            : typeof rawValue === 'string'
              ? Number(rawValue)
              : null;

        if (numericValue !== null && Number.isFinite(numericValue)) {
          const decimalPart = Math.round((numericValue - Math.trunc(numericValue)) * 10);
          if ([0, 1, 2].includes(decimalPart)) {
            return formatNumber(numericValue, 1);
          }

          return formatNumber(convertOutsToDisplay(numericValue * 3), 1);
        }

        return formatNumber(rawValue, 1);
      };
    } else if (digits !== undefined) {
      formatter = (value) => formatNumber(value, digits);
    }

    let render: ColumnConfig<T>['render'];
    if (field === 'playerNumber') {
      render = ({ value, row }) => {
        if (row.isTotals) {
          return null;
        }
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const displayValue =
          typeof value === 'number' || typeof value === 'string' ? value : String(value);
        return (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {displayValue}
          </Typography>
        );
      };
    } else if (field === 'playerName') {
      render = ({ formattedValue, row }) => {
        if (row.isTotals) {
          return <Chip label="Totals" color="primary" size="small" />;
        }
        const text = extractText(formattedValue);
        return (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {text}
          </Typography>
        );
      };
    } else if (field === 'teamName') {
      render = ({ row }) => {
        if (row.isTotals) {
          return '-';
        }
        if (Array.isArray(row.teams) && row.teams.length > 0) {
          return (
            <TeamBadges
              teams={row.teams}
              teamName={row.teamName as string | undefined}
              maxVisible={3}
            />
          );
        }
        if (typeof row.teamName === 'string' && row.teamName.trim() !== '') {
          return row.teamName;
        }
        return '-';
      };
    } else {
      render = ({ formattedValue, row }) => {
        const displayNode = formattedValue;
        if (row.isTotals) {
          const text = extractText(displayNode);
          return (
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {text}
            </Typography>
          );
        }
        return displayNode;
      };
    }

    const columnConfig: ColumnConfig<T> = {
      field: field as keyof T & string,
      label,
      tooltip,
      align,
    };

    if (formatter) {
      columnConfig.formatter = formatter;
    }

    columnConfig.render = render;

    columns.push(columnConfig);
  };

  if (variant === 'batting') {
    const fields = extendedStats ? battingViewFieldOrder : BATTER_COMPACT_FIELDS;
    fields.forEach((field) => {
      if (field === 'teamName' && !includeTeamColumn) {
        return;
      }
      if (omitFields.has(field)) {
        return;
      }
      pushColumn(field);
    });
  } else {
    const fields = extendedStats ? pitchingViewFieldOrder : PITCHER_COMPACT_FIELDS;
    fields.forEach((field) => {
      if (field === 'teamName' && !includeTeamColumn) {
        return;
      }
      if (omitFields.has(field)) {
        return;
      }
      pushColumn(field);
    });
  }

  return columns;
};

const StatisticsTable = <T extends StatsRowBase>({
  variant,
  extendedStats,
  data,
  loading,
  emptyMessage,
  getRowKey,
  sortField,
  sortOrder,
  onSort,
  hideHeader,
  maxHeight,
  prependColumns,
  omitFields,
}: SharedStatisticsTableProps<T>) => {
  const omitSet = useMemo(() => new Set(omitFields ?? []), [omitFields]);
  const columns = useMemo(() => {
    const baseColumns = buildColumns<T>(variant, extendedStats, data, omitSet);
    if (!prependColumns || prependColumns.length === 0) {
      return baseColumns;
    }
    return [...prependColumns, ...baseColumns];
  }, [variant, extendedStats, data, prependColumns, omitSet]);

  const handleInternalSort = useCallback(
    (field: string) => {
      onSort?.(field);
    },
    [onSort],
  );

  return (
    <StatisticsTableBase
      data={data}
      columns={columns}
      loading={loading}
      emptyMessage={emptyMessage}
      getRowKey={getRowKey}
      sortField={sortField}
      sortOrder={sortOrder}
      onSort={handleInternalSort}
      hideHeader={hideHeader}
      maxHeight={maxHeight}
    />
  );
};

export default StatisticsTable;
