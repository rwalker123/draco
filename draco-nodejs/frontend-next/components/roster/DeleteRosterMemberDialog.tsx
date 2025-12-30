'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { RosterMemberType } from '@draco/shared-schemas';
import { getContactDisplayName } from '../../utils/contactUtils';

interface DeleteRosterMemberDialogProps {
  open: boolean;
  member: RosterMemberType | null;
  onClose: () => void;
  onSuccess: (result: { message: string; memberId: string }) => void;
  deletePlayer: (rosterMemberId: string) => Promise<void>;
}

const DeleteRosterMemberDialog: React.FC<DeleteRosterMemberDialogProps> = ({
  open,
  member,
  onClose,
  onSuccess,
  deletePlayer,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = useCallback(async () => {
    if (!member) return;

    setLoading(true);
    setError(null);

    try {
      await deletePlayer(member.id);
      const playerName = getContactDisplayName(member.player.contact);
      onSuccess({ message: `Player "${playerName}" deleted successfully`, memberId: member.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player');
    } finally {
      setLoading(false);
    }
  }, [member, deletePlayer, onSuccess]);

  const playerName = member ? getContactDisplayName(member.player.contact) : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <WarningIcon color="error" sx={{ mr: 1 }} />
          Delete Player
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to permanently delete <strong>{playerName}</strong> from the roster?
        </Typography>
        <Alert severity="warning">
          This action cannot be undone. The player will be permanently removed from the team roster.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading || !member}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          Delete Player
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteRosterMemberDialog;
