'use client';

import React from 'react';
import {
  Box,
  Checkbox,
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
  par?: number[];
  handicap?: number[];
  putts?: (number | null)[];
  onPuttsChange?: (putts: (number | null)[]) => void;
  fairways?: (boolean | null)[];
  onFairwaysChange?: (fairways: (boolean | null)[]) => void;
  showPutts?: boolean;
  showFairways?: boolean;
}

export function HoleScoreGrid({
  holeScores,
  onChange,
  numberOfHoles,
  disabled = false,
  par,
  handicap,
  putts,
  onPuttsChange,
  fairways,
  onFairwaysChange,
  showPutts = false,
  showFairways = false,
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

  const handlePuttChange = (holeIndex: number, value: string) => {
    if (!onPuttsChange) return;
    const numValue = value === '' ? null : parseInt(value, 10);
    if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 10)) return;

    const updated = [...(putts ?? Array(18).fill(null))];
    updated[holeIndex] = numValue;
    onPuttsChange(updated);
  };

  const handleFairwayChange = (holeIndex: number, checked: boolean) => {
    if (!onFairwaysChange) return;
    const updated = [...(fairways ?? Array(18).fill(null))];
    updated[holeIndex] = checked;
    onFairwaysChange(updated);
  };

  const getHoleScore = (holeIndex: number): string => {
    const score = holeScores[holeIndex];
    return score && score > 0 ? String(score) : '';
  };

  const getPuttValue = (holeIndex: number): string => {
    const value = putts?.[holeIndex];
    return value !== null && value !== undefined ? String(value) : '';
  };

  const front9Total = holeScores.slice(0, 9).reduce((sum, score) => sum + (score || 0), 0);
  const back9Total = holeScores.slice(9).reduce((sum, score) => sum + (score || 0), 0);
  const totalScore = front9Total + back9Total;

  const front9Par = par ? par.slice(0, 9).reduce((sum, p) => sum + (p || 0), 0) : 0;
  const back9Par = par ? par.slice(9, 18).reduce((sum, p) => sum + (p || 0), 0) : 0;
  const totalPar = front9Par + back9Par;

  const totalPutts = putts
    ? putts.filter((p): p is number => p !== null && p !== undefined).reduce((a, b) => a + b, 0)
    : 0;
  const fairwaysHitCount = fairways ? fairways.filter((f) => f === true).length : 0;
  const fairwaysEligible =
    fairways && par
      ? par.slice(0, numberOfHoles).filter((p, i) => p !== 3 && fairways[i] !== null).length
      : 0;
  const frontNineHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const backNineHoles = [10, 11, 12, 13, 14, 15, 16, 17, 18];

  const smallInputSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
    },
  };

  const renderHoleRow = (holes: number[], label: string, subtotal: number, parSubtotal: number) => (
    <>
      <TableRow>
        <TableCell
          sx={{
            fontWeight: 'bold',
            backgroundColor: theme.palette.action.selected,
            width: 60,
          }}
        >
          {label}
        </TableCell>
        {holes.map((holeNum) => (
          <TableCell
            key={holeNum}
            align="center"
            sx={{ backgroundColor: theme.palette.action.selected, px: 0.5 }}
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
            backgroundColor: theme.palette.action.focus,
            width: 50,
          }}
        >
          {label === 'Hole' && holes[0] === 1 ? 'Out' : 'In'}
        </TableCell>
      </TableRow>

      {par && (
        <TableRow>
          <TableCell sx={{ backgroundColor: theme.palette.action.hover }}>Par</TableCell>
          {holes.map((holeNum) => (
            <TableCell
              key={holeNum}
              align="center"
              sx={{ px: 0.5, backgroundColor: theme.palette.action.hover }}
            >
              <Typography variant="caption">{par[holeNum - 1]}</Typography>
            </TableCell>
          ))}
          <TableCell
            align="center"
            sx={{ fontWeight: 'bold', backgroundColor: theme.palette.action.hover }}
          >
            {parSubtotal}
          </TableCell>
        </TableRow>
      )}

      {handicap && (
        <TableRow>
          <TableCell sx={{ backgroundColor: theme.palette.action.hover }}>Hdcp</TableCell>
          {holes.map((holeNum) => (
            <TableCell
              key={holeNum}
              align="center"
              sx={{ px: 0.5, backgroundColor: theme.palette.action.hover }}
            >
              <Typography variant="caption">{handicap[holeNum - 1]}</Typography>
            </TableCell>
          ))}
          <TableCell />
        </TableRow>
      )}

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
              sx={smallInputSx}
            />
          </TableCell>
        ))}
        <TableCell
          align="center"
          sx={{
            fontWeight: 'bold',
            backgroundColor: theme.palette.action.hover,
          }}
        >
          {subtotal > 0 ? subtotal : '-'}
        </TableCell>
      </TableRow>

      {showPutts && (
        <TableRow>
          <TableCell sx={{ backgroundColor: theme.palette.background.paper }}>
            <Typography variant="caption">Putts</Typography>
          </TableCell>
          {holes.map((holeNum) => (
            <TableCell key={holeNum} align="center" sx={{ p: 0.5 }}>
              <TextField
                type="number"
                size="small"
                value={getPuttValue(holeNum - 1)}
                onChange={(e) => handlePuttChange(holeNum - 1, e.target.value)}
                disabled={disabled}
                inputProps={{
                  min: 0,
                  max: 10,
                  style: {
                    textAlign: 'center',
                    padding: '4px',
                    width: '32px',
                  },
                }}
                sx={smallInputSx}
              />
            </TableCell>
          ))}
          <TableCell align="center" sx={{ backgroundColor: theme.palette.action.hover }}>
            <Typography variant="caption" fontWeight="bold">
              {totalPutts > 0 ? totalPutts : '-'}
            </Typography>
          </TableCell>
        </TableRow>
      )}

      {showFairways && par && (
        <TableRow>
          <TableCell sx={{ backgroundColor: theme.palette.background.paper }}>
            <Typography variant="caption">FW</Typography>
          </TableCell>
          {holes.map((holeNum) => {
            const isPar3 = par[holeNum - 1] === 3;
            return (
              <TableCell key={holeNum} align="center" sx={{ p: 0 }}>
                {isPar3 ? (
                  <Typography variant="caption" color="text.disabled">
                    -
                  </Typography>
                ) : (
                  <Checkbox
                    size="small"
                    checked={fairways?.[holeNum - 1] === true}
                    onChange={(e) => handleFairwayChange(holeNum - 1, e.target.checked)}
                    disabled={disabled}
                    sx={{ p: 0 }}
                  />
                )}
              </TableCell>
            );
          })}
          <TableCell align="center" sx={{ backgroundColor: theme.palette.action.hover }}>
            <Typography variant="caption" fontWeight="bold">
              {fairwaysEligible > 0 ? `${fairwaysHitCount}/${fairwaysEligible}` : '-'}
            </Typography>
          </TableCell>
        </TableRow>
      )}
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
          {renderHoleRow(frontNineHoles, 'Hole', front9Total, front9Par)}
          {numberOfHoles === 18 && (
            <>
              <TableRow>
                <TableCell colSpan={11} sx={{ height: 8, p: 0 }} />
              </TableRow>
              {renderHoleRow(backNineHoles, 'Hole', back9Total, back9Par)}
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
          flexWrap: 'wrap',
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
          {totalPar > 0 && totalScore > 0 && (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1 }}
              color={
                totalScore - totalPar > 0
                  ? 'error.main'
                  : totalScore - totalPar < 0
                    ? 'success.main'
                    : 'text.secondary'
              }
            >
              ({totalScore - totalPar >= 0 ? '+' : ''}
              {totalScore - totalPar})
            </Typography>
          )}
        </Typography>
        {showPutts && totalPutts > 0 && (
          <Typography variant="body2" color="text.secondary">
            Putts: <strong>{totalPutts}</strong>
          </Typography>
        )}
        {showFairways && fairwaysEligible > 0 && (
          <Typography variant="body2" color="text.secondary">
            FW:{' '}
            <strong>
              {fairwaysHitCount}/{fairwaysEligible}
            </strong>
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default HoleScoreGrid;
