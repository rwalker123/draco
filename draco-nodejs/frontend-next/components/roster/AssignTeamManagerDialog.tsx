'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  TextField,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { SupervisorAccount as ManagerIcon } from '@mui/icons-material';
import { RosterMemberType, TeamManagerType } from '@draco/shared-schemas';
import { getContactDisplayName } from '../../utils/contactUtils';

interface AssignTeamManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: { message: string; managerId: string }) => void;
  addManager: (contactId: string) => Promise<void>;
  availablePlayers: RosterMemberType[];
  existingManagers: TeamManagerType[];
}

const AssignTeamManagerDialog: React.FC<AssignTeamManagerDialogProps> = ({
  open,
  onClose,
  onSuccess,
  addManager,
  availablePlayers,
  existingManagers,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedContactId(null);
      setError(null);
    }
  }, [open]);

  const eligiblePlayers = availablePlayers.filter(
    (member) => !existingManagers.some((m) => m.contact.id === member.player.contact.id),
  );

  const selectedPlayer =
    eligiblePlayers.find((member) => member.player.contact.id === selectedContactId) || null;

  const handleAssign = async () => {
    if (!selectedContactId || !selectedPlayer) return;

    setLoading(true);
    setError(null);

    try {
      await addManager(selectedContactId);
      const playerName = getContactDisplayName(selectedPlayer.player.contact);
      onSuccess({
        message: `"${playerName}" assigned as team manager`,
        managerId: selectedContactId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign manager');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Team Manager</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Autocomplete
          options={eligiblePlayers}
          getOptionLabel={(option) => getContactDisplayName(option.player.contact)}
          value={selectedPlayer}
          onChange={(_, newValue) =>
            setSelectedContactId(newValue ? newValue.player.contact.id : null)
          }
          renderInput={(params) => (
            <TextField {...params} label="Select Player" fullWidth variant="outlined" />
          )}
          noOptionsText={
            availablePlayers.length === 0 ? 'No active players' : 'No eligible players'
          }
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!selectedContactId || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ManagerIcon />}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignTeamManagerDialog;
