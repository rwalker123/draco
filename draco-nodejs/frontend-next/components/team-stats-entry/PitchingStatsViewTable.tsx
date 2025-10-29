'use client';

import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { GamePitchingStatLineType, GamePitchingStatsType } from '@draco/shared-schemas';

import { formatInnings, formatStatDecimal } from './utils';

const headers: { key: keyof GamePitchingStatLineType | 'playerName'; label: string }[] = [
  { key: 'playerName', label: 'Player' },
  { key: 'ipDecimal', label: 'IP' },
  { key: 'w', label: 'W' },
  { key: 'l', label: 'L' },
  { key: 's', label: 'S' },
  { key: 'h', label: 'H' },
  { key: 'r', label: 'R' },
  { key: 'er', label: 'ER' },
  { key: 'd', label: '2B' },
  { key: 't', label: '3B' },
  { key: 'hr', label: 'HR' },
  { key: 'so', label: 'SO' },
  { key: 'bb', label: 'BB' },
  { key: 'bf', label: 'BF' },
  { key: 'wp', label: 'WP' },
  { key: 'hbp', label: 'HBP' },
  { key: 'bk', label: 'BK' },
  { key: 'sc', label: 'SC' },
  { key: 'era', label: 'ERA' },
  { key: 'whip', label: 'WHIP' },
  { key: 'k9', label: 'K/9' },
  { key: 'bb9', label: 'BB/9' },
  { key: 'oba', label: 'OBA' },
  { key: 'slg', label: 'SLG' },
];

interface PitchingStatsViewTableProps {
  stats: GamePitchingStatsType | null;
  totals: GamePitchingStatsType['totals'] | null;
}

const PitchingStatsViewTable: React.FC<PitchingStatsViewTableProps> = ({ stats, totals }) => {
  const hasStats = Boolean(stats && stats.stats.length > 0);

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
                <TableCell key={header.key} align={header.key === 'playerName' ? 'left' : 'center'}>
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stats?.stats.map((stat) => (
              <TableRow key={stat.statId} hover>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {stat.playerName}
                    </Typography>
                    {stat.playerNumber !== null && (
                      <Typography variant="caption" color="text.secondary">
                        #{stat.playerNumber}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                {headers
                  .filter((header) => header.key !== 'playerName')
                  .map((header) => {
                    const value = stat[header.key as keyof GamePitchingStatLineType];
                    const isDecimal = ['era', 'whip', 'k9', 'bb9', 'oba', 'slg'].includes(
                      header.key,
                    );

                    if (header.key === 'ipDecimal') {
                      return (
                        <TableCell key={header.key} align="center">
                          {formatInnings(Number(value ?? 0))}
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={header.key} align="center">
                        {isDecimal
                          ? formatStatDecimal(
                              value as number | null | undefined,
                              header.key === 'oba' || header.key === 'slg' ? 3 : 2,
                            )
                          : value}
                      </TableCell>
                    );
                  })}
              </TableRow>
            ))}

            {totals && (
              <TableRow>
                <TableCell>
                  <Chip label="Totals" color="primary" size="small" />
                </TableCell>
                {headers
                  .filter((header) => header.key !== 'playerName')
                  .map((header) => {
                    const value = totals[header.key as keyof typeof totals];

                    if (header.key === 'ipDecimal') {
                      return (
                        <TableCell key={header.key} align="center" sx={{ fontWeight: 700 }}>
                          {formatInnings(Number(value ?? 0))}
                        </TableCell>
                      );
                    }

                    const isDecimal = ['era', 'whip', 'k9', 'bb9', 'oba', 'slg'].includes(
                      header.key,
                    );
                    return (
                      <TableCell key={header.key} align="center" sx={{ fontWeight: 700 }}>
                        {isDecimal
                          ? formatStatDecimal(
                              value as number | null | undefined,
                              header.key === 'oba' || header.key === 'slg' ? 3 : 2,
                            )
                          : value}
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
