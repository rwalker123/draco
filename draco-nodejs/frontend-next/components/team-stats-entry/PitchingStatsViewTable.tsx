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
import type { GamePitchingStatLineType, GamePitchingStatsType } from '@draco/shared-schemas';

import {
  PITCHING_FIELD_LABELS,
  pitchingSummaryFields,
  pitchingViewFieldOrder,
  type PitchingViewField,
} from './pitchingColumns';
import { formatInnings, formatStatDecimal } from './utils';

interface PitchingStatsViewTableProps {
  stats: GamePitchingStatsType | null;
  totals: GamePitchingStatsType['totals'] | null;
}

const decimalDigits: Partial<Record<PitchingViewField, number>> = {
  era: 2,
  whip: 2,
  k9: 2,
  bb9: 2,
  oba: 3,
  slg: 3,
};

const inningsFields: PitchingViewField[] = ['ipDecimal'];

type SortDirection = 'asc' | 'desc';

type PitchingSortConfig = {
  field: PitchingViewField;
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

const PitchingStatsViewTable: React.FC<PitchingStatsViewTableProps> = ({ stats, totals }) => {
  const hasStats = Boolean(stats && stats.stats.length > 0);

  const headers = useMemo(
    () =>
      pitchingViewFieldOrder.map((key) => ({
        key,
        label: PITCHING_FIELD_LABELS[key],
        align: key === 'playerName' ? ('left' as const) : ('center' as const),
      })),
    [],
  );

  const [sortConfig, setSortConfig] = useState<PitchingSortConfig | null>(null);

  const sortedStats = useMemo(() => {
    if (!stats?.stats) {
      return [] as GamePitchingStatLineType[];
    }

    if (!sortConfig) {
      return stats.stats;
    }

    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

    return [...stats.stats].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof GamePitchingStatLineType];
      const bValue = b[sortConfig.field as keyof GamePitchingStatLineType];
      return compareValues(aValue, bValue) * directionMultiplier;
    });
  }, [stats, sortConfig]);

  const handleSort = useCallback((field: PitchingViewField) => {
    setSortConfig((previous) => {
      if (previous?.field === field) {
        const nextDirection: SortDirection = previous.direction === 'asc' ? 'desc' : 'asc';
        return { field, direction: nextDirection };
      }

      return { field, direction: 'asc' };
    });
  }, []);

  const formatValue = useCallback(
    (value: number | string | null | undefined, field: PitchingViewField) => {
      if (inningsFields.includes(field)) {
        return formatInnings(Number(value ?? 0));
      }

      const digits = decimalDigits[field];
      if (digits !== undefined) {
        return formatStatDecimal(value, digits);
      }

      if ((pitchingSummaryFields as readonly string[]).includes(field)) {
        return value ?? '-';
      }

      return value ?? '-';
    },
    [],
  );

  return (
    <Box>
      {!hasStats && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No pitching stats have been recorded for this game yet.
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader aria-label="Pitching statistics table">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.key}
                  align={header.align}
                  sortDirection={sortConfig?.field === header.key ? sortConfig.direction : false}
                >
                  <TableSortLabel
                    active={sortConfig?.field === header.key}
                    direction={sortConfig?.field === header.key ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort(header.key)}
                  >
                    {header.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStats.map((stat) => (
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

                  const value = stat[header.key as keyof GamePitchingStatLineType];
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

export default PitchingStatsViewTable;
