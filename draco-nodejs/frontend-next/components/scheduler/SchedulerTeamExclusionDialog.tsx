'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SchedulerTeamExclusion, SchedulerTeamExclusionUpsert } from '@draco/shared-schemas';
import { SchedulerTeamExclusionUpsertSchema } from '@draco/shared-schemas';

type TeamOption = { id: string; name: string };

interface SchedulerTeamExclusionDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  seasonId: string;
  teams: TeamOption[];
  initialExclusion?: SchedulerTeamExclusion;
  onClose: () => void;
  onSubmit: (input: SchedulerTeamExclusionUpsert) => Promise<void>;
  loading?: boolean;
}

export const SchedulerTeamExclusionDialog: React.FC<SchedulerTeamExclusionDialogProps> = ({
  open,
  mode,
  seasonId,
  teams,
  initialExclusion,
  onClose,
  onSubmit,
  loading,
}) => {
  const [teamSeasonId, setTeamSeasonId] = useState(
    initialExclusion?.teamSeasonId ?? teams[0]?.id ?? '',
  );
  const [startTime, setStartTime] = useState(initialExclusion?.startTime ?? '');
  const [endTime, setEndTime] = useState(initialExclusion?.endTime ?? '');
  const [note, setNote] = useState(initialExclusion?.note ?? '');
  const [enabled, setEnabled] = useState(initialExclusion?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'create' ? 'Add Team Exclusion' : 'Edit Team Exclusion';

  const handleSubmit = async () => {
    setError(null);
    try {
      const trimmedNote = note.trim();
      const payload: SchedulerTeamExclusionUpsert = SchedulerTeamExclusionUpsertSchema.parse({
        seasonId,
        teamSeasonId,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
        enabled,
      });

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid team exclusion';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          <FormControl fullWidth size="small">
            <InputLabel id="scheduler-team-exclusion-team">Team</InputLabel>
            <Select
              labelId="scheduler-team-exclusion-team"
              label="Team"
              value={teamSeasonId}
              onChange={(event) => setTeamSeasonId(String(event.target.value))}
            >
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Start (UTC ISO)"
            size="small"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            placeholder="2026-04-05T13:00:00Z"
            helperText="Use ISO datetime (UTC)."
          />
          <TextField
            label="End (UTC ISO)"
            size="small"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            placeholder="2026-04-05T15:00:00Z"
            helperText="Use ISO datetime (UTC)."
          />

          <TextField
            label="Note (optional)"
            size="small"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            inputProps={{ maxLength: 255 }}
          />

          <FormControlLabel
            control={
              <Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            }
            label="Enabled"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
