'use client';

import React, { useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';

interface HoleScoreGridProps {
  holeScores: number[];
  onChange: (holeScores: number[]) => void;
  numberOfHoles: 9 | 18;
  disabled?: boolean;
}

export function HoleScoreGrid({
  holeScores,
  onChange,
  numberOfHoles,
  disabled = false,
}: HoleScoreGridProps) {
  const theme = useTheme();

  const handleScoreChange = (holeIndex: number, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 20) return;

    const updatedScores = [...holeScores];
    while (updatedScores.length <= holeIndex) {
      updatedScores.push(0);
    }
    updatedScores[holeIndex] = numValue;

    onChange(updatedScores);
  };

  const getHoleScore = (holeIndex: number): string => {
    const score = holeScores[holeIndex];
    return score && score > 0 ? String(score) : '';
  };

  const { front9Total, back9Total, totalScore } = useMemo(() => {
    let front9 = 0;
    let back9 = 0;

    holeScores.forEach((score, index) => {
      if (index < 9) {
        front9 += score || 0;
      } else {
        back9 += score || 0;
      }
    });

    return {
      front9Total: front9,
      back9Total: back9,
      totalScore: front9 + back9,
    };
  }, [holeScores]);

  const frontNineHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const backNineHoles = [10, 11, 12, 13, 14, 15, 16, 17, 18];

  const renderHoleRow = (holes: number[], label: string, subtotal: number) => (
    <>
      <TableRow>
        <TableCell
          sx={{
            fontWeight: 'bold',
            backgroundColor: theme.palette.grey[100],
            width: 60,
          }}
        >
          {label}
        </TableCell>
        {holes.map((holeNum) => (
          <TableCell
            key={holeNum}
            align="center"
            sx={{ backgroundColor: theme.palette.grey[100], px: 0.5 }}
          >
            <Typography variant="caption" fontWeight="bold">
              {holeNum}
            </Typography>
          </TableCell>
        ))}
        <TableCell
          align="center"
          sx={{
            fontWeight: 'bold',
            backgroundColor: theme.palette.grey[200],
            width: 50,
          }}
        >
          Out
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ backgroundColor: theme.palette.background.paper }}>Score</TableCell>
        {holes.map((holeNum) => (
          <TableCell key={holeNum} align="center" sx={{ p: 0.5 }}>
            <TextField
              type="number"
              size="small"
              value={getHoleScore(holeNum - 1)}
              onChange={(e) => handleScoreChange(holeNum - 1, e.target.value)}
              disabled={disabled}
              inputProps={{
                min: 1,
                max: 20,
                style: {
                  textAlign: 'center',
                  padding: '4px',
                  width: '32px',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
            />
          </TableCell>
        ))}
        <TableCell
          align="center"
          sx={{
            fontWeight: 'bold',
            backgroundColor: theme.palette.grey[50],
          }}
        >
          {subtotal > 0 ? subtotal : '-'}
        </TableCell>
      </TableRow>
    </>
  );

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow>
            <TableCell colSpan={11} sx={{ p: 0 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {renderHoleRow(frontNineHoles, 'Hole', front9Total)}
          {numberOfHoles === 18 && (
            <>
              <TableRow>
                <TableCell colSpan={11} sx={{ height: 8, p: 0 }} />
              </TableRow>
              {renderHoleRow(backNineHoles, 'Hole', back9Total)}
            </>
          )}
        </TableBody>
      </Table>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mt: 1,
          gap: 2,
        }}
      >
        {numberOfHoles === 18 && (
          <>
            <Typography variant="body2" color="text.secondary">
              Front 9: <strong>{front9Total > 0 ? front9Total : '-'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Back 9: <strong>{back9Total > 0 ? back9Total : '-'}</strong>
            </Typography>
          </>
        )}
        <Typography variant="body2" color="text.primary">
          Total: <strong>{totalScore > 0 ? totalScore : '-'}</strong>
        </Typography>
      </Box>
    </Box>
  );
}

export default HoleScoreGrid;
