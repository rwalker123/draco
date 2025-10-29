'use client';

import React, { useMemo } from 'react';
import { Alert, List, ListItemButton, Stack, Switch, Tooltip, Typography } from '@mui/material';
import type { TeamStatsPlayerSummaryType } from '@draco/shared-schemas';

import { buildPlayerLabel } from './utils';

interface AttendanceSectionProps {
  options: TeamStatsPlayerSummaryType[];
  selection: string[];
  lockedRosterIds: string[];
  onSelectionChange: (selection: string[]) => void;
  loading: boolean;
  error: string | null;
  saving: boolean;
  canEdit: boolean;
}

const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  options,
  selection,
  lockedRosterIds,
  onSelectionChange,
  loading,
  error,
  saving,
  canEdit,
}) => {
  const selectionSet = useMemo(() => new Set(selection), [selection]);
  const lockedSet = useMemo(() => new Set(lockedRosterIds), [lockedRosterIds]);
  const sortedPlayers = useMemo(() => {
    return [...options].sort((a, b) => buildPlayerLabel(a).localeCompare(buildPlayerLabel(b)));
  }, [options]);
  const presentCount = selectionSet.size;
  const totalCount = options.length;

  const handleToggle = (rosterSeasonId: string) => {
    if (lockedSet.has(rosterSeasonId) || !canEdit) {
      return;
    }

    const next = new Set(selectionSet);
    if (next.has(rosterSeasonId)) {
      next.delete(rosterSeasonId);
    } else {
      next.add(rosterSeasonId);
    }

    onSelectionChange(Array.from(next));
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Players Present</Typography>
        <Typography variant="body2" color="text.secondary">
          {presentCount} of {totalCount} players marked present. Players with recorded stats are
          locked on.{!canEdit ? ' Attendance is read-only.' : ''}
        </Typography>
      </Stack>

      {loading && (
        <Typography variant="body2" color="text.secondary">
          Updating attendance...
        </Typography>
      )}
      <List dense disablePadding>
        {sortedPlayers.map((player) => {
          const rosterId = player.rosterSeasonId;
          const isSelected = selectionSet.has(rosterId);
          const isLocked = lockedSet.has(rosterId);

          return (
            <ListItemButton
              key={rosterId}
              disableGutters
              disableRipple
              selected={isSelected}
              onClick={canEdit && !loading && !saving ? () => handleToggle(rosterId) : undefined}
              disabled={!canEdit || loading || saving}
              sx={{
                py: 0.5,
                px: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Tooltip
                title={isLocked ? 'Player has recorded stats for this game' : ''}
                disableHoverListener={!isLocked}
              >
                <span>
                  <Switch
                    checked={isSelected}
                    onChange={(event) => {
                      event.stopPropagation();
                      handleToggle(rosterId);
                    }}
                    disabled={!canEdit || isLocked || saving || loading}
                    inputProps={{ 'aria-label': `Mark ${buildPlayerLabel(player)} present` }}
                  />
                </span>
              </Tooltip>
              <Stack spacing={0.25} alignItems="flex-start">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {buildPlayerLabel(player)}
                </Typography>
                {isLocked && (
                  <Typography variant="caption" color="text.secondary">
                    Recorded stats
                  </Typography>
                )}
              </Stack>
            </ListItemButton>
          );
        })}
      </List>
    </Stack>
  );
};

export default AttendanceSection;
