'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
  TableSortLabel,
  Typography,
} from '@mui/material';
import type { PlayerPitchingStatsType } from '@draco/shared-schemas';

import { formatStatDecimal } from './utils';

interface SeasonPitchingStatsSectionProps {
  stats: PlayerPitchingStatsType[] | null;
}

type PitchingColumn = {
  key: keyof PlayerPitchingStatsType;
  label: string;
  align?: 'left' | 'center' | 'right';
  digits?: number;
};

const columns: PitchingColumn[] = [
  { key: 'playerName', label: 'Player', align: 'left' },
  { key: 'w', label: 'W' },
  { key: 'l', label: 'L' },
  { key: 's', label: 'S' },
  { key: 'ipDecimal', label: 'IP', digits: 1 },
  { key: 'h', label: 'H' },
  { key: 'r', label: 'R' },
  { key: 'er', label: 'ER' },
  { key: 'bb', label: 'BB' },
  { key: 'so', label: 'SO' },
  { key: 'hr', label: 'HR' },
  { key: 'era', label: 'ERA', digits: 2 },
  { key: 'whip', label: 'WHIP', digits: 2 },
  { key: 'k9', label: 'K/9', digits: 2 },
  { key: 'bb9', label: 'BB/9', digits: 2 },
];

type SortDirection = 'asc' | 'desc';

type PitchingSortConfig = {
  key: PitchingColumn['key'];
  direction: SortDirection;
};

const compareValues = (a: unknown, b: unknown): number => {
  if (a === b) {
    return 0;
  }

  if (a === null || a === undefined) {
    return 1;
  }

  if (b === null || b === undefined) {
    return -1;
  }

  const aNumber = typeof a === 'number' ? a : Number(a);
  const bNumber = typeof b === 'number' ? b : Number(b);
  const aIsNumber = Number.isFinite(aNumber);
  const bIsNumber = Number.isFinite(bNumber);

  if (aIsNumber && bIsNumber) {
    return aNumber - bNumber;
  }

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
};

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

  return stat[key];
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
  const [sortConfig, setSortConfig] = useState<PitchingSortConfig | null>(null);

  const sortedStats = useMemo(() => {
    if (!stats) {
      return [] as PlayerPitchingStatsType[];
    }

    if (!sortConfig) {
      return stats;
    }

    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

    return [...stats].sort((a, b) => {
      const aValue = getColumnValue(a, sortConfig.key);
      const bValue = getColumnValue(b, sortConfig.key);
      return compareValues(aValue, bValue) * directionMultiplier;
    });
  }, [stats, sortConfig]);

  const handleSort = useCallback((key: PitchingColumn['key']) => {
    setSortConfig((previous) => {
      if (previous?.key === key) {
        const nextDirection: SortDirection = previous.direction === 'asc' ? 'desc' : 'asc';
        return { key, direction: nextDirection };
      }

      return { key, direction: 'asc' };
    });
  }, []);

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
                    align={column.align ?? (column.key === 'playerName' ? 'left' : 'center')}
                    sortDirection={sortConfig?.key === column.key ? sortConfig.direction : false}
                  >
                    <TableSortLabel
                      active={sortConfig?.key === column.key}
                      direction={sortConfig?.key === column.key ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStats.map((stat) => (
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
                        <TableCell key={column.key} align={column.align ?? 'center'}>
                          {formatBaseballInnings(stat.ip, stat.ip2)}
                        </TableCell>
                      );
                    }

                    const rawValue = getColumnValue(stat, column.key);
                    const digits = column.digits ?? 0;

                    return (
                      <TableCell key={column.key} align={column.align ?? 'center'}>
                        {column.digits !== undefined
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
                          <TableCell
                            key={column.key}
                            align={column.align ?? 'center'}
                            sx={{ fontWeight: 700 }}
                          >
                            {formatBaseballInnings(totals.ip, totals.ip2)}
                          </TableCell>
                        );
                      }

                      const value = totals[column.key as keyof typeof totals];
                      const digits = column.digits ?? 0;

                      return (
                        <TableCell
                          key={column.key}
                          align={column.align ?? 'center'}
                          sx={{ fontWeight: 700 }}
                        >
                          {column.digits
                            ? formatStatDecimal(value as number | null | undefined, digits)
                            : value}
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
