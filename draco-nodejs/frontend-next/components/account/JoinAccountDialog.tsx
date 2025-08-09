'use client';
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

interface JoinAccountDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

const JoinAccountDialog: React.FC<JoinAccountDialogProps> = ({ open, onClose, accountId }) => {
  const { token, fetchUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounts/${accountId}/contacts/me/link-by-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, middleName: middleName || undefined, lastName }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Failed to join account');
      } else {
        await fetchUser();
        onClose();
      }
    } catch {
      setError('Failed to join account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Join Organization</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          margin="dense"
          label="First name"
          fullWidth
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="Middle name (optional)"
          fullWidth
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Last name"
          fullWidth
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Joining...' : 'Join'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinAccountDialog;


