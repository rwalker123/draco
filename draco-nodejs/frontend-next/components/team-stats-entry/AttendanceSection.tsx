'use client';

import React, { useMemo } from 'react';
import { Alert, List, ListItemButton, Stack, Switch, Tooltip, Typography } from '@mui/material';
import type { TeamStatsPlayerSummaryType } from '@draco/shared-schemas';

import { buildPlayerLabel } from './utils';

interface AttendanceSectionProps {
  options: TeamStatsPlayerSummaryType[];
  selection: string[];
  lockedRosterIds: string[];
  onToggleAttendance: (rosterSeasonId: string, present: boolean) => void;
  pendingRosterId: string | null;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
}

const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  options,
  selection,
  lockedRosterIds,
  onToggleAttendance,
  pendingRosterId,
  loading,
  error,
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
    if (lockedSet.has(rosterSeasonId) || !canEdit || loading || pendingRosterId !== null) {
      return;
    }

    const isSelected = selectionSet.has(rosterSeasonId);
    onToggleAttendance(rosterSeasonId, !isSelected);
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

      <List dense disablePadding>
        {sortedPlayers.map((player) => {
          const rosterId = player.rosterSeasonId;
          const isSelected = selectionSet.has(rosterId);
          const isLocked = lockedSet.has(rosterId);

          const disabled =
            !canEdit || loading || (isLocked && !isSelected) || pendingRosterId === rosterId;

          return (
            <ListItemButton
              key={rosterId}
              disableGutters
              disableRipple
              selected={isSelected}
              onClick={!disabled ? () => handleToggle(rosterId) : undefined}
              disabled={disabled}
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
                    disabled={disabled}
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
