'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type {
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerSeasonExclusionDialog } from './SchedulerSeasonExclusionDialog';
import { formatDateInTimezone } from '../../utils/dateUtils';
import { useConstraintDialog } from '../../hooks/useConstraintDialog';
import { ListRowActions, listRowSx } from './schedulerListRow';

interface SchedulerBlackoutDatesProps {
  seasonId: string | null;
  timeZone: string;
  exclusions: SchedulerSeasonExclusion[];
  loading: boolean;
  onCreate: (input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onEdit: (id: string, input: SchedulerSeasonExclusionUpsert) => Promise<void>;
  onDelete: (exclusion: SchedulerSeasonExclusion) => Promise<void>;
}

export const SchedulerBlackoutDates: React.FC<SchedulerBlackoutDatesProps> = ({
  seasonId,
  timeZone,
  exclusions,
  loading,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const dialog = useConstraintDialog<SchedulerSeasonExclusion, SchedulerSeasonExclusionUpsert>(
    onCreate,
    onEdit,
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="subtitle2">Blackout Dates:</Typography>
        <Button variant="outlined" size="small" onClick={dialog.openCreate} disabled={!seasonId}>
          Add Blackout Date
        </Button>
      </Box>

      {seasonId && exclusions.length > 0 && (
        <Stack spacing={1}>
          {exclusions.map((excl) => {
            const startLabel = formatDateInTimezone(excl.startTime, timeZone);
            const endLabel = formatDateInTimezone(excl.endTime, timeZone);
            const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

            return (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {dateLabel}
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
        <SchedulerSeasonExclusionDialog
          key={`season-exclusion-${dialog.dialogKey}`}
          open={dialog.open}
          mode={dialog.mode}
          seasonId={seasonId}
          timeZone={timeZone}
          initialExclusion={dialog.editing}
          onClose={dialog.close}
          onSubmit={dialog.handleSave}
          loading={loading}
        />
      )}
    </Box>
  );
};
