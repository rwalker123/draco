'use client';

import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import type { TeamSeasonType } from '@draco/shared-schemas';
import type { Game, League } from '@/types/schedule';
import { useEntityNameMaps } from '../../hooks/useEntityNameMaps';
import { SHOW_SEASON_SCHEDULER } from '../../constants/featureFlags';
import { SeasonSchedulerWidget } from './SeasonSchedulerWidget';

interface NamedEntity {
  id: string;
  name: string;
}

interface OfficialEntity {
  id: string;
  firstName: string;
  lastName: string;
}

interface SeasonSchedulerAdapterProps {
  accountId: string;
  seasonId: string | null;
  canEdit: boolean;
  timeZone: string;
  leagueSeasonIdFilter?: string;
  teamSeasonIdFilter?: string;
  fields: NamedEntity[];
  umpires: OfficialEntity[];
  leagues: League[];
  teams: TeamSeasonType[];
  games: Game[];
  onApplied: () => Promise<void>;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

export const SeasonSchedulerAdapter: React.FC<SeasonSchedulerAdapterProps> = ({
  accountId,
  seasonId,
  canEdit,
  timeZone,
  leagueSeasonIdFilter,
  teamSeasonIdFilter,
  fields,
  umpires,
  leagues,
  teams,
  games,
  onApplied,
  setSuccess,
  setError,
}) => {
  const [open, setOpen] = useState(false);

  const schedulerFields = fields.map((field) => ({ id: field.id, name: field.name }));

  const schedulerUmpires = umpires.map((umpire) => ({
    id: umpire.id,
    name: `${umpire.firstName} ${umpire.lastName}`.trim() || 'Umpire',
  }));

  const schedulerLeagues = leagues.map((league) => ({ id: league.id, name: league.name }));

  const schedulerTeams = teams
    .filter((team) => Boolean(team.id))
    .map((team) => ({ id: team.id!, name: team.name ?? 'Unknown Team' }));

  const { getGameSummaryLabel } = useEntityNameMaps({ teams: schedulerTeams, games });

  if (!canEdit || !SHOW_SEASON_SCHEDULER) {
    return null;
  }

  if (!open) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
        >
          <Box>
            <Typography variant="h6" color="text.primary">
              Scheduler
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate and apply schedules (loads when opened).
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Open Scheduler
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <SeasonSchedulerWidget
      accountId={accountId}
      seasonId={seasonId}
      canEdit={canEdit}
      timeZone={timeZone}
      leagueSeasonIdFilter={leagueSeasonIdFilter}
      teamSeasonIdFilter={teamSeasonIdFilter}
      fields={schedulerFields}
      umpires={schedulerUmpires}
      leagues={schedulerLeagues}
      teams={schedulerTeams}
      getGameSummaryLabel={getGameSummaryLabel}
      onApplied={onApplied}
      setSuccess={setSuccess}
      setError={setError}
    />
  );
};
