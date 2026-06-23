'use client';

import React, { useState } from 'react';
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { buildMatchupLabel } from './proposalSummary';

type GameRequest = SchedulerProblemSpecPreview['games'][number];

interface UnscheduledGamesWidgetProps {
  unscheduled: SchedulerSolveResult['unscheduled'];
  gameRequestById: Map<string, GameRequest>;
  teamNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
}

export const UnscheduledGamesWidget: React.FC<UnscheduledGamesWidgetProps> = ({
  unscheduled,
  gameRequestById,
  teamNameById,
  leagueNameById,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (unscheduled.length === 0) {
    return null;
  }

  return (
    <WidgetShell accent="warning" disablePadding sx={{ mb: 3 }}>
      <Box
        component="button"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 3,
          py: 2,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Unscheduled Games
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unscheduled.length} game{unscheduled.length === 1 ? '' : 's'} could not be scheduled.
          </Typography>
        </Box>
        <IconButton component="span" size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={1} sx={{ px: 3, pb: 3 }}>
          {unscheduled.map((item) => (
            <Box
              key={item.gameId}
              sx={{
                p: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" noWrap>
                {buildMatchupLabel(item.gameId, gameRequestById, teamNameById, leagueNameById)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.reason}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </WidgetShell>
  );
};
