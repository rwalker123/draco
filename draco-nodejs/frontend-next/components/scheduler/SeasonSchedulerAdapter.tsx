'use client';

import React, { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Typography, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { TeamSeasonType } from '@draco/shared-schemas';
import type { Game, League } from '@/types/schedule';
import { useEntityNameMaps } from '../../hooks/useEntityNameMaps';
import { SHOW_SEASON_SCHEDULER } from '../../constants/featureFlags';
import WidgetShell from '../ui/WidgetShell';
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
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const handleChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
    if (isExpanded) setHasOpened(true);
  };

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

  return (
    <WidgetShell accent="primary" disablePadding sx={{ mb: 3 }}>
      <Accordion
        expanded={expanded}
        onChange={handleChange}
        disableGutters
        elevation={0}
        square
        sx={{
          backgroundColor: 'transparent',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="scheduler-content"
          id="scheduler-header"
          sx={{
            px: 3,
            py: 1.5,
            '& .MuiAccordionSummary-content': {
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1,
              my: 0,
            },
          }}
        >
          <Typography variant="h6" fontWeight={700} color={theme.palette.widget.headerText}>
            Schedule Generator
          </Typography>
          <Typography variant="body2" color={theme.palette.widget.supportingText}>
            Generate a round-robin schedule around your existing games, then review and apply.
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          id="scheduler-content"
          aria-labelledby="scheduler-header"
          sx={{ px: 3, pt: 0, pb: 3 }}
        >
          {hasOpened ? (
            <SeasonSchedulerWidget
              key={`${accountId}:${seasonId ?? 'none'}`}
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
          ) : null}
        </AccordionDetails>
      </Accordion>
    </WidgetShell>
  );
};
