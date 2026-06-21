'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { SchedulerTeamExclusion, SchedulerTeamExclusionUpsert } from '@draco/shared-schemas';
import { SchedulerTeamExclusionDialog } from './SchedulerTeamExclusionDialog';
import { formatDateInTimezone } from '../../utils/dateUtils';
import { useConstraintDialog } from '../../hooks/useConstraintDialog';
import { ListRowActions, listRowSx } from './schedulerListRow';

type TeamOption = { id: string; name: string };

interface SchedulerTeamBlackoutDatesProps {
  seasonId: string | null;
  timeZone: string;
  teams: TeamOption[];
  teamNameById: Map<string, string>;
  exclusions: SchedulerTeamExclusion[];
  loading: boolean;
  onCreate: (input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onEdit: (id: string, input: SchedulerTeamExclusionUpsert) => Promise<void>;
  onDelete: (exclusion: SchedulerTeamExclusion) => Promise<void>;
}

export const SchedulerTeamBlackoutDates: React.FC<SchedulerTeamBlackoutDatesProps> = ({
  seasonId,
  timeZone,
  teams,
  teamNameById,
  exclusions,
  loading,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const dialog = useConstraintDialog<SchedulerTeamExclusion, SchedulerTeamExclusionUpsert>(
    onCreate,
    onEdit,
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="subtitle2">Team Blackout Dates:</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={dialog.openCreate}
          disabled={!seasonId || teams.length === 0}
        >
          Add Team Blackout Date
        </Button>
      </Box>

      {seasonId && exclusions.length > 0 && (
        <Stack spacing={1}>
          {exclusions.map((excl) => {
            const teamName = teamNameById.get(excl.teamSeasonId) ?? `Team ${excl.teamSeasonId}`;
            const startLabel = formatDateInTimezone(excl.startTime, timeZone);
            const endLabel = formatDateInTimezone(excl.endTime, timeZone);
            const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

            return (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {teamName} • {dateLabel}
                  </Typography>
                  {excl.note && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {excl.note}
                    </Typography>
                  )}
                </Box>
                <ListRowActions
                  onEdit={() => dialog.openEdit(excl)}
                  onDelete={() => onDelete(excl).catch(() => undefined)}
                />
              </Box>
            );
          })}
        </Stack>
      )}

      {seasonId && (
        <SchedulerTeamExclusionDialog
          key={`team-exclusion-${dialog.dialogKey}`}
          open={dialog.open}
          mode={dialog.mode}
          seasonId={seasonId}
          timeZone={timeZone}
          teams={teams}
          initialExclusion={dialog.editing}
          onClose={dialog.close}
          onSubmit={dialog.handleSave}
          loading={loading}
        />
      )}
    </Box>
  );
};
