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
  GameBattingStatLineType,
  GameBattingStatsType,
  TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import { formatStatDecimal } from './utils';

const BattingStatHeaders: { key: keyof GameBattingStatLineType | 'playerName'; label: string }[] = [
  { key: 'playerName', label: 'Player' },
  { key: 'ab', label: 'AB' },
  { key: 'h', label: 'H' },
  { key: 'r', label: 'R' },
  { key: 'd', label: '2B' },
  { key: 't', label: '3B' },
  { key: 'hr', label: 'HR' },
  { key: 'rbi', label: 'RBI' },
  { key: 'so', label: 'SO' },
  { key: 'bb', label: 'BB' },
  { key: 'hbp', label: 'HBP' },
  { key: 'sb', label: 'SB' },
  { key: 'cs', label: 'CS' },
  { key: 'sf', label: 'SF' },
  { key: 'sh', label: 'SH' },
  { key: 're', label: 'RE' },
  { key: 'intr', label: 'INTR' },
  { key: 'lob', label: 'LOB' },
  { key: 'tb', label: 'TB' },
  { key: 'pa', label: 'PA' },
  { key: 'avg', label: 'AVG' },
  { key: 'obp', label: 'OBP' },
  { key: 'slg', label: 'SLG' },
  { key: 'ops', label: 'OPS' },
];

interface BattingStatsSectionProps {
  canManage: boolean;
  stats: GameBattingStatsType | null;
  totals: GameBattingStatsType['totals'] | null;
  availablePlayers: TeamStatsPlayerSummaryType[];
  onAdd: () => void;
  onEdit: (stat: GameBattingStatLineType) => void;
  onDelete: (stat: GameBattingStatLineType) => void;
}

const BattingStatsSection: React.FC<BattingStatsSectionProps> = ({
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
          Batting Box Score
        </Typography>
        {canManage && (
          <Tooltip title={addDisabled ? 'All players already have batting lines' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onAdd}
                disabled={addDisabled}
              >
                Add Batter
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>

      {stats && stats.stats.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No batting stats have been recorded for this game yet.
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader aria-label="Batting statistics table">
          <TableHead>
            <TableRow>
              {BattingStatHeaders.map((header) => (
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
                {BattingStatHeaders.filter((header) => header.key !== 'playerName').map(
                  (header) => {
                    const value = stat[header.key as keyof GameBattingStatLineType];
                    const isAvgField = ['avg', 'obp', 'slg', 'ops'].includes(header.key);

                    return (
                      <TableCell key={header.key} align="center">
                        {isAvgField ? formatStatDecimal(value as number | null | undefined) : value}
                      </TableCell>
                    );
                  },
                )}
                {canManage && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(stat)}
                        aria-label="Edit batting stat"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(stat)}
                        aria-label="Delete batting stat"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
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
                  {totals.ab}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.h}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.r}
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
                  {totals.rbi}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.so}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.bb}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.hbp}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.sb}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.cs}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.sf}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.sh}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.re}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.intr}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.lob}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.tb}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {totals.pa}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.avg)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.obp)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.slg)}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {formatStatDecimal(totals.ops)}
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

export default BattingStatsSection;
