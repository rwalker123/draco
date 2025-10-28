'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import type {
  GamePitchingStatLineType,
  GamePitchingStatsType,
  TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import { formatInnings, formatStatDecimal } from './utils';

const PitchingStatHeaders: { key: keyof GamePitchingStatLineType | 'playerName'; label: string }[] =
  [
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

interface PitchingStatsSectionProps {
  canManage: boolean;
  stats: GamePitchingStatsType | null;
  totals: GamePitchingStatsType['totals'] | null;
  availablePlayers: TeamStatsPlayerSummaryType[];
  onAdd: () => void;
  onEdit: (stat: GamePitchingStatLineType) => void;
  onDelete: (stat: GamePitchingStatLineType) => void;
}

const PitchingStatsSection: React.FC<PitchingStatsSectionProps> = ({
  canManage,
  stats,
  totals,
  availablePlayers,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const addDisabled = availablePlayers.length === 0;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Pitching Box Score
        </Typography>
        {canManage && (
          <Tooltip title={addDisabled ? 'All players already have pitching lines' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onAdd}
                disabled={addDisabled}
              >
                Add Pitcher
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      {stats && stats.stats.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No pitching stats have been recorded for this game yet.
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader aria-label="Pitching statistics table">
          <TableHead>
            <TableRow>
              {PitchingStatHeaders.map((header) => (
                <TableCell key={header.key} align={header.key === 'playerName' ? 'left' : 'center'}>
                  {header.label}
                </TableCell>
              ))}
              {canManage && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {stats?.stats.map((stat) => (
              <TableRow key={stat.statId} hover>
                <TableCell>
                  <Stack spacing={0.5}>
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
                {PitchingStatHeaders.filter((header) => header.key !== 'playerName').map(
                  (header) => {
                    const value = stat[header.key as keyof GamePitchingStatLineType];
                    const decimalKeys = ['era', 'whip', 'k9', 'bb9'];
                    const ratioKeys = ['oba', 'slg'];

                    if (header.key === 'ipDecimal') {
                      return (
                        <TableCell key={header.key} align="center">
                          {formatInnings(stat.ipDecimal)}
                        </TableCell>
                      );
                    }

                    if (decimalKeys.includes(header.key)) {
                      return (
                        <TableCell key={header.key} align="center">
                          {formatStatDecimal(value as number | null | undefined, 2)}
                        </TableCell>
                      );
                    }

                    if (ratioKeys.includes(header.key)) {
                      return (
                        <TableCell key={header.key} align="center">
                          {formatStatDecimal(value as number | null | undefined)}
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={header.key} align="center">
                        {value}
                      </TableCell>
                    );
                  },
                )}
                {canManage && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit pitching stat">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onEdit(stat)}
                            aria-label="Edit pitching stat"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete pitching stat">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(stat)}
                            aria-label="Delete pitching stat"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {totals && (
              <TableRow>
                <TableCell>
                  <Chip label="Totals" color="primary" size="small" />
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatInnings(totals.ipDecimal)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.w}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.l}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.s}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.h}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.r}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.er}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.d}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.t}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.hr}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.so}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.bb}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.bf}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.wp}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.hbp}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.bk}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.sc}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.era, 2)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.whip, 2)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.k9, 2)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.bb9, 2)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.oba)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.slg)}
                </TableCell>
                {canManage && <TableCell />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PitchingStatsSection;
