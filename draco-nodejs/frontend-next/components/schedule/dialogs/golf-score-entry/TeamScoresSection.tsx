'use client';

import React, { useMemo, useCallback } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
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
  teamSize?: number;
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
  teamSize = 2,
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

  const hasMorePlayersThanAllowed = players.length > teamSize;
  const hasFewerPlayersThanRequired = players.length < teamSize;
  const missingPlayerCount = hasFewerPlayersThanRequired ? teamSize - players.length : 0;

  const selectedPlayerIds = useMemo(() => {
    return Object.entries(scores)
      .filter(([, score]) => !score.isAbsent)
      .map(([rosterId]) => rosterId);
  }, [scores]);

  const selectedCount = selectedPlayerIds.length;
  const canSelectMore = selectedCount < teamSize;

  const handlePlayerSelectionChange = useCallback(
    (rosterId: string, isSelected: boolean) => {
      const currentScore = scores[rosterId];
      if (!currentScore) return;

      if (isSelected && !canSelectMore) {
        return;
      }

      onScoreChange(rosterId, {
        ...currentScore,
        isAbsent: !isSelected,
      });
    },
    [scores, onScoreChange, canSelectMore],
  );

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
        {hasMorePlayersThanAllowed && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<WarningIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2">
                This team has {players.length} players but only {teamSize} can play per match.
              </Typography>
              <Chip
                size="small"
                label={`${selectedCount}/${teamSize} selected`}
                color={selectedCount === teamSize ? 'success' : 'warning'}
              />
            </Box>
          </Alert>
        )}

        {hasFewerPlayersThanRequired && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This team has {players.length} player{players.length !== 1 ? 's' : ''} but requires{' '}
              {teamSize}. {missingPlayerCount} slot{missingPlayerCount !== 1 ? 's' : ''} will be
              marked as absent.
            </Typography>
          </Alert>
        )}

        {players.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No players on roster
          </Typography>
        ) : hasMorePlayersThanAllowed ? (
          players.map((player) => {
            const scoreData = scores[player.id] || {
              rosterId: player.id,
              isAbsent: true,
              isSubstitute: false,
              totalsOnly: !showHoleByHole,
              totalScore: 0,
              holeScores: [],
            };
            const isSelected = !scoreData.isAbsent;
            const canSelect = isSelected || canSelectMore;

            return (
              <Box key={player.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: isSelected ? 'action.selected' : 'transparent',
                    border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  }}
                >
                  <Tooltip
                    title={
                      !canSelect
                        ? `Maximum ${teamSize} players can be selected`
                        : isSelected
                          ? 'Click to deselect player'
                          : 'Click to select player'
                    }
                  >
                    <span>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) =>
                              handlePlayerSelectionChange(player.id, e.target.checked)
                            }
                            disabled={disabled || (!isSelected && !canSelect)}
                            size="small"
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            sx={{
                              color: isSelected
                                ? theme.palette.text.primary
                                : theme.palette.text.secondary,
                            }}
                          >
                            {player.player.firstName} {player.player.lastName}
                            {player.player.handicapIndex !== null &&
                              player.player.handicapIndex !== undefined && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 1 }}
                                >
                                  (HCP: {player.player.handicapIndex.toFixed(1)})
                                </Typography>
                              )}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    </span>
                  </Tooltip>
                </Box>
                {isSelected && (
                  <Box sx={{ pl: 4, pb: 1 }}>
                    <PlayerScoreRow
                      player={player}
                      scoreData={scoreData}
                      onChange={(data) => onScoreChange(player.id, data)}
                      substitutes={substitutes}
                      numberOfHoles={numberOfHoles}
                      showHoleByHole={showHoleByHole}
                      disabled={disabled}
                    />
                  </Box>
                )}
              </Box>
            );
          })
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
