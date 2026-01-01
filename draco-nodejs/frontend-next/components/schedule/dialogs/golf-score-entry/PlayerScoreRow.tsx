'use client';

import React from 'react';
import {
  Box,
  Checkbox,
  Collapse,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { GolfRosterEntryType, GolfSubstituteType } from '@draco/shared-schemas';
import { HoleScoreGrid } from './HoleScoreGrid';

export interface PlayerScoreData {
  rosterId: string;
  isAbsent: boolean;
  isSubstitute: boolean;
  substituteGolferId?: string;
  totalsOnly: boolean;
  totalScore: number;
  holeScores: number[];
}

interface PlayerScoreRowProps {
  player: GolfRosterEntryType;
  scoreData: PlayerScoreData;
  onChange: (data: PlayerScoreData) => void;
  substitutes: GolfSubstituteType[];
  numberOfHoles: 9 | 18;
  showHoleByHole: boolean;
  disabled?: boolean;
}

export function PlayerScoreRow({
  player,
  scoreData,
  onChange,
  substitutes,
  numberOfHoles,
  showHoleByHole,
  disabled = false,
}: PlayerScoreRowProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  const playerName = `${player.player.firstName} ${player.player.lastName}`;
  const substitutePlayer = scoreData.substituteGolferId
    ? substitutes.find((s) => s.golferId === scoreData.substituteGolferId)
    : null;
  const displayName = substitutePlayer
    ? `${substitutePlayer.player.firstName} ${substitutePlayer.player.lastName} (sub for ${playerName})`
    : playerName;

  const handleAbsentChange = (checked: boolean) => {
    onChange({
      ...scoreData,
      isAbsent: checked,
      isSubstitute: checked ? scoreData.isSubstitute : false,
      substituteGolferId: checked ? scoreData.substituteGolferId : undefined,
    });
  };

  const handleSubstituteChange = (substituteGolferId: string) => {
    onChange({
      ...scoreData,
      isSubstitute: !!substituteGolferId,
      substituteGolferId: substituteGolferId || undefined,
    });
  };

  const handleTotalScoreChange = (value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 200) return;

    onChange({
      ...scoreData,
      totalScore: numValue,
      totalsOnly: true,
    });
  };

  const handleHoleScoresChange = (holeScores: number[]) => {
    const total = holeScores.reduce((sum, score) => sum + (score || 0), 0);
    onChange({
      ...scoreData,
      holeScores,
      totalScore: total,
      totalsOnly: false,
    });
  };

  const isScoreDisabled = disabled || scoreData.isAbsent;

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 1,
        backgroundColor: scoreData.isAbsent
          ? theme.palette.action.disabledBackground
          : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: '1 1 200px', minWidth: 150 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: scoreData.isAbsent ? theme.palette.text.disabled : theme.palette.text.primary,
            }}
          >
            {displayName}
          </Typography>
          {player.player.handicapIndex !== null && player.player.handicapIndex !== undefined && (
            <Typography variant="caption" color="text.secondary">
              Handicap: {player.player.handicapIndex.toFixed(1)}
            </Typography>
          )}
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={scoreData.isAbsent}
              onChange={(e) => handleAbsentChange(e.target.checked)}
              disabled={disabled}
              size="small"
            />
          }
          label="Absent"
          sx={{ m: 0 }}
        />

        {scoreData.isAbsent && substitutes.length > 0 && (
          <Select
            size="small"
            value={scoreData.substituteGolferId || ''}
            onChange={(e) => handleSubstituteChange(e.target.value)}
            displayEmpty
            disabled={disabled}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">
              <em>No substitute</em>
            </MenuItem>
            {substitutes.map((sub) => (
              <MenuItem key={sub.golferId} value={sub.golferId}>
                {sub.player.firstName} {sub.player.lastName}
              </MenuItem>
            ))}
          </Select>
        )}

        {!showHoleByHole && (
          <TextField
            type="number"
            size="small"
            label="Total Score"
            value={scoreData.totalScore > 0 ? scoreData.totalScore : ''}
            onChange={(e) => handleTotalScoreChange(e.target.value)}
            disabled={isScoreDisabled}
            inputProps={{
              min: 18,
              max: 200,
            }}
            sx={{ width: 120 }}
          />
        )}

        {showHoleByHole && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Total: {scoreData.totalScore > 0 ? scoreData.totalScore : '-'}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              disabled={isScoreDisabled}
              sx={{ ml: 'auto' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </>
        )}
      </Box>

      {showHoleByHole && (
        <Collapse in={expanded}>
          <Box sx={{ p: 1.5, pt: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
            <HoleScoreGrid
              holeScores={scoreData.holeScores}
              onChange={handleHoleScoresChange}
              numberOfHoles={numberOfHoles}
              disabled={isScoreDisabled}
            />
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export default PlayerScoreRow;
