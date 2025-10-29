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
import type { GameBattingStatLineType, GameBattingStatsType } from '@draco/shared-schemas';

import {
  BATTING_FIELD_LABELS,
  battingAverageFields,
  battingViewFieldOrder,
  type BattingViewField,
} from './battingColumns';
import { formatStatDecimal } from './utils';

interface BattingStatsViewTableProps {
  stats: GameBattingStatsType | null;
  totals: GameBattingStatsType['totals'] | null;
}

const battingDecimalDigits: Partial<Record<BattingViewField, number>> = {
  avg: 3,
  obp: 3,
  slg: 3,
  ops: 3,
};

const BattingStatsViewTable: React.FC<BattingStatsViewTableProps> = ({ stats, totals }) => {
  const hasStats = Boolean(stats && stats.stats.length > 0);

  const headers = useMemo(
    () =>
      battingViewFieldOrder.map((key) => ({
        key,
        label: BATTING_FIELD_LABELS[key],
        align: key === 'playerName' ? ('left' as const) : ('center' as const),
      })),
    [],
  );

  const formatValue = useCallback(
    (value: number | string | null | undefined, field: BattingViewField) => {
      if ((battingAverageFields as readonly string[]).includes(field)) {
        return formatStatDecimal(value, battingDecimalDigits[field] ?? 3);
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
