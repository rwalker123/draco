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
import type { PlayerBattingStatsType } from '@draco/shared-schemas';

import { formatStatDecimal } from './utils';
import {
  BATTING_COLUMN_DECIMAL_DIGITS,
  BATTING_FIELD_LABELS,
  BATTING_FIELD_TOOLTIPS,
  type BattingViewField,
} from './battingColumns';
import { useSortableRows } from './tableUtils';
import RightAlignedTableSortLabel from './RightAlignedTableSortLabel';

interface SeasonBattingStatsSectionProps {
  stats: PlayerBattingStatsType[] | null;
}

type BattingColumn = {
  key: keyof PlayerBattingStatsType | 'ops';
  label: string;
  tooltip: string;
  align: 'left' | 'center' | 'right';
  digits?: number;
};

const seasonColumnKeys = [
  'playerName',
  'ab',
  'h',
  'r',
  'd',
  't',
  'hr',
  'rbi',
  'bb',
  'so',
  'hbp',
  'sb',
  'sf',
  'sh',
  'tb',
  'pa',
  'avg',
  'obp',
  'slg',
  'ops',
] as const;

const columns: BattingColumn[] = seasonColumnKeys.map((key) => {
  const field = key as BattingViewField;
  const label = BATTING_FIELD_LABELS[field] ?? String(key).toUpperCase();
  const tooltip = BATTING_FIELD_TOOLTIPS[field] ?? label;
  const align: BattingColumn['align'] = key === 'playerName' ? 'left' : 'center';
  const digits = BATTING_COLUMN_DECIMAL_DIGITS[field];

  return {
    key,
    label,
    tooltip,
    align,
    digits,
  };
});

const getColumnValue = (
  stat: PlayerBattingStatsType,
  key: BattingColumn['key'],
): number | string | null | undefined => {
  if (key === 'playerName') {
    return stat.playerName;
  }

  if (key === 'ops') {
    return stat.ops;
  }

  return stat[key as keyof PlayerBattingStatsType] as number | string | null | undefined;
};

const SeasonBattingStatsSection: React.FC<SeasonBattingStatsSectionProps> = ({ stats }) => {
  const getValue = useCallback(
    (row: PlayerBattingStatsType, key: BattingColumn['key']) => getColumnValue(row, key),
    [],
  );

  const { sortedRows, sortConfig, handleSort } = useSortableRows(stats ?? [], getValue);

  const totals = useMemo(() => {
    if (!stats || stats.length === 0) {
      return null;
    }

    const aggregate = stats.reduce(
      (acc, current) => {
        acc.ab += current.ab;
        acc.h += current.h;
        acc.r += current.r;
        acc.d += current.d;
        acc.t += current.t;
        acc.hr += current.hr;
        acc.rbi += current.rbi;
        acc.bb += current.bb;
        acc.so += current.so;
        acc.hbp += current.hbp;
        acc.sb += current.sb;
        acc.sf += current.sf;
        acc.sh += current.sh;
        acc.tb += current.tb;
        acc.pa += current.pa;
        return acc;
      },
      {
        ab: 0,
        h: 0,
        r: 0,
        d: 0,
        t: 0,
        hr: 0,
        rbi: 0,
        bb: 0,
        so: 0,
        hbp: 0,
        sb: 0,
        sf: 0,
        sh: 0,
        tb: 0,
        pa: 0,
      },
    );

    const avg = aggregate.ab > 0 ? aggregate.h / aggregate.ab : null;
    const obpDenominator = aggregate.ab + aggregate.bb + aggregate.hbp + aggregate.sf;
    const obp =
      obpDenominator > 0 ? (aggregate.h + aggregate.bb + aggregate.hbp) / obpDenominator : null;
    const slg = aggregate.ab > 0 ? aggregate.tb / aggregate.ab : null;
    const ops = obp !== null && slg !== null ? obp + slg : null;

    return {
      ...aggregate,
      avg,
      obp,
      slg,
      ops,
    };
  }, [stats]);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Season Batting Totals
      </Typography>

      {!stats || stats.length === 0 ? (
        <Alert severity="info">No batting statistics have been recorded for this season yet.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader aria-label="Season batting statistics table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    sortDirection={sortConfig?.key === column.key ? sortConfig.direction : false}
                  >
                    <Tooltip title={column.tooltip} enterTouchDelay={0} placement="top">
                      <Box component="span">
                        <RightAlignedTableSortLabel
                          active={sortConfig?.key === column.key}
                          direction={sortConfig?.key === column.key ? sortConfig.direction : 'asc'}
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                        </RightAlignedTableSortLabel>
                      </Box>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map((stat) => (
                <TableRow key={stat.playerId} hover>
                  {columns.map((column) => {
                    if (column.key === 'playerName') {
                      return (
                        <TableCell key={column.key} align="left">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {stat.playerName}
                          </Typography>
                        </TableCell>
                      );
                    }

                    const rawValue = getColumnValue(stat, column.key);
                    const digits = column.digits;
                    const displayValue =
                      digits !== undefined
                        ? formatStatDecimal(rawValue ?? null, digits)
                        : (rawValue ?? '-');

                    return (
                      <TableCell key={column.key} align={column.align}>
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              {totals && (
                <TableRow>
                  <TableCell align="left">
                    <Chip label="Totals" color="primary" size="small" />
                  </TableCell>
                  {columns
                    .filter((column) => column.key !== 'playerName')
                    .map((column) => {
                      const value = totals[column.key as keyof typeof totals];
                      const digits = column.digits;
                      const displayValue =
                        digits !== undefined
                          ? formatStatDecimal(value as number | string | null | undefined, digits)
                          : (value ?? '-');

                      return (
                        <TableCell key={column.key} align={column.align} sx={{ fontWeight: 700 }}>
                          {displayValue}
                        </TableCell>
                      );
                    })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SeasonBattingStatsSection;
