'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  onError: (error: string) => void;
  addManager: (contactId: string) => Promise<{ success: boolean; message: string }>;
  availablePlayers: RosterMemberType[];
  existingManagers: TeamManagerType[];
}

const AssignTeamManagerDialog: React.FC<AssignTeamManagerDialogProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  addManager,
  availablePlayers,
  existingManagers,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setSelectedContactId(null);
    onClose();
  };

  const eligiblePlayers = availablePlayers.filter(
    (member) => !existingManagers.some((m) => m.contact.id === member.player.contact.id),
  );

  const selectedPlayer =
    eligiblePlayers.find((member) => member.player.contact.id === selectedContactId) || null;

  const handleAssign = async () => {
    if (!selectedContactId || !selectedPlayer) return;

    setLoading(true);

    const result = await addManager(selectedContactId);

    if (result.success) {
      const playerName = getContactDisplayName(selectedPlayer.player.contact);
      onSuccess({
        message: `"${playerName}" assigned as team manager`,
        managerId: selectedContactId,
      });
    } else {
      onError(result.message);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Team Manager</DialogTitle>
      <DialogContent>
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
        <Button onClick={handleClose} disabled={loading}>
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
