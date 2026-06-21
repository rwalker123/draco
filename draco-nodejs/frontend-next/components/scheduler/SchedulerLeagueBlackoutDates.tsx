'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type {
  SchedulerLeagueExclusion,
  SchedulerLeagueExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerLeagueExclusionDialog } from './SchedulerLeagueExclusionDialog';
import { formatDateInTimezone } from '../../utils/dateUtils';
import { useConstraintDialog } from '../../hooks/useConstraintDialog';
import { ListRowActions, listRowSx } from './schedulerListRow';

type LeagueOption = { id: string; name: string };

interface SchedulerLeagueBlackoutDatesProps {
  seasonId: string | null;
  timeZone: string;
  leagues: LeagueOption[];
  leagueNameById: Map<string, string>;
  exclusions: SchedulerLeagueExclusion[];
  loading: boolean;
  onCreate: (input: SchedulerLeagueExclusionUpsert) => Promise<void>;
  onEdit: (id: string, input: SchedulerLeagueExclusionUpsert) => Promise<void>;
  onDelete: (exclusion: SchedulerLeagueExclusion) => Promise<void>;
}

export const SchedulerLeagueBlackoutDates: React.FC<SchedulerLeagueBlackoutDatesProps> = ({
  seasonId,
  timeZone,
  leagues,
  leagueNameById,
  exclusions,
  loading,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const dialog = useConstraintDialog<SchedulerLeagueExclusion, SchedulerLeagueExclusionUpsert>(
    onCreate,
    onEdit,
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="subtitle2">League Blackout Dates:</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={dialog.openCreate}
          disabled={!seasonId || leagues.length === 0}
        >
          Add League Blackout Date
        </Button>
      </Box>

      {seasonId && exclusions.length > 0 && (
        <Stack spacing={1}>
          {exclusions.map((excl) => {
            const leagueName =
              leagueNameById.get(excl.leagueSeasonId) ?? `League ${excl.leagueSeasonId}`;
            const startLabel = formatDateInTimezone(excl.startTime, timeZone);
            const endLabel = formatDateInTimezone(excl.endTime, timeZone);
            const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

            return (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {leagueName} • {dateLabel}
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
        <SchedulerLeagueExclusionDialog
          key={`league-exclusion-${dialog.dialogKey}`}
          open={dialog.open}
          mode={dialog.mode}
          seasonId={seasonId}
          timeZone={timeZone}
          leagues={leagues}
          initialExclusion={dialog.editing}
          onClose={dialog.close}
          onSubmit={dialog.handleSave}
          loading={loading}
        />
      )}
    </Box>
  );
};
