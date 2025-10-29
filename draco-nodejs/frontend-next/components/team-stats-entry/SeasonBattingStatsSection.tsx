'use client';

import React, { useMemo } from 'react';
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
import type { PlayerBattingStatsType } from '@draco/shared-schemas';

import { formatStatDecimal } from './utils';

interface SeasonBattingStatsSectionProps {
  stats: PlayerBattingStatsType[] | null;
}

type BattingColumn = {
  key: keyof PlayerBattingStatsType | 'ops';
  label: string;
  align?: 'left' | 'center' | 'right';
  digits?: number;
};

const columns: BattingColumn[] = [
  { key: 'playerName', label: 'Player', align: 'left' },
  { key: 'ab', label: 'AB' },
  { key: 'h', label: 'H' },
  { key: 'r', label: 'R' },
  { key: 'd', label: '2B' },
  { key: 't', label: '3B' },
  { key: 'hr', label: 'HR' },
  { key: 'rbi', label: 'RBI' },
  { key: 'bb', label: 'BB' },
  { key: 'so', label: 'SO' },
  { key: 'hbp', label: 'HBP' },
  { key: 'sb', label: 'SB' },
  { key: 'sf', label: 'SF' },
  { key: 'sh', label: 'SH' },
  { key: 'tb', label: 'TB' },
  { key: 'pa', label: 'PA' },
  { key: 'avg', label: 'AVG', digits: 3 },
  { key: 'obp', label: 'OBP', digits: 3 },
  { key: 'slg', label: 'SLG', digits: 3 },
  { key: 'ops', label: 'OPS', digits: 3 },
];

const SeasonBattingStatsSection: React.FC<SeasonBattingStatsSectionProps> = ({ stats }) => {
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
                    align={column.align ?? (column.key === 'playerName' ? 'left' : 'center')}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((stat) => (
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

                    const rawValue =
                      column.key === 'ops'
                        ? stat.obp + stat.slg
                        : (stat[column.key as keyof PlayerBattingStatsType] as
                            | number
                            | null
                            | undefined);

                    const digits = column.digits ?? 0;
                    const displayValue = column.digits
                      ? formatStatDecimal(rawValue ?? null, digits)
                      : (rawValue ?? 0);

                    return (
                      <TableCell key={column.key} align={column.align ?? 'center'}>
                        {column.digits ? displayValue : rawValue}
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

export default SeasonBattingStatsSection;
