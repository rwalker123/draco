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
                <TableCell key={header.key} align={header.align}>
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stats?.stats.map((stat) => (
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
