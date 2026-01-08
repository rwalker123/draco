'use client';

import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';

interface PlayerScore {
  playerName: string;
  holeScores: number[];
  totalScore: number;
  handicapIndex?: number | null;
  courseHandicap?: number;
  differential?: number;
}

interface ScorecardTableProps {
  pars: number[];
  handicaps: number[];
  distances?: number[];
  playerScores: PlayerScore[];
  holesPlayed: 9 | 18;
  startIndex?: number;
  emptyMessage?: string;
}

const sumArray = (arr: number[], start: number, count: number): number => {
  return arr.slice(start, start + count).reduce((acc, val) => acc + val, 0);
};

const getScoreColor = (score: number, par: number): string | undefined => {
  const diff = score - par;
  if (diff <= -2) return '#ffd700';
  if (diff === -1) return '#90ee90';
  if (diff === 0) return undefined;
  if (diff === 1) return '#ffb6c1';
  return '#ff6b6b';
};

export default function ScorecardTable({
  pars,
  handicaps,
  distances,
  playerScores,
  holesPlayed,
  startIndex = 0,
  emptyMessage,
}: ScorecardTableProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const holes = Array.from({ length: holesPlayed }, (_, i) => i + 1);
  const frontNine = holes.filter((h) => h <= 9);
  const backNine = holes.filter((h) => h > 9);
  const hasFrontNine = holesPlayed === 18 || startIndex === 0;
  const hasBackNine = holesPlayed === 18 || startIndex === 9;

  const headerCellSx = {
    fontWeight: 700,
    fontSize: '0.7rem',
    padding: '4px 6px',
    textAlign: 'center' as const,
    backgroundColor: isDark ? 'grey.800' : 'grey.100',
    borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
  };

  const cellSx = {
    fontSize: '0.75rem',
    padding: '4px 6px',
    textAlign: 'center' as const,
    borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
  };

  const labelCellSx = {
    ...cellSx,
    fontWeight: 600,
    backgroundColor: isDark ? 'grey.900' : 'grey.50',
    textAlign: 'left' as const,
    minWidth: 80,
  };

  const totalCellSx = {
    ...cellSx,
    fontWeight: 700,
    backgroundColor: isDark ? 'grey.800' : 'grey.200',
  };

  const parCellSx = {
    ...cellSx,
    backgroundColor: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.2)',
    fontWeight: 600,
  };

  const hdcpCellSx = {
    ...cellSx,
    backgroundColor: isDark ? 'rgba(100, 149, 237, 0.15)' : 'rgba(100, 149, 237, 0.2)',
  };

  const renderScoreCell = (score: number, par: number, idx: number) => {
    const bgColor = getScoreColor(score, par);
    return (
      <TableCell
        key={idx}
        sx={{
          ...cellSx,
          backgroundColor: bgColor ? (isDark ? `${bgColor}40` : `${bgColor}80`) : undefined,
          fontWeight: bgColor ? 600 : 400,
        }}
      >
        {score}
      </TableCell>
    );
  };

  const renderHoleHeaders = (holeNumbers: number[]) => (
    <>
      {holeNumbers.map((hole) => (
        <TableCell key={hole} sx={headerCellSx}>
          {hole}
        </TableCell>
      ))}
      <TableCell sx={{ ...headerCellSx, minWidth: 36 }}>
        {holeNumbers[0] <= 9 ? 'OUT' : 'IN'}
      </TableCell>
    </>
  );

  const renderParRow = (holeNumbers: number[]) => {
    const startIdx = holeNumbers[0] - 1;
    const relevantPars = pars.slice(startIdx, startIdx + holeNumbers.length);
    const parTotal = sumArray(pars, startIdx, holeNumbers.length);
    return (
      <>
        {relevantPars.map((par, idx) => (
          <TableCell key={idx} sx={parCellSx}>
            {par}
          </TableCell>
        ))}
        <TableCell sx={{ ...parCellSx, fontWeight: 700 }}>{parTotal}</TableCell>
      </>
    );
  };

  const renderHandicapRow = (holeNumbers: number[]) => {
    const startIdx = holeNumbers[0] - 1;
    const relevantHandicaps = handicaps.slice(startIdx, startIdx + holeNumbers.length);
    return (
      <>
        {relevantHandicaps.map((hdcp, idx) => (
          <TableCell key={idx} sx={hdcpCellSx}>
            {hdcp}
          </TableCell>
        ))}
        <TableCell sx={hdcpCellSx} />
      </>
    );
  };

  const renderDistanceRow = (holeNumbers: number[]) => {
    if (!distances) return null;
    const startIdx = holeNumbers[0] - 1;
    const relevantDistances = distances.slice(startIdx, startIdx + holeNumbers.length);
    const distanceTotal = sumArray(distances, startIdx, holeNumbers.length);
    return (
      <>
        {relevantDistances.map((dist, idx) => (
          <TableCell key={idx} sx={cellSx}>
            {dist}
          </TableCell>
        ))}
        <TableCell sx={totalCellSx}>{distanceTotal}</TableCell>
      </>
    );
  };

  const renderPlayerScoreRow = (player: PlayerScore, holeNumbers: number[]) => {
    const startIdx = holeNumbers[0] - 1;
    const relevantScores = player.holeScores.slice(startIdx, startIdx + holeNumbers.length);
    const relevantPars = pars.slice(startIdx, startIdx + holeNumbers.length);
    const scoreTotal = sumArray(player.holeScores, startIdx, holeNumbers.length);
    return (
      <>
        {relevantScores.map((score, idx) => renderScoreCell(score, relevantPars[idx], idx))}
        <TableCell sx={totalCellSx}>{scoreTotal}</TableCell>
      </>
    );
  };

  return (
    <TableContainer component={Box} sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 600, borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headerCellSx, textAlign: 'left', minWidth: 80 }}>HOLE</TableCell>
            {hasFrontNine && renderHoleHeaders(frontNine)}
            {hasBackNine && renderHoleHeaders(backNine)}
            {holesPlayed === 18 && (
              <TableCell sx={{ ...headerCellSx, minWidth: 36 }}>TOT</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {distances && (
            <TableRow>
              <TableCell sx={labelCellSx}>YARDS</TableCell>
              {hasFrontNine && renderDistanceRow(frontNine)}
              {hasBackNine && renderDistanceRow(backNine)}
              {holesPlayed === 18 && (
                <TableCell sx={totalCellSx}>{sumArray(distances, 0, 18)}</TableCell>
              )}
            </TableRow>
          )}
          <TableRow>
            <TableCell sx={labelCellSx}>PAR</TableCell>
            {hasFrontNine && renderParRow(frontNine)}
            {hasBackNine && renderParRow(backNine)}
            {holesPlayed === 18 && (
              <TableCell sx={{ ...parCellSx, fontWeight: 700 }}>{sumArray(pars, 0, 18)}</TableCell>
            )}
          </TableRow>
          <TableRow>
            <TableCell sx={labelCellSx}>HDCP</TableCell>
            {hasFrontNine && renderHandicapRow(frontNine)}
            {hasBackNine && renderHandicapRow(backNine)}
            {holesPlayed === 18 && <TableCell sx={hdcpCellSx} />}
          </TableRow>
          {playerScores.length === 0 && emptyMessage && (
            <TableRow>
              <TableCell colSpan={holesPlayed === 18 ? 22 : 11} sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {playerScores.map((player, idx) => (
            <TableRow key={idx}>
              <TableCell sx={labelCellSx}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {player.playerName}
                  </Typography>
                  {(player.courseHandicap !== undefined || player.differential !== undefined) && (
                    <Typography variant="caption" color="text.secondary">
                      {player.courseHandicap !== undefined && `CH: ${player.courseHandicap}`}
                      {player.courseHandicap !== undefined &&
                        player.differential !== undefined &&
                        '  '}
                      {player.differential !== undefined &&
                        `Diff: ${player.differential.toFixed(1)}`}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              {hasFrontNine && renderPlayerScoreRow(player, frontNine)}
              {hasBackNine && renderPlayerScoreRow(player, backNine)}
              {holesPlayed === 18 && <TableCell sx={totalCellSx}>{player.totalScore}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
