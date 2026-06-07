'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { LineScoreSideType, LineScoreType } from '@draco/shared-schemas';

interface LineScoreTableProps {
  lineScore: LineScoreType;
}

const MIN_INNINGS = 7;

export const getInningCount = (lineScore: LineScoreType): number =>
  Math.max(lineScore.home.runsByInning.length, lineScore.away.runsByInning.length, MIN_INNINGS);

const formatTotal = (value: number | null): string =>
  value === null || value === undefined ? '-' : String(value);

const renderInningValue = (value: number | null | undefined): string =>
  value === null || value === undefined ? '-' : String(value);

const LineScoreTable: React.FC<LineScoreTableProps> = ({ lineScore }) => {
  const theme = useTheme();
  const inningCount = getInningCount(lineScore);
  const innings = Array.from({ length: inningCount }, (_, index) => index + 1);
  const homeWon = lineScore.home.runs > lineScore.away.runs;

  const cellForInning = (side: LineScoreSideType, inningIndex: number, isHome: boolean): string => {
    const value = side.runsByInning[inningIndex] ?? null;
    if (value !== null) {
      return String(value);
    }
    if (isHome && homeWon && inningIndex === inningCount - 1) {
      return 'x';
    }
    return renderInningValue(value);
  };

  const renderRow = (side: LineScoreSideType, isHome: boolean) => (
    <TableRow>
      <TableCell
        component="th"
        scope="row"
        sx={{ fontWeight: 600, whiteSpace: 'nowrap', borderRight: 1, borderColor: 'divider' }}
      >
        {side.teamName || (isHome ? 'Home' : 'Away')}
      </TableCell>
      {innings.map((inning, inningIndex) => (
        <TableCell key={inning} align="center" sx={{ px: 1 }}>
          {cellForInning(side, inningIndex, isHome)}
        </TableCell>
      ))}
      <TableCell align="center" sx={{ fontWeight: 700, borderLeft: 1, borderColor: 'divider' }}>
        {formatTotal(side.runs)}
      </TableCell>
      <TableCell align="center" sx={{ fontWeight: 700 }}>
        {formatTotal(side.hits)}
      </TableCell>
      <TableCell align="center" sx={{ fontWeight: 700 }}>
        {formatTotal(side.errors)}
      </TableCell>
    </TableRow>
  );

  return (
    <TableContainer
      sx={{
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: theme.palette.background.paper,
        overflowX: 'auto',
      }}
    >
      <Table size="small" aria-label="Line score">
        <TableHead>
          <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
            <TableCell sx={{ borderRight: 1, borderColor: 'divider' }} />
            {innings.map((inning) => (
              <TableCell key={inning} align="center" sx={{ px: 1, fontWeight: 600 }}>
                {inning}
              </TableCell>
            ))}
            <TableCell
              align="center"
              sx={{ fontWeight: 700, borderLeft: 1, borderColor: 'divider' }}
            >
              R
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              H
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              E
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {renderRow(lineScore.away, false)}
          {renderRow(lineScore.home, true)}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const LineScoreEmptyState: React.FC = () => (
  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
    No line score has been entered for this game.
  </Typography>
);

export default LineScoreTable;
