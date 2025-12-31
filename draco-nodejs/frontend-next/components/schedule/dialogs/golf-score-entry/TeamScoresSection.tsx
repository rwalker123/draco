'use client';

import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { GolfRosterEntryType, GolfSubstituteType } from '@draco/shared-schemas';
import { PlayerScoreRow, type PlayerScoreData } from './PlayerScoreRow';

interface TeamScoresSectionProps {
  teamName: string;
  teamId: string;
  players: GolfRosterEntryType[];
  substitutes: GolfSubstituteType[];
  scores: Record<string, PlayerScoreData>;
  onScoreChange: (rosterId: string, data: PlayerScoreData) => void;
  numberOfHoles: 9 | 18;
  showHoleByHole: boolean;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

export function TeamScoresSection({
  teamName,
  players,
  substitutes,
  scores,
  onScoreChange,
  numberOfHoles,
  showHoleByHole,
  disabled = false,
  defaultExpanded = true,
}: TeamScoresSectionProps) {
  const theme = useTheme();

  const teamTotal = useMemo(() => {
    return Object.values(scores).reduce((sum, score) => {
      if (score.isAbsent && !score.substituteGolferId) return sum;
      return sum + (score.totalScore || 0);
    }, 0);
  }, [scores]);

  const activePlayerCount = useMemo(() => {
    return Object.values(scores).filter((score) => !score.isAbsent || score.substituteGolferId)
      .length;
  }, [scores]);

  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: theme.palette.grey[100],
          '&:hover': {
            backgroundColor: theme.palette.grey[200],
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            pr: 2,
          }}
        >
          <Typography variant="h6" component="span">
            {teamName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {activePlayerCount} player{activePlayerCount !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              Team Total: {teamTotal > 0 ? teamTotal : '-'}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        {players.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No players on roster
          </Typography>
        ) : (
          players.map((player) => {
            const scoreData = scores[player.id] || {
              rosterId: player.id,
              isAbsent: false,
              isSubstitute: false,
              totalsOnly: !showHoleByHole,
              totalScore: 0,
              holeScores: [],
            };

            return (
              <PlayerScoreRow
                key={player.id}
                player={player}
                scoreData={scoreData}
                onChange={(data) => onScoreChange(player.id, data)}
                substitutes={substitutes}
                numberOfHoles={numberOfHoles}
                showHoleByHole={showHoleByHole}
                disabled={disabled}
              />
            );
          })
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default TeamScoresSection;
