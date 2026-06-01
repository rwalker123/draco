'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import type {
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerSeasonExclusionDialog } from './SchedulerSeasonExclusionDialog';
import { SchedulerTeamExclusionDialog } from './SchedulerTeamExclusionDialog';
import { SchedulerUmpireExclusionDialog } from './SchedulerUmpireExclusionDialog';
import { formatLocalTimeRange } from '../../utils/schedulerTimeFormat';
import { useConstraintDialog } from '../../hooks/useConstraintDialog';
import { ConstraintListSection, ListRowActions, listRowSx } from './ConstraintListSection';

type EntityOption = { id: string; name: string };

interface SeasonSchedulerConstraintListsProps {
  seasonId: string | null;
  timeZone: string;
  teams: EntityOption[];
  umpires: EntityOption[];
  seasonExclusions: SchedulerSeasonExclusion[];
  teamExclusions: SchedulerTeamExclusion[];
  umpireExclusions: SchedulerUmpireExclusion[];
  teamNameById: Map<string, string>;
  umpireNameById: Map<string, string>;
  loading: boolean;
  onCreateSeasonExclusion: (input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onEditSeasonExclusion: (id: string, input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onDeleteSeasonExclusion: (exclusion: SchedulerSeasonExclusion) => Promise<void>;
  onCreateTeamExclusion: (input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onEditTeamExclusion: (id: string, input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onDeleteTeamExclusion: (exclusion: SchedulerTeamExclusion) => Promise<void>;
  onCreateUmpireExclusion: (input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onEditUmpireExclusion: (id: string, input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onDeleteUmpireExclusion: (exclusion: SchedulerUmpireExclusion) => Promise<void>;
}

export const SeasonSchedulerConstraintLists: React.FC<SeasonSchedulerConstraintListsProps> = ({
  seasonId,
  timeZone,
  teams,
  umpires,
  seasonExclusions,
  teamExclusions,
  umpireExclusions,
  teamNameById,
  umpireNameById,
  loading,
  onCreateSeasonExclusion,
  onEditSeasonExclusion,
  onDeleteSeasonExclusion,
  onCreateTeamExclusion,
  onEditTeamExclusion,
  onDeleteTeamExclusion,
  onCreateUmpireExclusion,
  onEditUmpireExclusion,
  onDeleteUmpireExclusion,
}) => {
  const seasonExclusionDialog = useConstraintDialog<
    SchedulerSeasonExclusion,
    SchedulerSeasonExclusionUpsert
  >(onCreateSeasonExclusion, onEditSeasonExclusion);
  const teamExclusionDialog = useConstraintDialog<
    SchedulerTeamExclusion,
    SchedulerTeamExclusionUpsert
  >(onCreateTeamExclusion, onEditTeamExclusion);
  const umpireExclusionDialog = useConstraintDialog<
    SchedulerUmpireExclusion,
    SchedulerUmpireExclusionUpsert
  >(onCreateUmpireExclusion, onEditUmpireExclusion);

  const timeRange = (start: string, end: string) => formatLocalTimeRange(start, end, timeZone);

  const renderWindowRow = <
    T extends {
      id: string;
      startTime: string;
      endTime: string;
      enabled: boolean;
      note?: string | null;
    },
  >(
    excl: T,
    prefix: string | undefined,
    openEdit: (e: T) => void,
    onDelete: (e: T) => Promise<void>,
  ) => (
    <Box key={excl.id} sx={listRowSx}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {prefix ? `${prefix} • ` : ''}
          {timeRange(excl.startTime, excl.endTime)} {excl.enabled ? '' : '(disabled)'}
        </Typography>
        {excl.note && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {excl.note}
          </Typography>
        )}
      </Box>
      <ListRowActions
        onEdit={() => openEdit(excl)}
        onDelete={() => onDelete(excl).catch(() => undefined)}
      />
    </Box>
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="outlined" onClick={seasonExclusionDialog.openCreate} disabled={!seasonId}>
          Add Season Exclusion
        </Button>
        <Button
          variant="outlined"
          onClick={teamExclusionDialog.openCreate}
          disabled={!seasonId || teams.length === 0}
        >
          Add Team Exclusion
        </Button>
        <Button
          variant="outlined"
          onClick={umpireExclusionDialog.openCreate}
          disabled={!seasonId || umpires.length === 0}
        >
          Add Umpire Exclusion
        </Button>
      </Box>

      <ConstraintListSection
        title="Season Exclusion Windows"
        seasonId={seasonId}
        items={seasonExclusions}
        renderRow={(excl) =>
          renderWindowRow(excl, undefined, seasonExclusionDialog.openEdit, onDeleteSeasonExclusion)
        }
      />

      <ConstraintListSection
        title="Team Exclusion Windows"
        seasonId={seasonId}
        items={teamExclusions}
        renderRow={(excl) =>
          renderWindowRow(
            excl,
            teamNameById.get(excl.teamSeasonId) ?? `Team ${excl.teamSeasonId}`,
            teamExclusionDialog.openEdit,
            onDeleteTeamExclusion,
          )
        }
      />

      <ConstraintListSection
        title="Umpire Exclusion Windows"
        seasonId={seasonId}
        items={umpireExclusions}
        renderRow={(excl) =>
          renderWindowRow(
            excl,
            umpireNameById.get(excl.umpireId) ?? `Umpire ${excl.umpireId}`,
            umpireExclusionDialog.openEdit,
            onDeleteUmpireExclusion,
          )
        }
      />

      {seasonId && (
        <>
          <SchedulerSeasonExclusionDialog
            key={`season-exclusion-${seasonExclusionDialog.dialogKey}`}
            open={seasonExclusionDialog.open}
            mode={seasonExclusionDialog.mode}
            seasonId={seasonId}
            initialExclusion={seasonExclusionDialog.editing}
            onClose={seasonExclusionDialog.close}
            onSubmit={seasonExclusionDialog.handleSave}
            loading={loading}
          />
          <SchedulerTeamExclusionDialog
            key={`team-exclusion-${teamExclusionDialog.dialogKey}`}
            open={teamExclusionDialog.open}
            mode={teamExclusionDialog.mode}
            seasonId={seasonId}
            teams={teams}
            initialExclusion={teamExclusionDialog.editing}
            onClose={teamExclusionDialog.close}
            onSubmit={teamExclusionDialog.handleSave}
            loading={loading}
          />
          <SchedulerUmpireExclusionDialog
            key={`umpire-exclusion-${umpireExclusionDialog.dialogKey}`}
            open={umpireExclusionDialog.open}
            mode={umpireExclusionDialog.mode}
            seasonId={seasonId}
            umpires={umpires}
            initialExclusion={umpireExclusionDialog.editing}
            onClose={umpireExclusionDialog.close}
            onSubmit={umpireExclusionDialog.handleSave}
            loading={loading}
          />
        </>
      )}
    </>
  );
};
