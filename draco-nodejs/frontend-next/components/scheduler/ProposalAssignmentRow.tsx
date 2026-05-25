'use client';

import React from 'react';
import { Box, Checkbox, Collapse, IconButton, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import { formatLocalTimeRange } from '../../utils/schedulerTimeFormat';

type Assignment = SchedulerSolveResult['assignments'][number];
type GameRequest = SchedulerProblemSpecPreview['games'][number];

interface ProposalAssignmentRowProps {
  assignment: Assignment;
  game: GameRequest | undefined;
  timeZone: string;
  selected: boolean;
  expanded: boolean;
  fieldNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  umpireNameById: Map<string, string>;
  schedulerUmpireNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
  onToggleSelection: () => void;
  onToggleExpanded: () => void;
}

export const ProposalAssignmentRow: React.FC<ProposalAssignmentRowProps> = ({
  assignment,
  game,
  timeZone,
  selected,
  expanded,
  fieldNameById,
  teamNameById,
  umpireNameById,
  schedulerUmpireNameById,
  leagueNameById,
  onToggleSelection,
  onToggleExpanded,
}) => {
  const home =
    (game?.homeTeamSeasonId ? teamNameById.get(game.homeTeamSeasonId) : null) ?? 'Unknown Home';
  const visitor =
    (game?.visitorTeamSeasonId ? teamNameById.get(game.visitorTeamSeasonId) : null) ??
    'Unknown Visitor';
  const title = game ? `${home} vs ${visitor}` : `Game ${assignment.gameId}`;

  const leagueLabel =
    game?.leagueSeasonId && leagueNameById.get(game.leagueSeasonId)
      ? leagueNameById.get(game.leagueSeasonId)
      : null;

  const umpireNames = assignment.umpireIds
    .map((id) => schedulerUmpireNameById.get(id) ?? umpireNameById.get(id) ?? `Umpire ${id}`)
    .filter((name) => name.trim().length > 0);

  const secondaryParts: string[] = [];
  if (leagueLabel) secondaryParts.push(leagueLabel);
  secondaryParts.push(
    `Field: ${fieldNameById.get(assignment.fieldId) ?? `Field ${assignment.fieldId}`}`,
  );
  secondaryParts.push(formatLocalTimeRange(assignment.startTime, assignment.endTime, timeZone));
  if (umpireNames.length === 1) secondaryParts.push(`Umpire: ${umpireNames[0]}`);
  else if (umpireNames.length > 1) secondaryParts.push(`Umpires: ${umpireNames.join(', ')}`);
  else secondaryParts.push('Umpire: Unassigned');

  const detailsId = `proposal-assignment-details-${assignment.gameId}`;

  return (
    <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <Checkbox
          checked={selected}
          onChange={onToggleSelection}
          inputProps={{ 'aria-label': `Select assignment: ${title}` }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {secondaryParts.join(' • ')}
          </Typography>
        </Box>
        <IconButton
          size="small"
          aria-label={expanded ? `Collapse details for ${title}` : `Expand details for ${title}`}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggleExpanded}
        >
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit id={detailsId}>
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Game ID: {assignment.gameId}
          </Typography>
          {game && (
            <Typography variant="caption" color="text.secondary" display="block">
              Home Team Season ID: {game.homeTeamSeasonId} • Visitor Team Season ID:{' '}
              {game.visitorTeamSeasonId}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block">
            Start (UTC): {assignment.startTime} • End (UTC): {assignment.endTime}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Field ID: {assignment.fieldId} • Umpire IDs:{' '}
            {assignment.umpireIds.length ? assignment.umpireIds.join(', ') : 'None'}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};
