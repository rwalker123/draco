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
import type { PlayerPitchingStatsType } from '@draco/shared-schemas';

import { formatStatDecimal } from './utils';
import {
  PITCHING_COLUMN_DECIMAL_DIGITS,
  PITCHING_FIELD_LABELS,
  PITCHING_FIELD_TOOLTIPS,
  type PitchingViewField,
} from './pitchingColumns';
import { useSortableRows } from './tableUtils';
import RightAlignedTableSortLabel from './RightAlignedTableSortLabel';

const seasonColumnKeys = [
  'playerName',
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
] as const;

type SeasonPitchingColumnKey = (typeof seasonColumnKeys)[number];

interface SeasonPitchingStatsSectionProps {
  stats: PlayerPitchingStatsType[] | null;
}

type PitchingColumn = {
  key: SeasonPitchingColumnKey;
  label: string;
  tooltip: string;
  align: 'left' | 'center' | 'right';
  digits?: number;
};

const columnDigits: Partial<Record<SeasonPitchingColumnKey, number>> = {
  ipDecimal: 1,
  era: 2,
  whip: 2,
  k9: 2,
  bb9: 2,
};

const columns: PitchingColumn[] = seasonColumnKeys.map((key) => {
  const field = key as PitchingViewField;
  const label = PITCHING_FIELD_LABELS[field] ?? String(key).toUpperCase();
  const tooltip = PITCHING_FIELD_TOOLTIPS[field] ?? label;
  const align: PitchingColumn['align'] = key === 'playerName' ? 'left' : 'center';
  const digits = columnDigits[key] ?? PITCHING_COLUMN_DECIMAL_DIGITS[field];

  return {
    key,
    label,
    tooltip,
    align,
    digits,
  };
});

const getColumnValue = (
  stat: PlayerPitchingStatsType,
  key: PitchingColumn['key'],
): number | string | null | undefined => {
  if (key === 'playerName') {
    return stat.playerName;
  }

  if (key === 'ipDecimal') {
    return stat.ipDecimal;
  }

  return stat[key] as number | string | null | undefined;
};

const formatBaseballInnings = (ip: number, ip2: number): string => {
  if (!Number.isFinite(ip) || !Number.isFinite(ip2)) {
    return '-';
  }

  const totalOuts = Math.round(ip * 3 + ip2);
  const innings = Math.floor(totalOuts / 3);
  const remainingOuts = totalOuts % 3;

  return `${innings}.${remainingOuts}`;
};

const SeasonPitchingStatsSection: React.FC<SeasonPitchingStatsSectionProps> = ({ stats }) => {
  const getValue = useCallback(
    (row: PlayerPitchingStatsType, key: PitchingColumn['key']) => getColumnValue(row, key),
    [],
  );

  const { sortedRows, sortConfig, handleSort } = useSortableRows(stats ?? [], getValue);

  const totals = useMemo(() => {
    if (!stats || stats.length === 0) {
      return null;
    }

    const aggregate = stats.reduce(
      (acc, current) => {
        acc.w += current.w;
        acc.l += current.l;
        acc.s += current.s;
        acc.ip += current.ip;
        acc.ip2 += current.ip2;
        acc.ipDecimal += current.ipDecimal;
        acc.h += current.h;
        acc.r += current.r;
        acc.er += current.er;
        acc.bb += current.bb;
        acc.so += current.so;
        acc.hr += current.hr;
        return acc;
      },
      {
        w: 0,
        l: 0,
        s: 0,
        ip: 0,
        ip2: 0,
        ipDecimal: 0,
        h: 0,
        r: 0,
        er: 0,
        bb: 0,
        so: 0,
        hr: 0,
      },
    );

    const innings = aggregate.ipDecimal;
    const era = innings > 0 ? (aggregate.er * 9) / innings : null;
    const whip = innings > 0 ? (aggregate.bb + aggregate.h) / innings : null;
    const k9 = innings > 0 ? (aggregate.so * 9) / innings : null;
    const bb9 = innings > 0 ? (aggregate.bb * 9) / innings : null;

    return {
      ...aggregate,
      era,
      whip,
      k9,
      bb9,
    };
  }, [stats]);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Season Pitching Totals
      </Typography>

      {!stats || stats.length === 0 ? (
        <Alert severity="info">
          No pitching statistics have been recorded for this season yet.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader aria-label="Season pitching statistics table">
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

                    if (column.key === 'ipDecimal') {
                      return (
                        <TableCell key={column.key} align={column.align}>
                          {formatBaseballInnings(stat.ip, stat.ip2)}
                        </TableCell>
                      );
                    }

                    const rawValue = getColumnValue(stat, column.key);
                    const digits = column.digits;

                    return (
                      <TableCell key={column.key} align={column.align}>
                        {digits !== undefined
                          ? formatStatDecimal(
                              rawValue as number | string | null | undefined,
                              digits,
                            )
                          : (rawValue ?? '-')}
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
                      if (column.key === 'ipDecimal') {
                        return (
                          <TableCell key={column.key} align={column.align} sx={{ fontWeight: 700 }}>
                            {formatBaseballInnings(totals.ip, totals.ip2)}
                          </TableCell>
                        );
                      }

                      const value = totals[column.key as keyof typeof totals];
                      const digits = column.digits;

                      return (
                        <TableCell key={column.key} align={column.align} sx={{ fontWeight: 700 }}>
                          {digits !== undefined
                            ? formatStatDecimal(value as number | string | null | undefined, digits)
                            : (value ?? '-')}
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

export default SeasonPitchingStatsSection;
