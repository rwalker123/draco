'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { SchedulerProblemSpecPreview, TeamSeasonType } from '@draco/shared-schemas';
import type { League } from '@/types/schedule';
import type { ScheduleLocation } from '../schedule/types/sportAdapter';
import { useEntityNameMaps } from '../../hooks/useEntityNameMaps';
import WidgetShell from '../ui/WidgetShell';
import {
  SeasonSchedulerWidget,
  type SeasonSchedulerProposalSnapshot,
} from './SeasonSchedulerWidget';
import { ScheduleProposalSummary } from './ScheduleProposalSummary';
import { UnscheduledGamesWidget } from './UnscheduledGamesWidget';
import { ProposedScheduleControl } from './ProposedScheduleControl';

type GameRequest = SchedulerProblemSpecPreview['games'][number];

interface OfficialEntity {
  id: string;
  firstName: string;
  lastName: string;
}

interface SeasonSchedulerExperienceProps {
  accountId: string;
  seasonId: string | null;
  seasonName: string | null;
  canEdit: boolean;
  timeZone: string;
  leagueSeasonIdFilter?: string;
  teamSeasonIdFilter?: string;
  locations: ScheduleLocation[];
  umpires: OfficialEntity[];
  leagues: League[];
  teams: TeamSeasonType[];
  onApplied: () => Promise<void>;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
}

export const SeasonSchedulerExperience: React.FC<SeasonSchedulerExperienceProps> = ({
  accountId,
  seasonId,
  seasonName,
  canEdit,
  timeZone,
  leagueSeasonIdFilter,
  teamSeasonIdFilter,
  locations,
  umpires,
  leagues,
  teams,
  onApplied,
  setSuccess,
  setError,
}) => {
  const [proposalSnapshot, setProposalSnapshot] = useState<SeasonSchedulerProposalSnapshot | null>(
    null,
  );

  const schedulerFields = locations.map((location) => ({ id: location.id, name: location.name }));

  const schedulerUmpires = umpires.map((umpire) => ({
    id: umpire.id,
    name: `${umpire.firstName} ${umpire.lastName}`.trim() || 'Umpire',
  }));

  const schedulerLeagues = leagues.map((league) => ({ id: league.id, name: league.name }));

  const schedulerTeams = teams
    .filter((team) => Boolean(team.id))
    .map((team) => ({ id: team.id!, name: team.name ?? 'Unknown Team' }));

  const { fieldNameById, teamNameById } = useEntityNameMaps({
    fields: schedulerFields,
    teams: schedulerTeams,
    umpires: schedulerUmpires,
  });
  const leagueNameById = new Map<string, string>(leagues.map((league) => [league.id, league.name]));
  const fieldShortNameById = new Map<string, string>(
    locations.map((location) => [location.id, location.shortName ?? location.name]),
  );
  const teamDivisionNameById = new Map<string, string>(
    teams.filter((team) => Boolean(team.id)).map((team) => [team.id!, team.division?.name ?? '']),
  );

  const proposal = proposalSnapshot?.proposal ?? null;
  const gameRequestById = new Map<string, GameRequest>(
    (proposalSnapshot?.generatedMatchups ?? []).map((matchup) => [matchup.id, matchup]),
  );

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <WidgetShell
        accent="primary"
        title="Schedule Generator"
        subtitle="Configure your season window, fields, umpires, and constraints, then generate a round-robin schedule."
        sx={{ mb: 3 }}
      >
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
          onApplied={onApplied}
          onProposalChange={setProposalSnapshot}
          setSuccess={setSuccess}
          setError={setError}
        />
      </WidgetShell>

      {proposal ? (
        <>
          <WidgetShell accent="info" title="Schedule Proposal Summary" sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Status: {proposal.status}. Scheduled {proposal.metrics.scheduledGames}/
              {proposal.metrics.totalGames}. {proposal.unscheduled.length} unscheduled.
            </Typography>
            {proposal.assignments.length > 0 ? (
              <ScheduleProposalSummary
                assignments={proposal.assignments}
                gameRequestById={gameRequestById}
                fieldNameById={fieldNameById}
                teamNameById={teamNameById}
                teamDivisionNameById={teamDivisionNameById}
                leagueNameById={leagueNameById}
                timeZone={timeZone}
              />
            ) : null}
          </WidgetShell>

          <UnscheduledGamesWidget
            unscheduled={proposal.unscheduled}
            gameRequestById={gameRequestById}
            teamNameById={teamNameById}
            leagueNameById={leagueNameById}
          />

          {proposal.assignments.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Proposed Schedule
              </Typography>
              <ProposedScheduleControl
                accountId={accountId}
                seasonId={seasonId ?? ''}
                seasonName={seasonName}
                timeZone={timeZone}
                proposal={proposal}
                gameRequestById={gameRequestById}
                fieldNameById={fieldNameById}
                fieldShortNameById={fieldShortNameById}
                teamNameById={teamNameById}
                leagueNameById={leagueNameById}
                teams={teams}
                locations={locations}
              />
            </Box>
          ) : null}
        </>
      ) : null}
    </>
  );
};
