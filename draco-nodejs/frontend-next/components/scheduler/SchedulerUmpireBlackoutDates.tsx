'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import type {
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';
import { SchedulerUmpireExclusionDialog } from './SchedulerUmpireExclusionDialog';
import { formatDateInTimezone } from '../../utils/dateUtils';
import { useConstraintDialog } from '../../hooks/useConstraintDialog';
import { ListRowActions, listRowSx } from './schedulerListRow';

type UmpireOption = { id: string; name: string };

interface SchedulerUmpireBlackoutDatesProps {
  seasonId: string | null;
  timeZone: string;
  umpires: UmpireOption[];
  umpireNameById: Map<string, string>;
  exclusions: SchedulerUmpireExclusion[];
  loading: boolean;
  onCreate: (input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onEdit: (id: string, input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onDelete: (exclusion: SchedulerUmpireExclusion) => Promise<void>;
}

export const SchedulerUmpireBlackoutDates: React.FC<SchedulerUmpireBlackoutDatesProps> = ({
  seasonId,
  timeZone,
  umpires,
  umpireNameById,
  exclusions,
  loading,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const dialog = useConstraintDialog<SchedulerUmpireExclusion, SchedulerUmpireExclusionUpsert>(
    onCreate,
    onEdit,
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="subtitle2">Umpire Blackout Dates:</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={dialog.openCreate}
          disabled={!seasonId || umpires.length === 0}
        >
          Add Umpire Blackout Date
        </Button>
      </Box>

      {seasonId && exclusions.length > 0 && (
        <Stack spacing={1}>
          {exclusions.map((excl) => {
            const umpireName = umpireNameById.get(excl.umpireId) ?? `Umpire ${excl.umpireId}`;
            const startLabel = formatDateInTimezone(excl.startTime, timeZone);
            const endLabel = formatDateInTimezone(excl.endTime, timeZone);
            const dateLabel = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;

            return (
              <Box key={excl.id} sx={listRowSx}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {umpireName} • {dateLabel}
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
        <SchedulerUmpireExclusionDialog
          key={`umpire-exclusion-${dialog.dialogKey}`}
          open={dialog.open}
          mode={dialog.mode}
          seasonId={seasonId}
          timeZone={timeZone}
          umpires={umpires}
          initialExclusion={dialog.editing}
          onClose={dialog.close}
          onSubmit={dialog.handleSave}
          loading={loading}
        />
      )}
    </Box>
  );
};
