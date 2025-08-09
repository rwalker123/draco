'use client';
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Tabs, Tab } from '@mui/material';
import { AccountRegistrationService, CombinedRegistrationPayload } from '../../services/accountRegistrationService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  accountId: string;
  defaultMode?: 'newUser' | 'existingUser';
}

const CombinedRegistrationDialog: React.FC<Props> = ({ open, onClose, accountId, defaultMode = 'newUser' }) => {
  const { fetchUser } = useAuth();
  const [mode, setMode] = useState<'newUser' | 'existingUser'>(defaultMode);
  const [email, setEmail] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: CombinedRegistrationPayload =
        mode === 'newUser'
          ? { mode, email, password, firstName, middleName: middleName || undefined, lastName }
          : {
              mode,
              usernameOrEmail,
              password,
              firstName,
              middleName: middleName || undefined,
              lastName: lastName || undefined,
            };
      const { token } = await AccountRegistrationService.combinedRegister(accountId, payload);
      if (token) {
        localStorage.setItem('jwtToken', token);
        await fetchUser();
      }
      onClose();
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register to this organization</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ mb: 2 }}>
          <Tab value="newUser" label="Create login + register" />
          <Tab value="existingUser" label="I'm already a user" />
        </Tabs>
        {mode === 'newUser' ? (
          <>
            <TextField fullWidth margin="dense" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField fullWidth margin="dense" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </>
        ) : (
          <>
            <TextField fullWidth margin="dense" label="Username or Email" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} required />
            <TextField fullWidth margin="dense" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </>
        )}
        <TextField fullWidth margin="dense" label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <TextField fullWidth margin="dense" label="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
        <TextField fullWidth margin="dense" label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required={mode === 'newUser'} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Submitting...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CombinedRegistrationDialog;


