'use client';

import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { GameBattingStatLineType, GameBattingStatsType } from '@draco/shared-schemas';

import {
  BATTING_FIELD_LABELS,
  BATTING_FIELD_TOOLTIPS,
  BATTING_COLUMN_DECIMAL_DIGITS,
  battingViewFieldOrder,
  type BattingViewField,
} from './battingColumns';
import { formatStatDecimal } from './utils';
import { useSortableRows } from './tableUtils';
import RightAlignedTableSortLabel from './RightAlignedTableSortLabel';

interface BattingStatsViewTableProps {
  stats: GameBattingStatsType | null;
  totals: GameBattingStatsType['totals'] | null;
}

const BattingStatsViewTable: React.FC<BattingStatsViewTableProps> = ({ stats, totals }) => {
  const hasStats = Boolean(stats && stats.stats.length > 0);

  const headers = useMemo(
    () =>
      battingViewFieldOrder.map((key) => ({
        key,
        label: BATTING_FIELD_LABELS[key],
        tooltip: BATTING_FIELD_TOOLTIPS[key],
        align: key === 'playerName' ? ('left' as const) : ('center' as const),
      })),
    [],
  );

  const getValue = useCallback(
    (row: GameBattingStatLineType, field: BattingViewField) =>
      row[field as keyof GameBattingStatLineType],
    [],
  );

  const { sortedRows, sortConfig, handleSort } = useSortableRows(stats?.stats ?? [], getValue);

  const formatValue = useCallback(
    (value: number | string | null | undefined, field: BattingViewField) => {
      const digits = BATTING_COLUMN_DECIMAL_DIGITS[field];
      if (digits !== undefined) {
        return formatStatDecimal(value, digits);
      }

      return value ?? '-';
    },
    [],
  );

  return (
    <Box>
      {!hasStats && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No batting stats have been recorded for this game yet.
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader aria-label="Batting statistics table">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.key}
                  align={header.align}
                  sortDirection={sortConfig?.key === header.key ? sortConfig.direction : false}
                >
                  <Tooltip title={header.tooltip} enterTouchDelay={0} placement="top">
                    <Box component="span">
                      <RightAlignedTableSortLabel
                        active={sortConfig?.key === header.key}
                        direction={sortConfig?.key === header.key ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort(header.key)}
                      >
                        {header.label}
                      </RightAlignedTableSortLabel>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((stat) => (
              <TableRow key={stat.statId} hover>
                {headers.map((header) => {
                  if (header.key === 'playerNumber') {
                    const value = stat.playerNumber;
                    return (
                      <TableCell key={header.key} align="center">
                        {value === null || value === undefined ? null : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {value}
                          </Typography>
                        )}
                      </TableCell>
                    );
                  }

                  if (header.key === 'playerName') {
                    return (
                      <TableCell key={header.key} align="left">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stat.playerName}
                        </Typography>
                      </TableCell>
                    );
                  }

                  const value = stat[header.key as keyof GameBattingStatLineType];
                  return (
                    <TableCell key={header.key} align="center">
                      {formatValue(value, header.key)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            {totals && (
              <TableRow>
                {headers.map((header) => {
                  if (header.key === 'playerNumber') {
                    return <TableCell key={header.key} />;
                  }

                  if (header.key === 'playerName') {
                    return (
                      <TableCell key={header.key} align="left">
                        <Chip label="Totals" color="primary" size="small" />
                      </TableCell>
                    );
                  }

                  const value = totals[header.key as keyof typeof totals];
                  return (
                    <TableCell key={header.key} align="center" sx={{ fontWeight: 700 }}>
                      {formatValue(value, header.key)}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BattingStatsViewTable;
